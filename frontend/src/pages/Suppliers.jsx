import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit, Trash2, Truck, AlertTriangle } from 'lucide-react';

const Suppliers = () => {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (sup) => {
    setEditingId(sup.id);
    setName(sup.name);
    setContactName(sup.contactName || '');
    setEmail(sup.email || '');
    setPhone(sup.phone || '');
    setAddress(sup.address || '');
    setPaymentTerms(sup.paymentTerms || 'Net 30');
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPaymentTerms('Net 30');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers(suppliers.filter(s => s.id !== id));
      if (editingId === id) handleCancel();
      setSuccess('Supplier deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete supplier.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Supplier name is required');
      return;
    }
    setError('');
    setSuccess('');

    const payload = {
      name,
      contactName,
      email,
      phone,
      address,
      paymentTerms
    };

    try {
      if (editingId) {
        const res = await api.put(`/suppliers/${editingId}`, payload);
        setSuppliers(suppliers.map(s => s.id === editingId ? res.data : s));
        setSuccess('Supplier profile updated!');
      } else {
        const res = await api.post('/suppliers', payload);
        setSuppliers([...suppliers, res.data]);
        setSuccess('Supplier created successfully!');
      }
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPaymentTerms('Net 30');
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier profile.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="suppliers-layout">
      {/* Suppliers Directory (Left) */}
      <div className="list-section glass-panel">
        <div className="section-header">
          <Truck size={20} className="header-icon" />
          <h3>Supplier Directory</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Terms</th>
                {isAdmin && <th className="actions-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup.id} className={editingId === sup.id ? 'row-editing' : ''}>
                  <td className="sup-name-cell">
                    <div className="company-info">
                      <div className="company-name">{sup.name}</div>
                      {sup.address && <div className="company-address">{sup.address}</div>}
                    </div>
                  </td>
                  <td>{sup.contactName || <span className="empty-txt">-</span>}</td>
                  <td>{sup.email || <span className="empty-txt">-</span>}</td>
                  <td>{sup.phone || <span className="empty-txt">-</span>}</td>
                  <td>
                    <span className="badge badge-info">{sup.paymentTerms}</span>
                  </td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit-icon" onClick={() => handleEdit(sup)} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="icon-btn delete-icon" onClick={() => handleDelete(sup.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="empty-cell">No suppliers registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Form (Right) */}
      {isAdmin && (
        <div className="editor-section glass-panel">
          <h3>{editingId ? 'Edit Supplier' : 'Register New Supplier'}</h3>

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
              <label className="form-label">Company Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Tech Distribution"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input 
                type="text" 
                className="form-control" 
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0100"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select 
                className="form-control"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea 
                className="form-control" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street, city, state, zip"
                rows="3"
              />
            </div>

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Supplier' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .suppliers-layout {
          display: grid;
          grid-template-columns: ${isAdmin ? '1.8fr 1fr' : '1fr'};
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .suppliers-layout {
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

        .sup-name-cell {
          font-weight: 600;
        }

        .company-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .company-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .company-address {
          font-size: 11px;
          color: var(--text-muted);
        }

        .empty-txt {
          color: var(--text-muted);
          font-size: 13px;
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

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 { flex: 1; }

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

export default Suppliers;
