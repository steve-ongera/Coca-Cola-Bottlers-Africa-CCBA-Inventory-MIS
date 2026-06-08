import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { productAPI, categoryAPI, supplierAPI } from '../services/api.js';

const EMPTY_FORM = {
  sku: '', name: '', description: '', category: '', supplier: '',
  brand: 'Coca-Cola', unit: 'pcs', buying_price: '', selling_price: '',
  quantity_in_stock: '', reorder_level: 10, status: 'active', image: null,
};

function ProductModal({ product, categories, suppliers, onClose, onSaved }) {
  const [form, setForm] = useState(product ? {
    sku: product.sku, name: product.name, description: product.description || '',
    category: product.category, supplier: product.supplier || '',
    brand: product.brand, unit: product.unit,
    buying_price: product.buying_price, selling_price: product.selling_price,
    quantity_in_stock: product.quantity_in_stock, reorder_level: product.reorder_level,
    status: product.status, image: null,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (product) {
        await productAPI.update(product.id, form);
        toast.success('Product updated.');
      } else {
        await productAPI.create(form);
        toast.success('Product created.');
      }
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save product.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-control" value={form.sku} onChange={e => set('sku', e.target.value)} required placeholder="e.g. CC-CL-500ML" />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Coca-Cola Classic 500ml" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-control" value={form.supplier} onChange={e => set('supplier', e.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-control" value={form.brand} onChange={e => set('brand', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-control" value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {['pcs','crate','pack','litre','ml','kg','box'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Buying Price (KES) *</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.buying_price} onChange={e => set('buying_price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (KES) *</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity in Stock *</label>
                <input className="form-control" type="number" min="0" value={form.quantity_in_stock} onChange={e => set('quantity_in_stock', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input className="form-control" type="number" min="0" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input className="form-control" type="file" accept="image/*" onChange={e => set('image', e.target.files[0])} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Saving…</> : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ product, onConfirm, onClose, loading }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h3>Delete Product</h3>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width:56,height:56,borderRadius:'50%',background:'var(--clr-danger-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24,color:'var(--clr-danger)' }}>
              <i className="bi bi-trash3" />
            </div>
            <p style={{ color:'var(--clr-text)',fontSize:14 }}>
              Are you sure you want to delete <strong>{product?.name}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalProduct, setModalProduct] = useState(undefined); // undefined=closed, null=new
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search: search || undefined, category: filterCategory || undefined, status: filterStatus || undefined };
      const { data } = await productAPI.list(params);
      const results = data.results || data;
      setProducts(Array.isArray(results) ? results : []);
      if (data.count !== undefined) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch { toast.error('Failed to load products.'); }
    finally { setLoading(false); }
  }, [page, search, filterCategory, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryAPI.list().then(r => setCategories(r.data.results || r.data || [])).catch(() => {});
    supplierAPI.list().then(r => setSuppliers(r.data.results || r.data || [])).catch(() => {});
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productAPI.delete(deleteProduct.id);
      toast.success('Product deleted.');
      setDeleteProduct(null);
      load();
    } catch { toast.error('Failed to delete product.'); }
    finally { setDeleting(false); }
  };

  const fmt = n => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Products</h1>
          <p>Manage your Coca-Cola product inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalProduct(null)}>
          <i className="bi bi-plus-lg" /> Add Product
        </button>
      </div>

      {/* Filters bar */}
      <div className="card mb-4" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 220px', maxWidth: 300 }}>
            <i className="bi bi-search" />
            <input
              className="form-control"
              placeholder="Search products, SKU…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="form-control" style={{ maxWidth: 200 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-control" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm"><i className="bi bi-file-earmark-excel" /> Excel</button>
            <button className="btn btn-outline btn-sm"><i className="bi bi-file-earmark-pdf" /> PDF</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-box-seam" />
            <h4>No products found</h4>
            <p>Try adjusting your filters or add a new product.</p>
            <button className="btn btn-primary mt-3" onClick={() => setModalProduct(null)}>Add Product</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Buying</th>
                <th>Selling</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: 'var(--clr-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <i className="bi bi-box-seam" style={{ color: 'var(--clr-text-muted)', fontSize: 18 }} />
                        }
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td><code style={{ fontSize: 12, background: 'var(--clr-bg)', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                  <td className="text-sm">{p.category_name}</td>
                  <td className="text-sm text-muted">{p.brand}</td>
                  <td className="text-sm">{fmt(p.buying_price)}</td>
                  <td className="text-sm fw-600">{fmt(p.selling_price)}</td>
                  <td className="text-sm text-muted">{p.unit}</td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: 13,
                      color: p.is_out_of_stock ? 'var(--clr-danger)' : p.is_low_stock ? 'var(--clr-warning)' : 'var(--clr-success)',
                    }}>
                      {p.quantity_in_stock}
                    </span>
                    {p.is_low_stock && !p.is_out_of_stock && (
                      <span className="badge badge-warning text-xs" style={{ marginLeft: 6 }}>Low</span>
                    )}
                    {p.is_out_of_stock && (
                      <span className="badge badge-danger text-xs" style={{ marginLeft: 6 }}>Out</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'inactive' ? 'badge-warning' : 'badge-neutral'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon-only btn-sm" title="Edit" onClick={() => setModalProduct(p)}>
                        <i className="bi bi-pencil" style={{ fontSize: 14 }} />
                      </button>
                      <button className="btn btn-ghost btn-icon-only btn-sm" title="Delete"
                        style={{ color: 'var(--clr-danger)' }} onClick={() => setDeleteProduct(p)}>
                        <i className="bi bi-trash3" style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--clr-border-soft)' }}>
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => { setModalProduct(undefined); load(); }}
        />
      )}
      {deleteProduct && (
        <ConfirmModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}