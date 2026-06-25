import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

const Inventory = () => {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLogsAndProducts = async () => {
    try {
      const [logRes, prodRes] = await Promise.all([
        api.get('/inventory/logs'),
        api.get('/products')
      ]);
      setLogs(logRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load inventory logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndProducts();
  }, []);

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    if (!productId || !quantity) {
      setError('Please select a product and enter an adjustment quantity.');
      return;
    }
    setError('');
    setSuccess('');

    const qtyVal = parseInt(quantity);
    if (qtyVal === 0) {
      setError('Adjustment quantity cannot be zero.');
      return;
    }

    // Verify stock is not falling below zero locally
    const prod = products.find(p => p.id === Number(productId));
    if (prod && (prod.stockQuantity + qtyVal) < 0) {
      setError(`Stock cannot fall below zero. Current stock of '${prod.name}' is ${prod.stockQuantity}.`);
      return;
    }

    try {
      const res = await api.post('/inventory/adjust', {
        productId: Number(productId),
        quantity: qtyVal,
        notes
      });
      
      setSuccess(`Inventory adjusted successfully. Stock quantity modified by ${qtyVal > 0 ? '+' : ''}${qtyVal}.`);
      // Reset form
      setProductId('');
      setQuantity('');
      setNotes('');
      // Reload logs
      fetchLogsAndProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust stock.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="inventory-layout">
      {/* Stock Adjustments Form (Left/Top) */}
      <div className="adjust-section glass-panel">
        <div className="section-header">
          <Wrench size={18} className="header-icon" />
          <h3>Manual Stock Adjustment</h3>
        </div>

        {error && (
          <div className="alert-message error-alert">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-message success-alert">
            <CheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmitAdjustment}>
          <div className="form-group">
            <label className="form-label">Product to Adjust *</label>
            <select 
              className="form-control"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku} | In Stock: {p.stockQuantity})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity Modifier *</label>
            <input 
              type="number" 
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. +10 (restock) or -5 (shrinkage/damage)"
              required
            />
            <span className="input-hint">Use positive integers to add, negative integers to subtract.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Notes</label>
            <input 
              type="text" 
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Audit correction, Damaged during shipping"
            />
          </div>

          <button type="submit" className="btn btn-primary adjust-btn">
            Apply Stock Correction
          </button>
        </form>
      </div>

      {/* Stock History Logs Ledger (Right/Bottom) */}
      <div className="logs-section glass-panel">
        <div className="section-header">
          <History size={18} className="header-icon" />
          <h3>Stock Movement Audit Ledger</h3>
        </div>

        <div className="table-responsive logs-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Ref ID</th>
                <th>Reason/Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isPositive = log.quantity > 0;
                
                return (
                  <tr key={log.id}>
                    <td className="time-cell">
                      {new Date(log.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="log-prod-name">{log.product.name}</td>
                    <td className="log-sku">{log.product.sku}</td>
                    <td>
                      <span className={`badge ${
                        log.transactionType === 'PURCHASE' ? 'badge-success' : log.transactionType === 'SALE' ? 'badge-brand' : 'badge-warning'
                      }`}>
                        {log.transactionType}
                      </span>
                    </td>
                    <td className={`qty-cell ${isPositive ? 'qty-positive' : 'qty-negative'}`}>
                      {isPositive ? '+' : ''}{log.quantity}
                    </td>
                    <td className="ref-cell">
                      {log.referenceId ? `#${log.referenceId}` : <span className="empty-txt">-</span>}
                    </td>
                    <td className="notes-cell" title={log.notes}>
                      {log.notes || <span className="empty-txt">No detail</span>}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">No stock movements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .inventory-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .inventory-layout {
            grid-template-columns: 1fr;
          }
        }

        .adjust-section, .logs-section {
          padding: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .header-icon {
          color: var(--accent-brand);
        }

        .adjust-btn {
          width: 100%;
          justify-content: center;
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

        .input-hint {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Logs Table Styles */
        .logs-table-container {
          max-height: 500px;
          overflow-y: auto;
        }

        .time-cell {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .log-prod-name {
          font-weight: 500;
        }

        .log-sku {
          font-family: monospace;
          font-size: 12px;
          color: var(--text-muted);
        }

        .qty-cell {
          font-weight: 700;
        }

        .qty-positive {
          color: var(--accent-success);
        }

        .qty-negative {
          color: var(--accent-danger);
        }

        .ref-cell {
          font-family: monospace;
          font-size: 12px;
        }

        .notes-cell {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .empty-txt {
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default Inventory;
