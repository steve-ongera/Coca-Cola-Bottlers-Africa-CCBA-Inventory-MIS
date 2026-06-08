import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { profileAPI } from '../services/api.js';
import { useAuth } from '../App.jsx';

const ROLE_LABELS = {
  admin:   'Administrator',
  manager: 'Inventory Manager',
  sales:   'Sales Representative',
  viewer:  'Read-Only Viewer',
};

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    first_name:  user?.first_name  || '',
    last_name:   user?.last_name   || '',
    email:       user?.email       || '',
    phone:       user?.phone       || '',
    department:  user?.department  || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password:     '',
    new_password:     '',
    confirm_password: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeSection, setActiveSection] = useState('info');

  useEffect(() => {
    profileAPI.get()
      .then(r => {
        const d = r.data;
        setProfileForm({
          first_name: d.first_name || '',
          last_name:  d.last_name  || '',
          email:      d.email      || '',
          phone:      d.phone      || '',
          department: d.department || '',
        });
        updateUser(d);
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await profileAPI.update(profileForm);
      updateUser(data);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await profileAPI.changePassword(passwordForm);
      toast.success('Password changed successfully.');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to change password.';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user
    ? (user.first_name?.[0] || '') + (user.last_name?.[0] || user.username?.[0] || 'U')
    : 'U';

  const SECTIONS = [
    { id: 'info',     label: 'Personal Info',   icon: 'bi-person-lines-fill' },
    { id: 'password', label: 'Change Password', icon: 'bi-shield-lock-fill' },
    { id: 'activity', label: 'Account Info',    icon: 'bi-info-circle-fill' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information and security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar card */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 88, height: 88,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--clr-red), var(--clr-red-dark))',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: 32,
              margin: '0 auto 16px',
              boxShadow: '0 4px 16px rgba(232,0,27,0.35)',
            }}>
              {initials.toUpperCase()}
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div className="text-muted text-sm" style={{ marginBottom: 10 }}>@{user?.username}</div>

            <span className="badge badge-red" style={{ fontSize: 12 }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>

            {user?.department && (
              <div className="text-muted text-sm" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <i className="bi bi-building" />
                {user.department}
              </div>
            )}

            {user?.email && (
              <div className="text-muted text-sm" style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <i className="bi bi-envelope" />
                {user.email}
              </div>
            )}

            {user?.phone && (
              <div className="text-muted text-sm" style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <i className="bi bi-phone" />
                {user.phone}
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="card" style={{ padding: 8 }}>
            {SECTIONS.map(sec => (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                style={{
                  width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
                  borderRadius: 7, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
                  background: activeSection === sec.id ? 'var(--clr-red-light)' : 'transparent',
                  color: activeSection === sec.id ? 'var(--clr-red)' : 'var(--clr-text-muted)',
                  marginBottom: 2, transition: 'all 180ms',
                }}>
                <i className={`bi ${sec.icon}`} />
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {/* ── Personal Info ── */}
          {activeSection === 'info' && (
            <div className="card">
              <div className="card-header">
                <h3>Personal Information</h3>
              </div>
              <form onSubmit={handleProfileSave}>
                <div className="card-body">
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-control" value={profileForm.first_name}
                        onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="First name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-control" value={profileForm.last_name}
                        onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                        placeholder="Last name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-envelope" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)', fontSize: 14 }} />
                        <input className="form-control" style={{ paddingLeft: 32 }} type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-phone" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)', fontSize: 14 }} />
                        <input className="form-control" style={{ paddingLeft: 32 }}
                          value={profileForm.phone}
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+254 7XX XXX XXX" />
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Department</label>
                      <input className="form-control" value={profileForm.department}
                        onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                        placeholder="e.g. Sales & Distribution" />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile
                      ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Saving…</>
                      : <><i className="bi bi-check2" /> Save Changes</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Password ── */}
          {activeSection === 'password' && (
            <div className="card">
              <div className="card-header"><h3>Change Password</h3></div>
              <form onSubmit={handlePasswordSave}>
                <div className="card-body">
                  <div style={{ padding: '12px 16px', background: 'var(--clr-info-bg)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <i className="bi bi-info-circle-fill" style={{ color: 'var(--clr-info)', marginTop: 2 }} />
                    <div className="text-sm" style={{ color: 'var(--clr-info)' }}>
                      Use a strong password with at least 8 characters, including numbers and special characters.
                    </div>
                  </div>

                  {[
                    { key: 'old_password',     label: 'Current Password',     placeholder: 'Enter current password' },
                    { key: 'new_password',     label: 'New Password',         placeholder: 'At least 8 characters' },
                    { key: 'confirm_password', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                  ].map(field => (
                    <div className="form-group" key={field.key}>
                      <label className="form-label">{field.label}</label>
                      <div style={{ position: 'relative' }}>
                        <i className="bi bi-lock" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)', fontSize: 14 }} />
                        <input
                          className="form-control"
                          style={{ paddingLeft: 32, paddingRight: 40 }}
                          type={showPasswords ? 'text' : 'password'}
                          placeholder={field.placeholder}
                          value={passwordForm[field.key]}
                          onChange={e => setPasswordForm(p => ({ ...p, [field.key]: e.target.value }))}
                          required
                        />
                        {field.key === 'confirm_password' && (
                          <button type="button" onClick={() => setShowPasswords(p => !p)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', fontSize: 15, display: 'flex', padding: 0 }}>
                            <i className={`bi ${showPasswords ? 'bi-eye-slash' : 'bi-eye'}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                    {savingPassword
                      ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Changing…</>
                      : <><i className="bi bi-shield-check" /> Change Password</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Account Info ── */}
          {activeSection === 'activity' && (
            <div className="card">
              <div className="card-header"><h3>Account Information</h3></div>
              <div className="card-body">
                {[
                  { icon: 'bi-person-badge',   label: 'Username',       value: user?.username },
                  { icon: 'bi-shield-check',   label: 'Role',           value: ROLE_LABELS[user?.role] || user?.role },
                  { icon: 'bi-calendar-event', label: 'Member Since',   value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  { icon: 'bi-toggle-on',      label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--clr-border-soft)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--clr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                      <i className={`bi ${icon}`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="text-muted text-xs fw-600" style={{ textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 24, padding: 16, background: 'var(--clr-danger-bg)', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-danger)', marginBottom: 6 }}>Danger Zone</div>
                  <p className="text-sm text-muted" style={{ marginBottom: 12 }}>Contact your system administrator to deactivate or delete your account.</p>
                  <button className="btn btn-danger btn-sm" disabled>
                    <i className="bi bi-person-x" /> Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}