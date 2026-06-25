import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit, Trash2, FolderTree, AlertTriangle } from 'lucide-react';

const Categories = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentCategory ? cat.parentCategory.id : '');
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setParentId('');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete category? Child categories will lose their parent link.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      if (editingId === id) handleCancel();
      setSuccess('Category deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Name is required');
      return;
    }
    setError('');
    setSuccess('');

    const payload = {
      name,
      description,
      parentId: parentId ? Number(parentId) : null
    };

    try {
      if (editingId) {
        const res = await api.put(`/categories/${editingId}`, payload);
        setCategories(categories.map(c => c.id === editingId ? res.data : c));
        setSuccess('Category updated successfully!');
      } else {
        const res = await api.post('/categories', payload);
        setCategories([...categories, res.data]);
        setSuccess('Category created successfully!');
      }
      // Reset form
      setName('');
      setDescription('');
      setParentId('');
      setEditingId(null);
      // Reload categories to ensure list gets correct updates
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="categories-layout">
      {/* Categories List Section (Left) */}
      <div className="list-section glass-panel">
        <div className="section-header">
          <FolderTree size={20} className="header-icon" />
          <h3>Product Categories</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Parent Group</th>
                {isAdmin && <th className="actions-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className={editingId === cat.id ? 'row-editing' : ''}>
                  <td className="cat-name-cell">{cat.name}</td>
                  <td>{cat.description || <span className="empty-txt">No description</span>}</td>
                  <td>
                    {cat.parentCategory ? (
                      <span className="parent-pill">{cat.parentCategory.name}</span>
                    ) : (
                      <span className="empty-txt">-</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit-icon" onClick={() => handleEdit(cat)} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="icon-btn delete-icon" onClick={() => handleDelete(cat.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="empty-cell">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Editor Form (Right) */}
      {isAdmin && (
        <div className="editor-section glass-panel">
          <h3>{editingId ? 'Edit Category' : 'Create New Category'}</h3>
          
          {error && (
            <div className="alert-message error-alert">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-message success-alert">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Office Stationery"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select 
                className="form-control"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">None (Top-Level Category)</option>
                {categories
                  .filter(c => c.id !== editingId) // Prevent circular inheritance
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .categories-layout {
          display: grid;
          grid-template-columns: ${isAdmin ? '1.8fr 1fr' : '1fr'};
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .categories-layout {
            grid-template-columns: 1fr;
          }
        }

        .list-section, .editor-section {
          padding: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .header-icon {
          color: var(--accent-brand);
        }

        .cat-name-cell {
          font-weight: 600;
        }

        .empty-txt {
          color: var(--text-muted);
          font-size: 13px;
        }

        .parent-pill {
          background: rgba(6, 182, 212, 0.12);
          color: var(--accent-info);
          border: 1px solid rgba(6, 182, 212, 0.2);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .row-editing {
          background-color: var(--border-glow) !important;
        }

        .actions-header, .actions-cell {
          text-align: right;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          color: #ffffff;
        }

        .edit-icon:hover {
          background: var(--accent-brand);
          border-color: var(--accent-brand);
        }

        .delete-icon:hover {
          background: var(--accent-danger);
          border-color: var(--accent-danger);
        }

        /* Editor Section styling */
        .editor-section h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .alert-message {
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--accent-danger);
        }

        .success-alert {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-success);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Categories;
