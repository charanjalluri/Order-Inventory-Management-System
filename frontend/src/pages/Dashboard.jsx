import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  PackageCheck, 
  ClipboardList 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/products/low-stock')
        ]);
        setStats(statsRes.data);
        setLowStockProducts(lowStockRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const kpis = [
    {
      title: 'Total Sales Revenue',
      value: `$${stats?.totalSales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      subtitle: 'Completed sales',
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Total Procurement Cost',
      value: `$${stats?.totalPurchases?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      subtitle: 'Issued purchase orders',
      icon: TrendingDown,
      color: 'danger',
    },
    {
      title: 'Total Inventory Value',
      value: `$${stats?.totalInventoryValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      subtitle: 'Cost-basis stock valuation',
      icon: DollarSign,
      color: 'brand',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount || '0',
      subtitle: 'Items below safety stock',
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? 'warning' : 'info',
      link: '/products?filter=low',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const CardContent = (
            <div className={`kpi-card glass-panel border-${kpi.color}`}>
              <div className="kpi-info">
                <span className="kpi-title">{kpi.title}</span>
                <span className="kpi-value">{kpi.value}</span>
                <span className="kpi-subtitle">{kpi.subtitle}</span>
              </div>
              <div className={`kpi-icon-wrapper bg-${kpi.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );

          return kpi.link ? (
            <Link key={index} to={kpi.link} className="kpi-card-link">
              {CardContent}
            </Link>
          ) : (
            <div key={index}>{CardContent}</div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sales Trend Chart */}
        <div className="chart-card glass-panel">
          <h3>Sales Revenue Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Line 
                  type="monotone" 
                  dataKey="Sales" 
                  stroke="var(--accent-brand)" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution */}
        <div className="chart-card glass-panel">
          <h3>Stock Distribution by Category</h3>
          <div className="chart-wrapper">
            {stats?.categoryDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.categoryDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-sidebar)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No category data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Lists Row Grid */}
      <div className="lists-grid">
        {/* Recent Activity Table */}
        <div className="list-card glass-panel">
          <div className="list-header">
            <h3>Recent Activity</h3>
            <span className="subtitle">Purchase & Sales orders tracking</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Partner</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map((ord, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="order-num-txt">{ord.number}</span>
                    </td>
                    <td>{ord.partner}</td>
                    <td>
                      <span className={`badge ${ord.type === 'Sales' ? 'badge-brand' : 'badge-info'}`}>
                        {ord.type}
                      </span>
                    </td>
                    <td>${ord.amount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${
                        ord.status === 'RECEIVED' || ord.status === 'DELIVERED' 
                          ? 'success' 
                          : ord.status === 'ORDERED' || ord.status === 'CONFIRMED' || ord.status === 'SHIPPED'
                          ? 'info' 
                          : ord.status === 'CANCELLED' 
                          ? 'danger' 
                          : 'warning'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan="5" className="empty-cell">No recent activities found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Alert List */}
        <div className="list-card glass-panel">
          <div className="list-header">
            <h3 className="warning-text">Low Stock Risk Panel</h3>
            <span className="subtitle">Products requiring critical replenishment</span>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.map((prod) => (
              <div key={prod.id} className="low-stock-item">
                <div className="item-details">
                  <span className="item-name">{prod.name}</span>
                  <span className="item-sku">SKU: {prod.sku}</span>
                </div>
                <div className="item-status">
                  <span className="qty-pill danger">{prod.stockQuantity} Left</span>
                  <span className="threshold-pill">Min: {prod.minStockLevel}</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="all-clear">
                <PackageCheck size={36} className="all-clear-icon" />
                <p>All stock levels are currently within safe replenishment thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .loading-spinner {
          height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .kpi-card-link {
          text-decoration: none;
          color: inherit;
        }

        .kpi-card {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-left: 4px solid var(--border-color);
        }

        .kpi-card.border-success { border-left-color: var(--accent-success); }
        .kpi-card.border-danger { border-left-color: var(--accent-danger); }
        .kpi-card.border-brand { border-left-color: var(--accent-brand); }
        .kpi-card.border-warning { border-left-color: var(--accent-warning); }
        .kpi-card.border-info { border-left-color: var(--accent-info); }

        .kpi-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .kpi-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .kpi-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }

        .kpi-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .bg-success { background: var(--accent-success); }
        .bg-danger { background: var(--accent-danger); }
        .bg-brand { background: var(--accent-brand); }
        .bg-warning { background: var(--accent-warning); }
        .bg-info { background: var(--accent-info); }

        .charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .chart-wrapper {
          position: relative;
        }

        .empty-chart {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .lists-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .lists-grid {
            grid-template-columns: 1fr;
          }
        }

        .list-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .list-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .list-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .list-header h3.warning-text {
          color: var(--accent-warning);
        }

        .list-header .subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .order-num-txt {
          font-family: monospace;
          font-weight: 600;
          color: var(--accent-brand);
        }

        .empty-cell {
          text-align: center;
          color: var(--text-secondary);
          padding: 30px;
        }

        .low-stock-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 350px;
          overflow-y: auto;
        }

        .low-stock-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .item-sku {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
        }

        .item-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-pill {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }

        .qty-pill.danger {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .threshold-pill {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .all-clear {
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .all-clear-icon {
          color: var(--accent-success);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
