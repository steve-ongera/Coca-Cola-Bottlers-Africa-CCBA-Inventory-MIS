import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI, profileAPI } from '../services/api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      // Fetch user profile
      const profileRes = await profileAPI.get().catch(() => ({ data: { username: form.username } }));
      login(profileRes.data, data.access, data.refresh);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          var(--clr-red) 0, var(--clr-red) 1px,
          transparent 0, transparent 50%
        )`,
        backgroundSize: '30px 30px',
      }} />

      {/* Red accent blob */}
      <div style={{
        position: 'absolute', top: -120, right: -80,
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(232,0,27,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--clr-red)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 24,
            color: '#fff',
            letterSpacing: '0.02em',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(232,0,27,0.4)',
          }}>
            CC
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.04em',
          }}>
            CCBA Inventory MIS
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
            Coca-Cola Bottlers Africa
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.97)' }}>
          <div className="card-body" style={{ padding: '32px 36px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 24,
              color: 'var(--clr-text)',
            }}>
              Sign in to your account
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-person" style={{
                    position: 'absolute', left: 11, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--clr-text-muted)', fontSize: 15,
                  }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: 34 }}
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: 13, color: 'var(--clr-red)', fontWeight: 500 }}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-lock" style={{
                    position: 'absolute', left: 11, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--clr-text-muted)', fontSize: 15,
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingLeft: 34, paddingRight: 40 }}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'var(--clr-text-muted)', cursor: 'pointer',
                      fontSize: 15, padding: 0, display: 'flex',
                    }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 Coca-Cola Bottlers Africa. All rights reserved.
        </div>
      </div>
    </div>
  );
}