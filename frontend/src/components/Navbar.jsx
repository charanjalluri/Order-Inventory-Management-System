import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Bell, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const [theme, setTheme] = useState('dark');
  const [lowStockCount, setLowStockCount] = useState(0);
  const location = useLocation();

  // Handle theme toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch low stock count for notifications badge
  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const response = await api.get('/products/low-stock');
        setLowStockCount(response.data.length);
      } catch (error) {
        console.error('Failed to load low-stock notification alerts:', error);
      }
    };

    fetchLowStockCount();
    // Poll every 60 seconds
    const interval = setInterval(fetchLowStockCount, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Derive page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products')) return 'Product Catalog';
    if (path.startsWith('/categories')) return 'Product Categories';
    if (path.startsWith('/suppliers')) return 'Supplier Directory';
    if (path.startsWith('/customers')) return 'Customer Directory';
    if (path.startsWith('/purchase-orders')) return 'Procurement & Purchase Orders';
    if (path.startsWith('/sales-orders')) return 'Sales & Dispatch Orders';
    if (path.startsWith('/inventory')) return 'Inventory Tracking Ledger';
    if (path.startsWith('/invoices')) return 'Commercial Invoices';
    if (path.startsWith('/reports')) return 'Analytics & Reports';
    if (path.startsWith('/users')) return 'User Management Control';
    return 'ERP Portal';
  };

  return (
    <header className="navbar-container glass-panel">
      <h1 className="navbar-title">{getPageTitle()}</h1>

      <div className="navbar-actions">
        {/* Low Stock Alerts Notification Widget */}
        <Link to="/products?filter=low" className="notification-btn">
          <Bell size={20} />
          {lowStockCount > 0 && (
            <span className="notification-badge">
              {lowStockCount}
            </span>
          )}
          {lowStockCount > 0 && (
            <div className="notification-dropdown glass-panel">
              <div className="dropdown-header">
                <AlertTriangle size={14} className="warning-icon" />
                <span>Inventory Alert</span>
              </div>
              <div className="dropdown-body">
                You have {lowStockCount} items currently running below their minimum safety stock levels.
              </div>
            </div>
          )}
        </Link>

        {/* Theme Switcher Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <style>{`
        .navbar-container {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          border-radius: 0;
          border-top: none;
          border-left: none;
          border-right: none;
          background: var(--bg-sidebar);
          backdrop-filter: var(--glass-blur);
          z-index: 99;
          position: sticky;
          top: 0;
        }

        .navbar-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .theme-toggle-btn, .notification-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.1);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .theme-toggle-btn:hover, .notification-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: var(--accent-danger);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          border: 2px solid var(--bg-sidebar);
        }

        .notification-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          width: 280px;
          padding: 14px;
          display: none;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          font-size: 13px;
          box-shadow: var(--shadow-lg);
          border-radius: var(--border-radius);
          z-index: 10;
        }

        .notification-btn:hover .notification-dropdown {
          display: flex;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: var(--accent-warning);
        }

        .warning-icon {
          color: var(--accent-warning);
        }

        .dropdown-body {
          color: var(--text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
