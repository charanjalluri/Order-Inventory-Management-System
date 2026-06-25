import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserPlus, Edit, Trash2, ShieldAlert, KeyRound } from 'lucide-react';

const Users = () => {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (u) => {
    setEditingId(u.id);
    setUsername(u.username);
    setEmail(u.email);
    setPassword(''); // Don't preload hashed password
    setRole(u.role);
    setActive(u.active);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('EMPLOYEE');
    setActive(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (loggedInUser && loggedInUser.id === id) {
      alert('You cannot delete your own administrative account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user profile?')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      if (editingId === id) handleCancel();
      setSuccess('User profile deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || (!editingId && !password)) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSuccess('');

    const payload = {
      username,
      email,
      role,
      active
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingId) {
        const res = await api.put(`/users/${editingId}`, payload);
        setUsers(users.map(u => u.id === editingId ? res.data : u));
        setSuccess('User account updated!');
      } else {
        const res = await api.post('/users', payload);
        setUsers([...users, res.data]);
        setSuccess('User account created successfully!');
      }
      handleCancel();
      fetchUsers(); // Reload to sync state
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user account.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="users-layout">
      {/* Users List (Left) */}
      <div className="list-section glass-panel">
        <div className="section-header">
          <UserPlus size={20} className="header-icon" />
          <h3>System User Accounts</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Security Role</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={editingId === u.id ? 'row-editing' : ''}>
                  <td className="user-name-cell">{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-brand'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-success' : 'badge-warning'}`}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn edit-icon" onClick={() => handleEdit(u)} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button 
                      className="icon-btn delete-icon" 
                      onClick={() => handleDelete(u.id)} 
                      disabled={loggedInUser && loggedInUser.id === u.id}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Form (Right) */}
      <div className="editor-section glass-panel">
        <h3>{editingId ? 'Modify User Profile' : 'Add New User'}</h3>

        {error && (
          <div className="alert-message error-alert">
            <ShieldAlert size={14} />
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
            <label className="form-label">Username *</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jsmith@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password {editingId ? '(Leave blank to retain current)' : '*'}
            </label>
            <div className="input-with-icon">
              <KeyRound size={14} className="input-icon" />
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? '••••••••' : 'Enter login password'}
                required={!editingId}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">System Role</label>
            <select 
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Account Status is Active</span>
            </label>
            <span className="input-hint">Unchecking will suspend user login rights.</span>
          </div>

          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Apply Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .users-layout {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .users-layout {
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

        .user-name-cell {
          font-weight: 600;
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

        .icon-btn:hover:not(:disabled) {
          color: #ffffff;
        }

        .icon-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .edit-icon:hover:not(:disabled) {
          background: var(--accent-brand);
          border-color: var(--accent-brand);
        }

        .delete-icon:hover:not(:disabled) {
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

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .input-with-icon input {
          padding-left: 36px;
        }

        .checkbox-group {
          margin-top: 14px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

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

export default Users;
