import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Edit, Trash2, Users, AlertTriangle } from 'lucide-react';

const Customers = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (cust) => {
    setEditingId(cust.id);
    setName(cust.name);
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setBalance(cust.balance.toString());
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setBalance('0.00');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete customer profile?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
      if (editingId === id) handleCancel();
      setSuccess('Customer profile removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Customer name is required');
      return;
    }
    setError('');
    setSuccess('');

    const payload = {
      name,
      email,
      phone,
      address,
      balance: parseFloat(balance || '0')
    };

    try {
      if (editingId) {
        const res = await api.put(`/customers/${editingId}`, payload);
        setCustomers(customers.map(c => c.id === editingId ? res.data : c));
        setSuccess('Customer profile updated!');
      } else {
        const res = await api.post('/customers', payload);
        setCustomers([...customers, res.data]);
        setSuccess('Customer account registered!');
      }
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setBalance('0.00');
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer account details.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="customers-layout">
      {/* Customers List Section (Left) */}
      <div className="list-section glass-panel">
        <div className="section-header">
          <Users size={20} className="header-icon" />
          <h3>Customer Directory</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer / Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Outstanding Balance</th>
                {isAdmin && <th className="actions-header">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust.id} className={editingId === cust.id ? 'row-editing' : ''}>
                  <td className="cust-name-cell">
                    <div className="customer-info">
                      <div className="customer-name">{cust.name}</div>
                      {cust.address && <div className="customer-address">{cust.address}</div>}
                    </div>
                  </td>
                  <td>{cust.email || <span className="empty-txt">-</span>}</td>
                  <td>{cust.phone || <span className="empty-txt">-</span>}</td>
                  <td>
                    <span className={`balance-badge ${cust.balance > 0 ? 'owes-money' : 'settled'}`}>
                      ₹{cust.balance.toFixed(2)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit-icon" onClick={() => handleEdit(cust)} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="icon-btn delete-icon" onClick={() => handleDelete(cust.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="empty-cell">No customers registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Section (Right) */}
      {isAdmin && (
        <div className="editor-section glass-panel">
          <h3>{editingId ? 'Edit Customer' : 'Register Customer Account'}</h3>

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
              <label className="form-label">Customer / Company Name *</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
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
                  placeholder="name@company.com"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0211"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Opening / Adjusted Balance (₹)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
              />
              <span className="input-hint">Unpaid sales invoices automatically increment this.</span>
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
                {editingId ? 'Update Customer' : 'Register Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .customers-layout {
          display: grid;
          grid-template-columns: ${isAdmin ? '1.8fr 1fr' : '1fr'};
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .customers-layout {
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

        .cust-name-cell {
          font-weight: 600;
        }

        .customer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .customer-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .customer-address {
          font-size: 11px;
          color: var(--text-muted);
        }

        .balance-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 13px;
        }

        .balance-badge.owes-money {
          background: rgba(239, 68, 68, 0.12);
          color: var(--accent-danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .balance-badge.settled {
          background: rgba(16, 185, 129, 0.12);
          color: var(--accent-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
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

        .input-hint {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
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

export default Customers;
