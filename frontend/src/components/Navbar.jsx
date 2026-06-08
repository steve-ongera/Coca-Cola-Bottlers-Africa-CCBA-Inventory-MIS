import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/products':   'Products',
  '/categories': 'Categories',
  '/sales':      'Sales',
  '/sales/new':  'New Sale',
  '/reports':    'Reports',
  '/profile':    'Profile',
  '/settings':   'Settings',
};

const NOTIFICATIONS = [
  { id: 1, icon: 'bi-box-seam', text: '5 products below reorder level', time: '10 min ago', type: 'warning' },
  { id: 2, icon: 'bi-cart-check', text: 'New sale #SALE-0042 completed', time: '25 min ago', type: 'success' },
  { id: 3, icon: 'bi-exclamation-triangle', text: '2 products out of stock', time: '1 hr ago', type: 'danger' },
];

export default function Navbar({ sidebarCollapsed, onToggleSidebar, onToggleMobileSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'CCBA MIS';

  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || user.username?.[0] || '')
    : 'U';

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      const { authAPI } = await import('../services/api.js');
      if (refresh) await authAPI.logout(refresh);
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left */}
      <div className="topbar-left">
        {/* Desktop toggle */}
        <button className="toggle-btn d-lg-flex d-none" onClick={onToggleSidebar} title="Toggle sidebar">
          <i className={`bi ${sidebarCollapsed ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'}`} />
        </button>

        {/* Mobile toggle */}
        <button className="toggle-btn d-lg-none" onClick={onToggleMobileSidebar}>
          <i className="bi bi-list" />
        </button>

        <span className="topbar-title">{pageTitle}</span>
      </div>

      {/* Right */}
      <div className="topbar-right">

        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button className="icon-btn" onClick={() => { setNotifOpen(p => !p); setUserOpen(false); }}>
            <i className="bi bi-bell" />
            <span className="badge-dot" />
          </button>

          {notifOpen && (
            <div className="dropdown-menu" style={{ minWidth: 300, right: 0 }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--clr-border-soft)' }}>
                <strong style={{ fontSize: 14 }}>Notifications</strong>
              </div>
              {NOTIFICATIONS.map(n => (
                <div key={n.id} className="dropdown-item" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: n.type === 'warning' ? 'var(--clr-warning-bg)' :
                                n.type === 'success' ? 'var(--clr-success-bg)' : 'var(--clr-danger-bg)',
                    color: n.type === 'warning' ? 'var(--clr-warning)' :
                           n.type === 'success' ? 'var(--clr-success)' : 'var(--clr-danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
                  }}>
                    <i className={`bi ${n.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--clr-text)' }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid var(--clr-border-soft)' }}>
                <a href="#" style={{ fontSize: 13, color: 'var(--clr-red)', fontWeight: 500 }}>
                  View all notifications
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="dropdown" ref={userRef} style={{ marginLeft: 6 }}>
          <button
            onClick={() => { setUserOpen(p => !p); setNotifOpen(false); }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--clr-red)',
              border: '2px solid var(--clr-red-light)',
              color: '#fff',
              font: '600 13px/1 var(--font-body)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {initials.toUpperCase()}
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--clr-border-soft)' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </div>
                <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/profile'); setUserOpen(false); }}>
                <i className="bi bi-person" /> Profile
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/settings'); setUserOpen(false); }}>
                <i className="bi bi-gear" /> Settings
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-left" /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}