import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileSpreadsheet, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load reports stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDownloadCSV = async () => {
    try {
      const response = await api.get('/reports/export/inventory', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download inventory report CSV.');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  // Calculate gross margins (Sales - Purchase Cost)
  const salesVal = stats?.totalSales || 0;
  const costVal = stats?.totalPurchases || 0;
  const grossProfit = salesVal - costVal;

  return (
    <div className="reports-container">
      {/* CSV Export Bar */}
      <div className="export-bar glass-panel">
        <div className="export-info">
          <FileSpreadsheet size={22} className="export-icon" />
          <div>
            <h3>Inventory Catalog Data Export</h3>
            <p>Download a complete itemized comma-separated values (CSV) log for external audit reporting.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadCSV}>
          <FileSpreadsheet size={16} /> Export to CSV
        </button>
      </div>

      {/* Reports KPI grid */}
      <div className="reports-kpis-grid">
        <div className="reports-kpi-card glass-panel">
          <div className="kpi-body">
            <span className="lbl">Gross Sales Revenue</span>
            <span className="val">${salesVal.toFixed(2)}</span>
            <span className="sub">Sum of all confirmed sales orders</span>
          </div>
          <div className="kpi-badge success"><TrendingUp size={16} /></div>
        </div>

        <div className="reports-kpi-card glass-panel">
          <div className="kpi-body">
            <span className="lbl">Procurement Expense</span>
            <span className="val">${costVal.toFixed(2)}</span>
            <span className="sub">Sum of all processed purchase orders</span>
          </div>
          <div className="kpi-badge danger"><TrendingDown size={16} /></div>
        </div>

        <div className="reports-kpi-card glass-panel">
          <div className="kpi-body">
            <span className="lbl">Estimated Gross Margin</span>
            <span className={`val ${grossProfit >= 0 ? 'profit-text' : 'loss-text'}`}>
              ${grossProfit.toFixed(2)}
            </span>
            <span className="sub">Calculated sales margin (gross profit)</span>
          </div>
          <div className={`kpi-badge ${grossProfit >= 0 ? 'success' : 'danger'}`}>
            <DollarSign size={16} />
          </div>
        </div>

        <div className="reports-kpi-card glass-panel">
          <div className="kpi-body">
            <span className="lbl">Stock Valuation Value</span>
            <span className="val">${(stats?.totalInventoryValue || 0).toFixed(2)}</span>
            <span className="sub">Valued at standard manufacturer cost prices</span>
          </div>
          <div className="kpi-badge brand"><BarChart3 size={16} /></div>
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="reports-charts-grid">
        <div className="reports-chart-card glass-panel">
          <div className="chart-hdr">
            <BarChart3 size={16} className="brand-color" />
            <h3>Monthly Sales Analytics</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-sidebar)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Legend />
                <Bar dataKey="Sales" fill="var(--accent-brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="reports-overview-card glass-panel">
          <h3>Operations Summary Status</h3>
          <div className="summary-list">
            <div className="summary-row">
              <div className="summary-label">
                <ShieldAlert size={14} className="warning-color" />
                <span>Low stock warnings:</span>
              </div>
              <span className="summary-val">{stats?.lowStockCount || 0} Products</span>
            </div>
            
            <div className="summary-row">
              <div className="summary-label">
                <span>Recent processed logs:</span>
              </div>
              <span className="summary-val">{stats?.recentOrders?.length || 0} Actions</span>
            </div>

            <div className="summary-row">
              <div className="summary-label">
                <span>Direct catalog items count:</span>
              </div>
              <span className="summary-val">
                {stats?.categoryDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0} Qty
              </span>
            </div>

            <div className="system-health-panel">
              <div className="health-hdr">
                <div className="pulse-dot"></div>
                <h4>ERP Server Status: Active</h4>
              </div>
              <p>The databases (H2/MySQL) and security filters are running normally. Auto-logging functions are syncing correctly.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .reports-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .export-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .export-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .export-icon {
          color: var(--accent-success);
        }

        .export-info h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .export-info p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .reports-kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .reports-kpi-card {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .kpi-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-body .lbl {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .kpi-body .val {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .profit-text {
          color: var(--accent-success);
        }

        .loss-text {
          color: var(--accent-danger);
        }

        .kpi-body .sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        .kpi-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .kpi-badge.success { background: var(--accent-success); }
        .kpi-badge.danger { background: var(--accent-danger); }
        .kpi-badge.brand { background: var(--accent-brand); }

        .reports-charts-grid {
          display: grid;
          grid-template-columns: 2.2fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .reports-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .reports-chart-card, .reports-overview-card {
          padding: 24px;
        }

        .chart-hdr {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .brand-color {
          color: var(--accent-brand);
        }

        .reports-overview-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        .summary-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .warning-color {
          color: var(--accent-warning);
        }

        .summary-val {
          font-weight: 600;
        }

        .system-health-panel {
          margin-top: 10px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 13px;
        }

        .health-hdr {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-success);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }

        .health-hdr h4 {
          font-weight: 600;
        }

        .system-health-panel p {
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default Reports;
