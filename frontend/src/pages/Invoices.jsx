import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Eye, DollarSign, X, Printer, CheckCircle, FileText } from 'lucide-react';

const Invoices = () => {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail/Print Invoice State
  const [viewInvoice, setViewInvoice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter or auto-open invoice if order/invoice parameter is present
  useEffect(() => {
    const soParam = searchParams.get('so');
    if (soParam && invoices.length > 0) {
      const found = invoices.find(inv => inv.salesOrder.id === Number(soParam));
      if (found) {
        setViewInvoice(found);
        setModalOpen(true);
      }
    }
  }, [searchParams, invoices]);

  const handlePay = async (invoiceId) => {
    if (!window.confirm('Mark this invoice as PAID? Outstanding customer balance will be updated.')) return;
    try {
      const res = await api.put(`/invoices/${invoiceId}/pay`);
      setInvoices(invoices.map(inv => inv.id === invoiceId ? res.data : inv));
      if (viewInvoice && viewInvoice.id === invoiceId) {
        setViewInvoice(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply payment.');
    }
  };

  const handleOverdue = async (invoiceId) => {
    try {
      const res = await api.put(`/invoices/${invoiceId}/overdue`);
      setInvoices(invoices.map(inv => inv.id === invoiceId ? res.data : inv));
      if (viewInvoice && viewInvoice.id === invoiceId) {
        setViewInvoice(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleOpenPrint = (invoice) => {
    setViewInvoice(invoice);
    setModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="invoices-container">
      {/* Invoices Master Table Card */}
      <div className="invoices-card glass-panel">
        <div className="section-header">
          <FileText size={18} className="header-icon" />
          <h3>Billing Ledger & Invoices</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Sales Order Ref</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Tax (10%)</th>
                <th>Total Value</th>
                <th>Status</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="inv-num-txt">{inv.invoiceNumber}</td>
                  <td className="so-ref-txt">{inv.salesOrder.soNumber}</td>
                  <td>{inv.salesOrder.customer.name}</td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td>${inv.taxAmount.toFixed(2)}</td>
                  <td className="total-txt">${inv.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${
                      inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'danger' : 'warning'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn edit-icon" onClick={() => handleOpenPrint(inv)} title="Print / View Invoice">
                      <Eye size={14} />
                    </button>
                    {inv.status !== 'PAID' && (
                      <>
                        <button className="icon-btn pay-btn" onClick={() => handlePay(inv.id)} title="Record Payment">
                          <DollarSign size={14} />
                        </button>
                        {inv.status === 'UNPAID' && (
                          <button className="icon-btn overdue-btn" onClick={() => handleOverdue(inv.id)} title="Mark Overdue">
                            <span className="overdue-dot">!</span>
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-cell">No commercial invoices generated.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {modalOpen && viewInvoice && (
        <div className="modal-backdrop print-backdrop">
          <div className="modal-content glass-panel invoice-print-modal">
            {/* Modal actions hidden on print */}
            <div className="modal-header print-hide">
              <h3>Commercial Invoice Document</h3>
              <div className="modal-actions-hdr">
                <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                  <Printer size={14} /> Print Invoice
                </button>
                <button className="close-btn" onClick={() => setModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="modal-body printable-area">
              <div className="invoice-doc">
                {/* Header */}
                <div className="doc-header">
                  <div className="doc-brand">
                    <h2>Apex<span>ERP</span></h2>
                    <span>Enterprise Operations Inc.</span>
                  </div>
                  <div className="doc-title-block">
                    <h1>INVOICE</h1>
                    <span className="doc-num">{viewInvoice.invoiceNumber}</span>
                  </div>
                </div>

                {/* Addresses */}
                <div className="doc-addresses-grid">
                  <div className="address-col">
                    <span className="address-lbl">Billed From:</span>
                    <span className="company-bold">Apex Operations Headquarters</span>
                    <span>100 Enterprise Way</span>
                    <span>Silicon Valley, CA 94016</span>
                    <span>billing@apexerp.com</span>
                  </div>
                  
                  <div className="address-col">
                    <span className="address-lbl">Billed To:</span>
                    <span className="company-bold">{viewInvoice.salesOrder.customer.name}</span>
                    {viewInvoice.salesOrder.customer.address ? (
                      <span>{viewInvoice.salesOrder.customer.address}</span>
                    ) : (
                      <span>Corporate Office Address</span>
                    )}
                    <span>Phone: {viewInvoice.salesOrder.customer.phone || 'N/A'}</span>
                    <span>Email: {viewInvoice.salesOrder.customer.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Dates & Reference */}
                <div className="doc-meta-bar">
                  <div className="meta-item">
                    <span className="meta-lbl">Invoice Date:</span>
                    <span>{new Date(viewInvoice.invoiceDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Payment Due Date:</span>
                    <span>{new Date(viewInvoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Sales Reference:</span>
                    <span>{viewInvoice.salesOrder.soNumber}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Billing Status:</span>
                    <span className="status-text-bold">{viewInvoice.status}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="doc-items-table">
                  <thead>
                    <tr>
                      <th>Product SKU</th>
                      <th>Item Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th className="cell-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.salesOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="doc-sku">{item.product.sku}</td>
                        <td>{item.product.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.unitPrice.toFixed(2)}</td>
                        <td className="cell-right">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="doc-totals-summary">
                  <div className="totals-table">
                    <div className="totals-row">
                      <span>Subtotal:</span>
                      <span>${viewInvoice.salesOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="totals-row">
                      <span>Sales Tax (10.00%):</span>
                      <span>${viewInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="totals-row grand-total-row">
                      <span>Total Amount Due:</span>
                      <span>${viewInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Signatures */}
                <div className="doc-footer">
                  <div className="terms-col">
                    <h4>Standard Payment Terms</h4>
                    <p>Payment is due within 15 days of invoice date. Please make checks payable to "Apex Operations Inc." or settle balance directly through the customer dispatch portal.</p>
                  </div>
                  <div className="sign-col">
                    <div className="signature-line">Authorized Signatory</div>
                    <span>Apex Accounts Department</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer (unseen on print) */}
            <div className="modal-footer print-hide">
              {viewInvoice.status !== 'PAID' && (
                <button className="btn btn-primary btn-success" onClick={() => handlePay(viewInvoice.id)}>
                  <CheckCircle size={14} /> Record Direct Payment
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Close Document</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .invoices-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .invoices-card {
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

        .inv-num-txt {
          font-family: monospace;
          font-weight: 600;
          color: var(--accent-brand);
        }

        .so-ref-txt {
          font-family: monospace;
          color: var(--text-secondary);
        }

        .total-txt {
          font-weight: 700;
        }

        .actions-header, .actions-cell {
          text-align: right;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }

        .pay-btn:hover {
          background: var(--accent-success);
          border-color: var(--accent-success);
        }

        .overdue-btn {
          font-weight: 700;
        }

        .overdue-btn:hover {
          background: var(--accent-danger);
          border-color: var(--accent-danger);
        }

        .overdue-dot {
          font-weight: 700;
          color: var(--accent-danger);
        }
        .icon-btn:hover .overdue-dot {
          color: #ffffff;
        }

        /* Invoice Modal Print Layout */
        .invoice-print-modal {
          max-width: 800px;
          border-radius: 16px;
          max-height: 95vh;
        }

        .modal-actions-hdr {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .printable-area {
          background: #ffffff !important;
          color: #1e293b !important;
          padding: 32px !important;
          overflow-y: auto;
        }

        /* Printable Invoice CSS Styling */
        .invoice-doc {
          font-family: Arial, sans-serif;
          line-height: 1.5;
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }

        .doc-brand h2 {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .doc-brand h2 span {
          color: #4f46e5;
        }

        .doc-brand span {
          font-size: 13px;
          color: #64748b;
        }

        .doc-title-block {
          text-align: right;
        }

        .doc-title-block h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 1px;
          margin: 0;
        }

        .doc-num {
          font-family: monospace;
          font-size: 14px;
          color: #4f46e5;
          font-weight: 700;
        }

        .doc-addresses-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          margin-bottom: 30px;
        }

        .address-col {
          display: flex;
          flex-direction: column;
          font-size: 13px;
          color: #475569;
        }

        .address-lbl {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .company-bold {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .doc-meta-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 30px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          color: #0f172a;
          font-weight: 600;
        }

        .meta-item .meta-lbl {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 2px;
          font-weight: 700;
        }

        .status-text-bold {
          color: #4f46e5;
          font-weight: 700;
        }

        .doc-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .doc-items-table th {
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 10px 12px;
          border-bottom: 2px solid #cbd5e1;
          text-align: left;
        }

        .doc-items-table td {
          padding: 12px;
          font-size: 13px;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
        }

        .doc-sku {
          font-family: monospace;
          font-weight: 700;
          color: #64748b;
        }

        .cell-right {
          text-align: right !important;
        }

        .doc-totals-summary {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals-table {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #475569;
        }

        .grand-total-row {
          border-top: 2px solid #cbd5e1;
          padding-top: 8px;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .doc-footer {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 40px;
          border-top: 2px solid #e2e8f0;
          padding-top: 20px;
          font-size: 12px;
          color: #64748b;
        }

        .terms-col h4 {
          font-size: 13px;
          color: #334155;
          margin-bottom: 6px;
        }

        .sign-col {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: flex-end;
        }

        .signature-line {
          border-top: 1px solid #cbd5e1;
          width: 180px;
          text-align: center;
          padding-top: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 4px;
        }

        /* Print Media queries */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-backdrop, .print-backdrop * {
            visibility: visible;
          }
          .print-backdrop {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: #ffffff !important;
          }
          .invoice-print-modal {
            box-shadow: none !important;
            border: none !important;
            max-height: none !important;
            width: 100% !important;
            max-width: none !important;
          }
          .printable-area {
            padding: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoices;
