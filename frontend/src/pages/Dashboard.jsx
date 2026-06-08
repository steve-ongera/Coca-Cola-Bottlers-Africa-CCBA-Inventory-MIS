import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement,
} from 'chart.js';
import { reportAPI } from '../services/api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement);

function StatCard({ icon, iconClass, label, value, change, changeDir }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeDir === 'up' ? 'up' : 'down'}`}>
            <i className={`bi bi-arrow-${changeDir}-right`} />
            {change}% vs last month
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reportAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);
  const num = (n) => new Intl.NumberFormat('en-KE').format(n || 0);

  // Chart data
  const months = data?.monthly_revenue?.map(m => m.month) || [];
  const revenues = data?.monthly_revenue?.map(m => m.revenue) || [];
  const orders = data?.monthly_revenue?.map(m => m.orders) || [];

  const barData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue (KES)',
        data: revenues,
        backgroundColor: 'rgba(232, 0, 27, 0.85)',
        borderRadius: 5,
        borderSkipped: false,
      },
      {
        label: 'Orders',
        data: orders,
        backgroundColor: 'rgba(26, 26, 46, 0.15)',
        borderRadius: 5,
        borderSkipped: false,
        yAxisID: 'y1',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { font: { family: 'DM Sans', size: 12 } } } },
    scales: {
      y: {
        ticks: { font: { family: 'DM Sans', size: 11 }, callback: v => `KES ${(v/1000).toFixed(0)}K` },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y1: {
        position: 'right',
        ticks: { font: { family: 'DM Sans', size: 11 } },
        grid: { display: false },
      },
      x: { ticks: { font: { family: 'DM Sans', size: 11 } }, grid: { display: false } },
    },
  };

  const summary = data?.summary || {};
  const topProducts = data?.top_products || [];
  const recentSales = data?.recent_sales || [];

  if (loading) {
    return (
      <div className="loading-overlay" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <span className="text-muted text-sm">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here's your inventory overview.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sales/new')}>
          <i className="bi bi-plus-lg" /> New Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        <StatCard
          icon="bi-currency-exchange"
          iconClass="red"
          label="Sales This Month"
          value={fmt(summary.total_sales_this_month)}
          change={Math.abs(summary.sales_change_pct)}
          changeDir={summary.sales_change_pct >= 0 ? 'up' : 'down'}
        />
        <StatCard
          icon="bi-cart-check-fill"
          iconClass="green"
          label="Orders This Month"
          value={num(summary.sales_orders_this_month)}
          change={8}
          changeDir="up"
        />
        <StatCard
          icon="bi-box-seam-fill"
          iconClass="navy"
          label="Total Products"
          value={num(summary.total_products)}
        />
        <StatCard
          icon="bi-exclamation-triangle-fill"
          iconClass="amber"
          label="Low Stock Alerts"
          value={num(summary.low_stock_count)}
          change={summary.out_of_stock_count}
          changeDir="down"
        />
      </div>

      {/* Chart + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <h3>Revenue Overview — {new Date().getFullYear()}</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/reports')}>
              Full Report <i className="bi bi-arrow-right" />
            </button>
          </div>
          <div className="card-body">
            {months.length > 0 ? (
              <Bar data={barData} options={barOptions} height={180} />
            ) : (
              <div className="empty-state">
                <i className="bi bi-bar-chart" />
                <h4>No data yet</h4>
                <p>Revenue data will appear here once sales are recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3>Top Products</h3>
            <span className="badge badge-neutral text-xs">This Month</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.sku} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                borderBottom: i < topProducts.length - 1 ? '1px solid var(--clr-border-soft)' : 'none',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: i === 0 ? 'var(--clr-red-light)' : 'var(--clr-bg)',
                  color: i === 0 ? 'var(--clr-red)' : 'var(--clr-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div className="text-muted text-xs">{num(p.units_sold)} units</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', whiteSpace: 'nowrap' }}>
                  {fmt(p.revenue)}
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <i className="bi bi-bag" />
                <p>No sales data this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'New Sale', icon: 'bi-plus-circle', path: '/sales/new', cls: 'btn-primary' },
              { label: 'Add Product', icon: 'bi-box-seam', path: '/products', cls: 'btn-secondary' },
              { label: 'View Reports', icon: 'bi-bar-chart-line', path: '/reports', cls: 'btn-outline' },
              { label: 'Low Stock', icon: 'bi-exclamation-triangle', path: '/products?low_stock=true', cls: 'btn-outline' },
            ].map(a => (
              <button key={a.path} className={`btn ${a.cls}`} style={{ justifyContent: 'flex-start' }}
                onClick={() => navigate(a.path)}>
                <i className={`bi ${a.icon}`} /> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Sales</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sales')}>
              View all <i className="bi bi-arrow-right" />
            </button>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? recentSales.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{s.reference}</span></td>
                    <td className="text-sm">{s.customer_name || '—'}</td>
                    <td className="text-sm text-muted">{s.item_count}</td>
                    <td className="fw-600 text-sm">{fmt(s.total_amount)}</td>
                    <td>
                      <span className={`badge ${
                        s.status === 'completed' ? 'badge-success' :
                        s.status === 'pending'   ? 'badge-warning' :
                        s.status === 'cancelled' ? 'badge-danger'  : 'badge-navy'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{s.sale_date}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6}><div className="empty-state" style={{ padding: 32 }}>
                    <i className="bi bi-receipt" />
                    <p>No recent sales</p>
                  </div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--clr-text-muted)', fontSize: 12 }}>
        © 2026 Coca-Cola Bottlers Africa (CCBA) — Inventory MIS
      </div>
    </div>
  );
}