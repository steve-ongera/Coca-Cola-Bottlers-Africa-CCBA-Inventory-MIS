import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { saleAPI } from '../services/api.js';

function SaleDetailModal({ sale, onClose }) {
  const fmt = n => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const statusClass = {
    completed: 'badge-success',
    pending:   'badge-warning',
    cancelled: 'badge-danger',
    refunded:  'badge-info',
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <h3 style={{ marginBottom: 4 }}>Sale Detail</h3>
            <code style={{ fontSize: 13, color: 'var(--clr-red)' }}>{sale.reference}</code>
          </div>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="modal-body">
          {/* Meta grid */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {[
              { label: 'Customer',        value: sale.customer_name || 'Walk-in' },
              { label: 'Sold By',         value: sale.sold_by_name || '—' },
              { label: 'Sale Date',       value: sale.sale_date },
              { label: 'Payment Method',  value: sale.payment_method?.toUpperCase() },
              { label: 'Status',          value: <span className={`badge ${statusClass[sale.status]}`}>{sale.status}</span> },
              { label: 'Items',           value: sale.items?.length || 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 8 }}>
                <div className="text-xs text-muted fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div className="table-container" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{item.product_name}</td>
                    <td><code style={{ fontSize: 11, background: 'var(--clr-bg)', padding: '2px 5px', borderRadius: 3 }}>{item.product_sku}</code></td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.unit_price)}</td>
                    <td>{item.discount > 0 ? fmt(item.discount) : '—'}</td>
                    <td className="fw-600">{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ maxWidth: 280, marginLeft: 'auto' }}>
            {[
              { label: 'Subtotal',  value: fmt(sale.subtotal) },
              { label: 'Discount',  value: `- ${fmt(sale.discount)}` },
              { label: 'Tax',       value: fmt(sale.tax) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--clr-border-soft)', fontSize: 13 }}>
                <span className="text-muted">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--clr-red)' }}>{fmt(sale.total_amount)}</span>
            </div>
          </div>

          {sale.notes && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 8, fontSize: 13, color: 'var(--clr-text-muted)' }}>
              <strong>Notes:</strong> {sale.notes}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer" /> Print
          </button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Sales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailSale, setDetailSale] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        status: filterStatus || undefined,
        payment_method: filterPayment || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      const { data } = await saleAPI.list(params);
      const results = data.results || data;
      setSales(Array.isArray(results) ? results : []);
      if (data.count !== undefined) {
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / PAGE_SIZE));
      }
    } catch { toast.error('Failed to load sales.'); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterPayment, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (sale) => {
    setLoadingDetail(true);
    try {
      const { data } = await saleAPI.get(sale.id);
      setDetailSale(data);
    } catch { toast.error('Failed to load sale detail.'); }
    finally { setLoadingDetail(false); }
  };

  const fmt = n => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  const statusClass = { completed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger', refunded: 'badge-info' };
  const paymentIcon = { cash: 'bi-cash-coin', mpesa: 'bi-phone-fill', bank: 'bi-bank', credit: 'bi-credit-card' };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Sales</h1>
          <p>{totalCount > 0 ? `${totalCount.toLocaleString()} total transactions` : 'Manage and track all sales'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sales/new')}>
          <i className="bi bi-plus-lg" /> New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-control" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select className="form-control" style={{ maxWidth: 160 }} value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1); }}>
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank Transfer</option>
            <option value="credit">Credit</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            <span className="text-muted text-sm">to</span>
            <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          {(filterStatus || filterPayment || dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPayment(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
              <i className="bi bi-x-circle" /> Clear filters
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm"><i className="bi bi-file-earmark-excel" /> Export</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-receipt" />
            <h4>No sales found</h4>
            <p>Try adjusting your filters or record a new sale.</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate('/sales/new')}>New Sale</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Sold By</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--clr-red)' }}>
                      {sale.reference}
                    </span>
                  </td>
                  <td className="text-sm">{sale.customer_name || <span className="text-muted">Walk-in</span>}</td>
                  <td className="text-sm text-muted">{sale.sold_by_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className={`bi ${paymentIcon[sale.payment_method] || 'bi-cash'}`} style={{ fontSize: 13, color: 'var(--clr-text-muted)' }} />
                      <span className="text-sm">{sale.payment_method?.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{sale.item_count}</td>
                  <td className="fw-600 text-sm">{fmt(sale.total_amount)}</td>
                  <td>
                    <span className={`badge ${statusClass[sale.status] || 'badge-neutral'}`}>{sale.status}</span>
                  </td>
                  <td className="text-sm text-muted">{sale.sale_date}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon-only btn-sm"
                      title="View Detail"
                      onClick={() => openDetail(sale)}
                      disabled={loadingDetail}
                    >
                      <i className="bi bi-eye" style={{ fontSize: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && sales.length > 0 && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--clr-border-soft)' }}>
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return n <= totalPages ? (
                  <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                ) : null;
              })}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailSale && <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />}
    </div>
  );
}