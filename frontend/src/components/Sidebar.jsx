import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const NAV_ITEMS = [
  {
    section: 'Main',
    items: [
      { path: '/dashboard',   label: 'Dashboard',   icon: 'bi-grid-1x2-fill' },
      { path: '/products',    label: 'Products',    icon: 'bi-box-seam-fill' },
      { path: '/categories',  label: 'Categories',  icon: 'bi-tags-fill' },
      { path: '/sales',       label: 'Sales',       icon: 'bi-cart-fill' },
      { path: '/sales/new',   label: 'New Sale',    icon: 'bi-plus-circle-fill' },
      { path: '/reports',     label: 'Reports',     icon: 'bi-bar-chart-line-fill' },
    ],
  },
  {
    section: 'Account',
    items: [
      { path: '/profile',   label: 'Profile',   icon: 'bi-person-circle' },
      { path: '/settings',  label: 'Settings',  icon: 'bi-gear-fill' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      const { authAPI } = await import('../services/api.js');
      if (refresh) await authAPI.logout(refresh);
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || user.username?.[0] || '')
    : 'U';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">CC</div>
        <div className="logo-name">
          CCBA MIS
          <span className="logo-sub">Inventory System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-label={item.label}
                onClick={mobileOpen ? onClose : undefined}
              >
                <i className={`nav-icon bi ${item.icon}`} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {/* Logout */}
        <div style={{ marginTop: 8 }}>
          <button
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
            data-label="Logout"
            onClick={handleLogout}
          >
            <i className="nav-icon bi bi-box-arrow-left" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="user-avatar">{initials.toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </div>
          <div className="user-role">{user?.role || 'User'}</div>
        </div>
      </div>
    </aside>
  );
}