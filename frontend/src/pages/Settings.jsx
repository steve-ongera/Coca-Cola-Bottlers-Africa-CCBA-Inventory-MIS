import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../App.jsx';

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS', 'ZAR'];
const TIMEZONES  = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'UTC'];
const DATE_FMTS  = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('general');

  // General settings state
  const [general, setGeneral] = useState({
    company_name:    'Coca-Cola Bottlers Africa',
    company_email:   'mis@ccba.co.ke',
    company_phone:   '+254 700 000 000',
    company_address: 'Nairobi, Kenya',
    currency:        'KES',
    timezone:        'Africa/Nairobi',
    date_format:     'DD/MM/YYYY',
    low_stock_alert: 10,
    tax_rate:        16,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_low_stock:     true,
    email_new_sale:      false,
    email_daily_report:  true,
    email_weekly_report: true,
    browser_low_stock:   true,
    browser_new_sale:    true,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    sidebar_collapsed_default: false,
    items_per_page:            15,
    show_product_images:       true,
    compact_tables:            false,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (section) => {
    setSaving(section);
    await new Promise(r => setTimeout(r, 700)); // Simulate API call
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved.`);
    setSaving(false);
  };

  const SaveBtn = ({ section }) => (
    <button className="btn btn-primary" disabled={!!saving} onClick={() => handleSave(section)}>
      {saving === section
        ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Saving…</>
        : <><i className="bi bi-check2" /> Save Changes</>
      }
    </button>
  );

  const Toggle = ({ value, onChange, disabled }) => (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--clr-red)' : 'var(--clr-border)',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 200ms', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}>
      <div style={{
        position: 'absolute',
        top: 3, left: value ? 23 : 3,
        width: 18, height: 18,
        borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 200ms',
      }} />
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--clr-border-soft)', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {description && <div className="text-muted text-sm">{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );

  const TABS = [
    { id: 'general',       label: 'General',       icon: 'bi-gear-fill' },
    { id: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
    { id: 'appearance',    label: 'Appearance',    icon: 'bi-palette-fill' },
    { id: 'security',      label: 'Security',      icon: 'bi-shield-lock-fill' },
    { id: 'system',        label: 'System',        icon: 'bi-cpu-fill' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your CCBA Inventory MIS preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: 8 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
                borderRadius: 7, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
                background: activeTab === tab.id ? 'var(--clr-red-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--clr-red)' : 'var(--clr-text-muted)',
                marginBottom: 2, transition: 'all 180ms',
              }}>
              <i className={`bi ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>

          {/* ── GENERAL ── */}
          {activeTab === 'general' && (
            <div className="card">
              <div className="card-header"><h3>General Settings</h3></div>
              <div className="card-body">
                {!isAdmin && (
                  <div style={{ padding: '10px 14px', background: 'var(--clr-warning-bg)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--clr-warning)' }}>
                    <i className="bi bi-lock-fill" />
                    Some settings require administrator privileges to modify.
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-text-muted)', marginBottom: 14 }}>Company Information</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input className="form-control" value={general.company_name}
                        onChange={e => setGeneral(p => ({ ...p, company_name: e.target.value }))}
                        disabled={!isAdmin} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input className="form-control" type="email" value={general.company_email}
                        onChange={e => setGeneral(p => ({ ...p, company_email: e.target.value }))}
                        disabled={!isAdmin} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-control" value={general.company_phone}
                        onChange={e => setGeneral(p => ({ ...p, company_phone: e.target.value }))}
                        disabled={!isAdmin} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input className="form-control" value={general.company_address}
                        onChange={e => setGeneral(p => ({ ...p, company_address: e.target.value }))}
                        disabled={!isAdmin} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-text-muted)', marginBottom: 14 }}>Regional & Inventory</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select className="form-control" value={general.currency}
                        onChange={e => setGeneral(p => ({ ...p, currency: e.target.value }))}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="form-control" value={general.timezone}
                        onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))}>
                        {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date Format</label>
                      <select className="form-control" value={general.date_format}
                        onChange={e => setGeneral(p => ({ ...p, date_format: e.target.value }))}>
                        {DATE_FMTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Tax Rate (%)</label>
                      <input className="form-control" type="number" min={0} max={100} step={0.1}
                        value={general.tax_rate}
                        onChange={e => setGeneral(p => ({ ...p, tax_rate: e.target.value }))}
                        disabled={!isAdmin} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Default Low Stock Alert Level (units)</label>
                      <input className="form-control" type="number" min={1}
                        value={general.low_stock_alert}
                        onChange={e => setGeneral(p => ({ ...p, low_stock_alert: e.target.value }))} />
                      <small className="text-muted text-xs">Products with stock at or below this level will trigger alerts.</small>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <SaveBtn section="general" />
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header"><h3>Notification Preferences</h3></div>
              <div className="card-body">
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Email Notifications</h4>
                  <p className="text-sm text-muted" style={{ marginBottom: 14 }}>Configure which events trigger email alerts to your registered address.</p>
                  <SettingRow label="Low Stock Alerts" description="Get notified when products fall below reorder level">
                    <Toggle value={notifications.email_low_stock} onChange={v => setNotifications(p => ({ ...p, email_low_stock: v }))} />
                  </SettingRow>
                  <SettingRow label="New Sale Notifications" description="Receive an email for every completed sale">
                    <Toggle value={notifications.email_new_sale} onChange={v => setNotifications(p => ({ ...p, email_new_sale: v }))} />
                  </SettingRow>
                  <SettingRow label="Daily Sales Report" description="Automated daily summary of sales activity">
                    <Toggle value={notifications.email_daily_report} onChange={v => setNotifications(p => ({ ...p, email_daily_report: v }))} />
                  </SettingRow>
                  <SettingRow label="Weekly Analytics Report" description="Weekly overview of inventory and revenue performance">
                    <Toggle value={notifications.email_weekly_report} onChange={v => setNotifications(p => ({ ...p, email_weekly_report: v }))} />
                  </SettingRow>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--clr-text-muted)', marginBottom: 4 }}>In-App Notifications</h4>
                  <p className="text-sm text-muted" style={{ marginBottom: 14 }}>Control what appears in your notification bell.</p>
                  <SettingRow label="Low Stock Alerts" description="Show notification badge for low stock items">
                    <Toggle value={notifications.browser_low_stock} onChange={v => setNotifications(p => ({ ...p, browser_low_stock: v }))} />
                  </SettingRow>
                  <SettingRow label="New Sale Activity" description="Show notification when a new sale is recorded">
                    <Toggle value={notifications.browser_new_sale} onChange={v => setNotifications(p => ({ ...p, browser_new_sale: v }))} />
                  </SettingRow>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <SaveBtn section="notifications" />
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === 'appearance' && (
            <div className="card">
              <div className="card-header"><h3>Appearance & Display</h3></div>
              <div className="card-body">
                <SettingRow label="Collapse Sidebar by Default" description="Start with a collapsed sidebar on every page load">
                  <Toggle value={appearance.sidebar_collapsed_default} onChange={v => setAppearance(p => ({ ...p, sidebar_collapsed_default: v }))} />
                </SettingRow>
                <SettingRow label="Show Product Images" description="Display product thumbnails in tables and lists">
                  <Toggle value={appearance.show_product_images} onChange={v => setAppearance(p => ({ ...p, show_product_images: v }))} />
                </SettingRow>
                <SettingRow label="Compact Tables" description="Reduce row padding for denser data display">
                  <Toggle value={appearance.compact_tables} onChange={v => setAppearance(p => ({ ...p, compact_tables: v }))} />
                </SettingRow>
                <SettingRow label="Items Per Page" description="Default number of rows shown in tables">
                  <select className="form-control" style={{ width: 100 }} value={appearance.items_per_page}
                    onChange={e => setAppearance(p => ({ ...p, items_per_page: parseInt(e.target.value) }))}>
                    {[10, 15, 20, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </SettingRow>
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <SaveBtn section="appearance" />
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header"><h3>Security Settings</h3></div>
              <div className="card-body">
                <div style={{ padding: '14px 16px', background: 'var(--clr-info-bg)', borderRadius: 8, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <i className="bi bi-info-circle-fill" style={{ color: 'var(--clr-info)', marginTop: 1 }} />
                  <div className="text-sm" style={{ color: 'var(--clr-info)' }}>
                    JWT tokens expire after 8 hours. Sessions are invalidated on logout. Contact your admin to configure LDAP or SSO integration.
                  </div>
                </div>

                {[
                  { icon: 'bi-clock-history',     title: 'Session Timeout',          desc: 'Sessions automatically expire after 8 hours of inactivity.',                                        value: '8 hours' },
                  { icon: 'bi-arrow-repeat',       title: 'Token Refresh',            desc: 'Refresh tokens are valid for 7 days and rotate on each use.',                                       value: '7 days' },
                  { icon: 'bi-shield-exclamation', title: 'Login Attempts',           desc: 'Account will be temporarily locked after 5 consecutive failed login attempts.',                     value: '5 attempts' },
                  { icon: 'bi-person-lock',        title: 'Role-Based Access Control', desc: 'Permissions are enforced at the API level based on your assigned role.',                          value: ROLE_LABELS[user?.role] || user?.role },
                ].map(({ icon, title, desc, value }) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--clr-border-soft)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--clr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                      <i className={`bi ${icon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                      <div className="text-muted text-sm">{desc}</div>
                    </div>
                    <span className="badge badge-navy text-xs" style={{ whiteSpace: 'nowrap' }}>{value}</span>
                  </div>
                ))}

                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => toast.info('Audit log export coming soon.')}>
                    <i className="bi bi-file-earmark-text" /> Download Audit Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-header"><h3>System Information</h3></div>
                <div className="card-body">
                  {[
                    { label: 'Application',     value: 'CCBA Inventory MIS' },
                    { label: 'Version',         value: 'v1.0.0' },
                    { label: 'Backend',         value: 'Django 4.2 + DRF 3.14' },
                    { label: 'Frontend',        value: 'React 18 + Vite 5' },
                    { label: 'Database',        value: 'PostgreSQL 15' },
                    { label: 'Authentication',  value: 'JWT (SimpleJWT)' },
                    { label: 'Environment',     value: import.meta.env.MODE || 'development' },
                    { label: 'API Base URL',    value: import.meta.env.VITE_API_URL || '/api' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--clr-border-soft)', fontSize: 14 }}>
                      <span className="text-muted">{label}</span>
                      <span className="fw-600" style={{ fontFamily: label === 'API Base URL' ? 'monospace' : 'inherit', fontSize: label === 'API Base URL' ? 12 : 14 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="card">
                  <div className="card-header"><h3>Administration</h3></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ padding: '14px 16px', background: 'var(--clr-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Django Admin Panel</div>
                          <div className="text-muted text-sm">Full database management and user administration.</div>
                        </div>
                        <a href="/admin" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          <i className="bi bi-box-arrow-up-right" /> Open Admin
                        </a>
                      </div>
                      <div style={{ padding: '14px 16px', background: 'var(--clr-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Clear Application Cache</div>
                          <div className="text-muted text-sm">Force refresh all cached data and computed values.</div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => toast.success('Cache cleared.')}>
                          <i className="bi bi-arrow-clockwise" /> Clear Cache
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const ROLE_LABELS = {
  admin:   'Administrator',
  manager: 'Inventory Manager',
  sales:   'Sales Representative',
  viewer:  'Read-Only Viewer',
};