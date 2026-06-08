import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { saleAPI, productAPI, customerAPI } from '../services/api.js';

const EMPTY_ITEM = { product: null, quantity: 1, unit_price: '', discount: 0 };

export default function NewSale() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [form, setForm] = useState({
    customer: '',
    payment_method: 'cash',
    sale_date: new Date().toISOString().split('T')[0],
    discount: 0,
    tax: 0,
    notes: '',
    status: 'completed',
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM, _id: Date.now() }]);
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const dropdownRefs = useRef({});

  useEffect(() => {
    productAPI.list({ page_size: 200 })
      .then(r => setProducts(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    customerAPI.list({ page_size: 200 })
      .then(r => setCustomers(r.data.results || r.data || []))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key].contains(e.target)) {
          setShowDropdown(prev => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM, _id: Date.now() }]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i._id !== id));

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item._id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'product' && value) {
        updated.unit_price = value.selling_price;
      }
      return updated;
    }));
  };

  const selectProduct = (itemId, product) => {
    updateItem(itemId, 'product', product);
    setShowDropdown(prev => ({ ...prev, [itemId]: false }));
    setProductSearch(prev => ({ ...prev, [itemId]: '' }));
  };

  const filteredProducts = (search) => {
    if (!search) return products.slice(0, 10);
    const q = search.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 10);
  };

  // Calculations
  const itemsSubtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.unit_price) || 0;
    const qty = parseInt(item.quantity) || 0;
    const disc = parseFloat(item.discount) || 0;
    return acc + (price * qty - disc);
  }, 0);
  const globalDiscount = parseFloat(form.discount) || 0;
  const tax = parseFloat(form.tax) || 0;
  const total = itemsSubtotal - globalDiscount + tax;

  const fmt = n => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const validate = () => {
    if (items.length === 0) { toast.error('Add at least one item.'); return false; }
    for (const item of items) {
      if (!item.product) { toast.error('Select a product for all items.'); return false; }
      if (!item.quantity || item.quantity < 1) { toast.error('Quantity must be at least 1.'); return false; }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) { toast.error('Unit price must be greater than 0.'); return false; }
      if (item.quantity > item.product.quantity_in_stock) {
        toast.error(`Insufficient stock for ${item.product.name}. Available: ${item.product.quantity_in_stock}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        customer: form.customer || null,
        items: items.map(item => ({
          product: item.product.id,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount: parseFloat(item.discount) || 0,
        })),
      };
      await saleAPI.create(payload);
      toast.success('Sale recorded successfully!');
      navigate('/sales');
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to record sale.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>New Sale</h1>
          <p>Record a new sales transaction</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/sales')}>
          <i className="bi bi-arrow-left" /> Back to Sales
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left — items + details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Sale Details */}
            <div className="card">
              <div className="card-header"><h3>Sale Details</h3></div>
              <div className="card-body">
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Customer <span className="text-muted text-xs">(optional)</span></label>
                    <select className="form-control" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))}>
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Method *</label>
                    <select className="form-control" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} required>
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sale Date *</label>
                    <input type="date" className="form-control" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card">
              <div className="card-header">
                <h3>Items</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
                  <i className="bi bi-plus-lg" /> Add Item
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 90px 130px 110px 36px', gap: 8, padding: '10px 20px', background: '#F9F9F6', borderBottom: '1px solid var(--clr-border-soft)' }}>
                  {['Product', 'Qty', 'Unit Price', 'Discount', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-text-muted)' }}>{h}</div>
                  ))}
                </div>

                {items.map((item, idx) => (
                  <div key={item._id} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 130px 110px 36px', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--clr-border-soft)', alignItems: 'center' }}>
                    {/* Product picker */}
                    <div ref={el => dropdownRefs.current[item._id] = el} style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)', fontSize: 13 }} />
                        <input
                          className="form-control"
                          style={{ paddingLeft: 28, fontSize: 13 }}
                          placeholder={loadingProducts ? 'Loading…' : 'Search product…'}
                          value={showDropdown[item._id] ? (productSearch[item._id] || '') : (item.product?.name || '')}
                          onFocus={() => {
                            setShowDropdown(prev => ({ ...prev, [item._id]: true }));
                            setProductSearch(prev => ({ ...prev, [item._id]: '' }));
                          }}
                          onChange={e => setProductSearch(prev => ({ ...prev, [item._id]: e.target.value }))}
                        />
                      </div>
                      {showDropdown[item._id] && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 100, maxHeight: 240, overflowY: 'auto' }}>
                          {filteredProducts(productSearch[item._id]).length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--clr-text-muted)' }}>No products found</div>
                          ) : filteredProducts(productSearch[item._id]).map(p => (
                            <div
                              key={p.id}
                              onClick={() => selectProduct(item._id, p)}
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--clr-border-soft)', fontSize: 13 }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--clr-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                                <span>{p.sku}</span>
                                <span>•</span>
                                <span style={{ color: p.quantity_in_stock <= p.reorder_level ? 'var(--clr-warning)' : 'var(--clr-success)' }}>
                                  {p.quantity_in_stock} in stock
                                </span>
                                <span>•</span>
                                <span>KES {Number(p.selling_price).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Qty */}
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontSize: 13 }}
                      min={1}
                      max={item.product?.quantity_in_stock || 9999}
                      value={item.quantity}
                      onChange={e => updateItem(item._id, 'quantity', e.target.value)}
                    />

                    {/* Unit price */}
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontSize: 13 }}
                      min={0}
                      step="0.01"
                      value={item.unit_price}
                      onChange={e => updateItem(item._id, 'unit_price', e.target.value)}
                      placeholder="0.00"
                    />

                    {/* Discount */}
                    <input
                      type="number"
                      className="form-control"
                      style={{ fontSize: 13 }}
                      min={0}
                      step="0.01"
                      value={item.discount}
                      onChange={e => updateItem(item._id, 'discount', e.target.value)}
                      placeholder="0.00"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon-only btn-sm"
                      style={{ color: 'var(--clr-danger)' }}
                      onClick={() => removeItem(item._id)}
                      disabled={items.length === 1}
                    >
                      <i className="bi bi-trash3" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                ))}

                <div style={{ padding: '12px 20px' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
                    <i className="bi bi-plus-lg" /> Add another item
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-header"><h3>Notes</h3></div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Optional notes for this sale…"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Right — summary */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header"><h3>Order Summary</h3></div>
              <div className="card-body">
                {/* Items preview */}
                {items.filter(i => i.product).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {items.filter(i => i.product).map(item => {
                      const sub = ((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)) - (parseFloat(item.discount) || 0);
                      return (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--clr-border-soft)' }}>
                          <span style={{ color: 'var(--clr-text-muted)' }}>
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className="fw-600">{fmt(sub)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Global Discount (KES)</label>
                  <input type="number" className="form-control" min={0} step="0.01"
                    value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax (KES)</label>
                  <input type="number" className="form-control" min={0} step="0.01"
                    value={form.tax} onChange={e => setForm(p => ({ ...p, tax: e.target.value }))} />
                </div>

                <div style={{ borderTop: '1px solid var(--clr-border-soft)', paddingTop: 14, marginTop: 4 }}>
                  {[
                    { label: 'Items Subtotal', value: fmt(itemsSubtotal) },
                    { label: 'Discount',       value: `- ${fmt(globalDiscount)}` },
                    { label: 'Tax',            value: fmt(tax) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                      <span className="text-muted">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--clr-border)', fontSize: 18, fontWeight: 700 }}>
                    <span>TOTAL</span>
                    <span style={{ color: 'var(--clr-red)' }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 15 }} disabled={submitting}>
              {submitting
                ? <><span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Processing…</>
                : <><i className="bi bi-check2-circle" /> Record Sale</>
              }
            </button>
            <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/sales')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}