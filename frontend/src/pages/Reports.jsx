import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { reportAPI } from '../services/api.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

function StatMini({ label, value, change, up, icon, color }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-muted)' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {change !== undefined && (
        <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, color: up ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
          <i className={`bi bi-arrow-${up ? 'up' : 'down'}-right`} />
          {change}% from last month
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [trend, setTrend] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [db, tr, tp, ls] = await Promise.all([
          reportAPI.dashboard(),
          reportAPI.salesTrend({ period, year }),
          reportAPI.topProducts({ limit: 10 }),
          reportAPI.lowStock(),
        ]);
        setDashboard(db.data);
        setTrend(tr.data);
        setTopProducts(Array.isArray(tp.data) ? tp.data : []);
        setLowStock(Array.isArray(ls.data) ? ls.data : (ls.data.results || []));
      } catch { toast.error('Failed to load report data.'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [period, year]);

  const fmt = n => `KES ${Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
  const num = n => Number(n || 0).toLocaleString('en-KE');

  const summary = dashboard?.summary || {};
  const trendData = trend?.data || [];

  // Revenue vs Purchases bar chart
  const barData = {
    labels: trendData.map(d => d.label),
    datasets: [
      {
        label: 'Revenue',
        data: trendData.map(d => d.revenue),
        backgroundColor: 'rgba(232, 0, 27, 0.85)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Purchases',
        data: trendData.map(d => d.purchases),
        backgroundColor: 'rgba(26, 26, 46, 0.15)',
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { family: 'DM Sans', size: 12 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
    },
    scales: {
      y: {
        ticks: { font: { family: 'DM Sans', size: 11 }, callback: v => `${(v / 1000).toFixed(0)}K` },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { ticks: { font: { family: 'DM Sans', size: 11 } }, grid: { display: false } },
    },
  };

  // Orders line chart
  const lineData = {
    labels: trendData.map(d => d.label),
    datasets: [{
      label: 'Orders',
      data: trendData.map(d => d.orders),
      borderColor: 'var(--clr-red)',
      backgroundColor: 'rgba(232, 0, 27, 0.08)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'var(--clr-red)',
      tension: 0.4,
      fill: true,
    }],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { ticks: { font: { family: 'DM Sans', size: 11 } }, grid: { display: false } },
    },
  };

  // Doughnut for stock status
  const stockTotal = (summary.total_products || 0);
  const lowStockCount = summary.low_stock_count || 0;
  const outCount = summary.out_of_stock_count || 0;
  const healthyCount = Math.max(0, stockTotal - lowStockCount - outCount);

  const doughnutData = {
    labels: ['Healthy', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [healthyCount, lowStockCount - outCount, outCount],
      backgroundColor: ['#0A8754', '#D97706', '#DC2626'],
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '70%',
    plugins: { legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, boxWidth: 10, padding: 12 } } },
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',      icon: 'bi-grid-1x2' },
    { id: 'sales',     label: 'Sales Trend',   icon: 'bi-graph-up' },
    { id: 'products',  label: 'Top Products',  icon: 'bi-trophy' },
    { id: 'stock',     label: 'Stock Alerts',  icon: 'bi-exclamation-triangle' },
  ];

  if (loading) {
    return <div className="loading-overlay" style={{ flexDirection: 'column', gap: 16 }}><div className="spinner" /><span className="text-muted text-sm">Loading reports…</span></div>;
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Business intelligence for CCBA inventory operations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm"><i className="bi bi-file-earmark-pdf" /> Export PDF</button>
          <button className="btn btn-outline btn-sm"><i className="bi bi-file-earmark-excel" /> Export Excel</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--clr-surface)', padding: 4, borderRadius: 10, border: '1px solid var(--clr-border)', width: 'fit-content', boxShadow: 'var(--shadow-xs)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 180ms',
              background: activeTab === tab.id ? 'var(--clr-red)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--clr-text-muted)',
            }}>
            <i className={`bi ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid-4 mb-6">
            <StatMini label="Revenue (Month)" value={fmt(summary.total_sales_this_month)} change={Math.abs(summary.sales_change_pct)} up={summary.sales_change_pct >= 0} icon="bi-currency-exchange" color="var(--clr-red)" />
            <StatMini label="Orders (Month)" value={num(summary.sales_orders_this_month)} change={8} up icon="bi-cart-check" color="var(--clr-success)" />
            <StatMini label="Total Products" value={num(summary.total_products)} icon="bi-box-seam" color="var(--clr-info)" />
            <StatMini label="Low Stock Alerts" value={num(summary.low_stock_count)} icon="bi-exclamation-triangle" color="var(--clr-warning)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="card-header">
                <h3>Revenue vs Purchases</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="form-control" style={{ fontSize: 12, padding: '4px 8px', maxWidth: 120 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="card-body">
                {trendData.length > 0
                  ? <Bar data={barData} options={barOptions} height={160} />
                  : <div className="empty-state" style={{ padding: 40 }}><i className="bi bi-bar-chart" /><p>No data for this period</p></div>
                }
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Stock Health</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ maxWidth: 200, marginBottom: 16 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>{stockTotal}</div>
                  <div className="text-muted text-sm">Total Products</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SALES TREND TAB ── */}
      {activeTab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--clr-bg)', padding: 3, borderRadius: 8 }}>
              {['monthly', 'daily'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, background: period === p ? 'var(--clr-surface)' : 'transparent', color: period === p ? 'var(--clr-text)' : 'var(--clr-text-muted)', boxShadow: period === p ? 'var(--shadow-xs)' : 'none' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {period === 'monthly' && (
              <select className="form-control" style={{ maxWidth: 120 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>

          <div className="card">
            <div className="card-header"><h3>Revenue Trend</h3></div>
            <div className="card-body">
              {trendData.length > 0
                ? <Bar data={barData} options={barOptions} height={140} />
                : <div className="empty-state" style={{ padding: 40 }}><i className="bi bi-bar-chart" /><p>No data for this period</p></div>
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Order Volume</h3></div>
            <div className="card-body">
              {trendData.length > 0
                ? <Line data={lineData} options={lineOptions} height={120} />
                : <div className="empty-state" style={{ padding: 40 }}><i className="bi bi-graph-up" /><p>No order data</p></div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── TOP PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <div className="card">
          <div className="card-header">
            <h3>Top Selling Products</h3>
            <span className="badge badge-neutral text-xs">{topProducts.length} products</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="empty-state"><i className="bi bi-trophy" /><h4>No sales data yet</h4><p>Sales data will populate once transactions are recorded.</p></div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Revenue Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const maxRev = topProducts[0]?.revenue || 1;
                    const barPct = (p.revenue / maxRev) * 100;
                    return (
                      <tr key={p.product_id}>
                        <td>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? 'var(--clr-red-light)' : 'var(--clr-bg)', color: i === 0 ? 'var(--clr-red)' : 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                        <td className="text-sm text-muted">{p.category}</td>
                        <td className="text-sm">{num(p.units_sold)}</td>
                        <td className="fw-600 text-sm">{fmt(p.revenue)}</td>
                        <td className="text-sm" style={{ color: p.profit >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)' }}>{fmt(p.profit)}</td>
                        <td style={{ width: 160 }}>
                          <div style={{ height: 6, background: 'var(--clr-bg)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barPct}%`, background: i === 0 ? 'var(--clr-red)' : 'var(--clr-navy-light)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STOCK ALERTS TAB ── */}
      {activeTab === 'stock' && (
        <div>
          <div className="grid-2 mb-4">
            <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--clr-warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: 'var(--clr-warning-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--clr-warning)' }}><i className="bi bi-exclamation-triangle-fill" /></div>
                <div>
                  <div className="text-muted text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Low Stock</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{summary.low_stock_count || 0}</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--clr-danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: 'var(--clr-danger-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--clr-danger)' }}><i className="bi bi-x-circle-fill" /></div>
                <div>
                  <div className="text-muted text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}>Out of Stock</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{summary.out_of_stock_count || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Low Stock Products</h3>
              <span className="badge badge-warning">{lowStock.length} items need attention</span>
            </div>
            {lowStock.length === 0 ? (
              <div className="empty-state"><i className="bi bi-check-circle" style={{ color: 'var(--clr-success)' }} /><h4>All products are well-stocked!</h4><p>No items are below reorder level.</p></div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>In Stock</th>
                      <th>Reorder Level</th>
                      <th>Shortage</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map(p => {
                      const shortage = p.reorder_level - p.quantity_in_stock;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                          <td><code style={{ fontSize: 11, background: 'var(--clr-bg)', padding: '2px 5px', borderRadius: 3 }}>{p.sku}</code></td>
                          <td className="text-sm text-muted">{p.category_name}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: p.is_out_of_stock ? 'var(--clr-danger)' : 'var(--clr-warning)' }}>
                              {p.quantity_in_stock}
                            </span>
                          </td>
                          <td className="text-sm text-muted">{p.reorder_level}</td>
                          <td className="text-sm" style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>-{shortage}</td>
                          <td>
                            <span className={`badge ${p.is_out_of_stock ? 'badge-danger' : 'badge-warning'}`}>
                              {p.is_out_of_stock ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}