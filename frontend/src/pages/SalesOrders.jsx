import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, X, Eye, FileText, Check, AlertCircle, ShoppingBag } from 'lucide-react';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail View State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Create Order Drawer State
  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1, unitPrice: 0.00 }]);
  const [error, setError] = useState('');

  const fetchInitialData = async () => {
    try {
      const [orderRes, custRes, prodRes] = await Promise.all([
        api.get('/orders/sales'),
        api.get('/customers'),
        api.get('/products')
      ]);
      setOrders(orderRes.data);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/sales/${orderId}/status?status=${newStatus}`);
      setOrders(orders.map(o => o.id === orderId ? res.data : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update sales order status.');
    }
  };

  const handleAddRow = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitPrice: 0.00 }]);
  };

  const handleRemoveRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;

    // Auto-populate price if product is selected
    if (field === 'productId' && value !== '') {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        updated[index].unitPrice = prod.price; // Sales price (MSRP)
      }
    }
    setOrderItems(updated);
  };

  const calculateDrawerTotal = () => {
    return orderItems.reduce((acc, curr) => {
      const price = parseFloat(curr.unitPrice) || 0;
      const qty = parseInt(curr.quantity) || 0;
      return acc + (price * qty);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer');
      return;
    }

    // Validate items and check stock quantity warning locally
    const invalid = orderItems.some(i => !i.productId || i.quantity <= 0 || i.unitPrice < 0);
    if (invalid) {
      setError('Please select valid products with quantities and positive prices');
      return;
    }

    // Stock check warnings before calling backend
    for (const item of orderItems) {
      const prod = products.find(p => p.id === Number(item.productId));
      if (prod && prod.stockQuantity < Number(item.quantity)) {
        setError(`Insufficient stock for product '${prod.name}'. Current stock: ${prod.stockQuantity}`);
        return;
      }
    }
    setError('');

    const payload = {
      customerId: Number(customerId),
      items: orderItems.map(i => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
        unitPrice: parseFloat(i.unitPrice)
      }))
    };

    try {
      const res = await api.post('/orders/sales', payload);
      setOrders([res.data, ...orders]);
      setCustomerId('');
      setOrderItems([{ productId: '', quantity: 1, unitPrice: 0.00 }]);
      setCreateOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit sales order.');
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="so-container">
      {/* Search/Actions Header */}
      <div className="so-header glass-panel">
        <div className="header-meta">
          <ShoppingBag size={20} className="icon-purple" />
          <h3>Sales & Dispatch Orders</h3>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* SO Master Table */}
      <div className="so-card glass-panel">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SO Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Shipping Date</th>
                <th>Total Value</th>
                <th>Status</th>
                <th className="actions-header">Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="so-num-txt">{ord.soNumber}</td>
                  <td>{ord.customer.name}</td>
                  <td>{new Date(ord.orderDate).toLocaleDateString()}</td>
                  <td>{ord.shippingDate ? new Date(ord.shippingDate).toLocaleDateString() : <span className="pending-txt">Unshipped</span>}</td>
                  <td className="total-txt">${ord.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${
                      ord.status === 'SHIPPED' || ord.status === 'DELIVERED' ? 'success' : ord.status === 'CONFIRMED' ? 'info' : ord.status === 'CANCELLED' ? 'danger' : 'warning'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn edit-icon" onClick={() => handleViewDetails(ord)} title="View Detail">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">No sales orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {detailOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel detail-modal">
            <div className="modal-header">
              <div>
                <h3>SO Details: {selectedOrder.soNumber}</h3>
                <span className="modal-subtitle">Customer: {selectedOrder.customer.name}</span>
              </div>
              <button className="close-btn" onClick={() => setDetailOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Order Metadata info */}
              <div className="detail-meta-grid">
                <div>
                  <span className="meta-lbl">Status:</span>
                  <span className={`badge badge-${
                    selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED' ? 'success' : selectedOrder.status === 'CONFIRMED' ? 'info' : selectedOrder.status === 'CANCELLED' ? 'danger' : 'warning'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <span className="meta-lbl">Ordered Date:</span>
                  <span>{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                </div>
                <div>
                  <span className="meta-lbl">Shipping Date:</span>
                  <span>{selectedOrder.shippingDate ? new Date(selectedOrder.shippingDate).toLocaleString() : 'Not shipped'}</span>
                </div>
                <div>
                  <span className="meta-lbl">Created By:</span>
                  <span>{selectedOrder.createdBy ? selectedOrder.createdBy.username : 'N/A'}</span>
                </div>
              </div>

              {/* Items list */}
              <h4 className="section-title">Order Lines</h4>
              <table className="custom-table lines-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product.name}</td>
                      <td className="sku-code">{item.product.sku}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="detail-footer-summary">
                <div className="summary-block">
                  <span className="summary-lbl">Grand Total:</span>
                  <span className="summary-val">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Invoice link indicator */}
              {(selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED') && (
                <div className="invoice-link-panel">
                  <span className="invoice-msg">
                    <FileText size={16} /> A commercial invoice has been auto-generated for this sales dispatch.
                  </span>
                  <Link to={`/invoices?so=${selectedOrder.id}`} className="btn btn-secondary btn-sm link-btn">
                    Open Invoice Ledger
                  </Link>
                </div>
              )}

              {/* Workflow Actions */}
              {selectedOrder.status !== 'SHIPPED' && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <div className="workflow-actions">
                  <span className="workflow-lbl">Transition State:</span>
                  <div className="workflow-btns">
                    {selectedOrder.status === 'DRAFT' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                      >
                        Confirm Order
                      </button>
                    )}
                    {(selectedOrder.status === 'DRAFT' || selectedOrder.status === 'CONFIRMED') && (
                      <button 
                        className="btn btn-primary btn-sm btn-success"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                      >
                        <Check size={12} /> Dispatch & Ship
                      </button>
                    )}
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Full Drawer */}
      {createOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel drawer-modal">
            <div className="modal-header">
              <h3>Create Sales Order</h3>
              <button className="close-btn" onClick={() => setCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="modal-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body-scroll">
                {/* Select Customer */}
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select 
                    className="form-control" 
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Outstanding: ${c.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div className="lines-section">
                  <div className="lines-header">
                    <label className="form-label">Order Items *</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddRow}>
                      + Add Row
                    </button>
                  </div>

                  {orderItems.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <div className="form-group flex-2">
                        <select 
                          className="form-control"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          required
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group flex-1">
                        <input 
                          type="number" 
                          className="form-control" 
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          required
                        />
                      </div>

                      <div className="form-group flex-1">
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-control" 
                          value={item.unitPrice}
                          min="0"
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          placeholder="Price"
                          required
                        />
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm remove-row-btn"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={orderItems.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer footer-drawer">
                <div className="drawer-total-preview">
                  <span>Subtotal Total:</span>
                  <span className="preview-val">${calculateDrawerTotal().toFixed(2)}</span>
                </div>
                <div className="drawer-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Order</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .so-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .so-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-purple {
          color: var(--accent-brand);
        }

        .so-num-txt {
          font-family: monospace;
          font-weight: 600;
          color: var(--accent-brand);
        }

        .pending-txt {
          color: var(--text-muted);
          font-style: italic;
          font-size: 13px;
        }

        .total-txt {
          font-weight: 600;
        }

        .actions-header, .actions-cell {
          text-align: right;
        }

        /* Detail Modal specific styling */
        .detail-modal {
          max-width: 700px;
        }

        .modal-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .meta-lbl {
          font-weight: 600;
          color: var(--text-secondary);
          margin-right: 8px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }

        .lines-table th, .lines-table td {
          padding: 8px 12px;
        }

        .sku-code {
          font-family: monospace;
          color: var(--text-muted);
        }

        .detail-footer-summary {
          display: flex;
          justify-content: flex-end;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .summary-block {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .summary-lbl {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .summary-val {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .invoice-link-panel {
          margin: 16px 0;
          padding: 14px 18px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--border-radius);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .invoice-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .workflow-actions {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .workflow-lbl {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .workflow-btns {
          display: flex;
          gap: 8px;
        }

        .btn-success {
          background: var(--accent-success);
        }
        .btn-success:hover {
          background: #059669;
        }

        /* Drawer create styling */
        .drawer-modal {
          max-width: 800px;
        }

        .lines-section {
          margin-top: 20px;
        }

        .lines-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .item-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .remove-row-btn {
          margin-top: 2px;
        }

        .footer-drawer {
          justify-content: space-between;
          align-items: center;
        }

        .drawer-total-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .preview-val {
          font-size: 18px;
          color: var(--accent-brand);
          font-weight: 700;
        }

        .drawer-actions {
          display: flex;
          gap: 10px;
        }
      `}</style>
    </div>
  );
};

export default SalesOrders;
