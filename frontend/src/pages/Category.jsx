import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { categoryAPI } from '../services/api.js';

function CategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (category) {
        await categoryAPI.update(category.id, form);
        toast.success('Category updated.');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created.');
      }
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to save.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{category ? 'Edit Category' : 'New Category'}</h3>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Sparkling Beverages"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description…"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="cat-active"
                checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--clr-red)', cursor: 'pointer' }}
              />
              <label htmlFor="cat-active" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} /> Saving…</>
                : category ? 'Update' : 'Create Category'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.list({ search: search || undefined });
      setCategories(data.results || data || []);
    } catch { toast.error('Failed to load categories.'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This may affect linked products.`)) return;
    setDeleting(cat.id);
    try {
      await categoryAPI.delete(cat.id);
      toast.success('Category deleted.');
      load();
    } catch { toast.error('Cannot delete — category may have products attached.'); }
    finally { setDeleting(null); }
  };

  // Category icon mapping for Coca-Cola brand
  const iconFor = (name) => {
    const n = name.toLowerCase();
    if (n.includes('spark') || n.includes('cola') || n.includes('soda')) return 'bi-cup-straw';
    if (n.includes('water')) return 'bi-droplet-fill';
    if (n.includes('juice')) return 'bi-cup-hot-fill';
    if (n.includes('energy')) return 'bi-lightning-fill';
    if (n.includes('sport')) return 'bi-trophy-fill';
    if (n.includes('tea') || n.includes('coffee')) return 'bi-cup-hot';
    return 'bi-tags-fill';
  };

  const ICON_COLORS = [
    { bg: 'var(--clr-red-light)',   color: 'var(--clr-red)' },
    { bg: 'var(--clr-info-bg)',     color: 'var(--clr-info)' },
    { bg: 'var(--clr-success-bg)', color: 'var(--clr-success)' },
    { bg: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' },
    { bg: 'rgba(26,26,46,0.08)',   color: 'var(--clr-navy)' },
  ];

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Categories</h1>
          <p>Organize your products into categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(null)}>
          <i className="bi bi-plus-lg" /> New Category
        </button>
      </div>

      {/* Search */}
      <div className="card mb-4" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 220px', maxWidth: 320 }}>
            <i className="bi bi-search" />
            <input
              className="form-control"
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-tags" />
          <h4>No categories yet</h4>
          <p>Create your first category to start organizing products.</p>
          <button className="btn btn-primary mt-3" onClick={() => setModal(null)}>New Category</button>
        </div>
      ) : (
        <div className="grid-3">
          {categories.map((cat, i) => {
            const colorSet = ICON_COLORS[i % ICON_COLORS.length];
            return (
              <div key={cat.id} className="card" style={{ padding: 20, transition: 'box-shadow 180ms', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: colorSet.bg, color: colorSet.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    <i className={`bi ${iconFor(cat.name)}`} />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon-only btn-sm" title="Edit" onClick={() => setModal(cat)}>
                      <i className="bi bi-pencil" style={{ fontSize: 14 }} />
                    </button>
                    <button className="btn btn-ghost btn-icon-only btn-sm" title="Delete"
                      style={{ color: 'var(--clr-danger)' }}
                      onClick={() => handleDelete(cat)}
                      disabled={deleting === cat.id}
                    >
                      <i className="bi bi-trash3" style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                  {cat.name}
                </div>
                {cat.description && (
                  <p className="text-muted text-sm" style={{ marginBottom: 12, lineHeight: 1.5 }}>{cat.description}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--clr-border-soft)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-box-seam" style={{ color: colorSet.color, fontSize: 14 }} />
                    <span className="text-sm text-muted">{cat.product_count} product{cat.product_count !== 1 ? 's' : ''}</span>
                  </div>
                  <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== undefined && (
        <CategoryModal
          category={modal}
          onClose={() => setModal(undefined)}
          onSaved={() => { setModal(undefined); load(); }}
        />
      )}
    </div>
  );
}