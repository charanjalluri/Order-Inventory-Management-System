import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Truck, 
  Users, 
  ClipboardCheck, 
  ShoppingCart, 
  History, 
  FileText, 
  BarChart3, 
  UserCog, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: FolderTree },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardCheck },
    { to: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
    { to: '/inventory', label: 'Inventory Logs', icon: History },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  if (isAdmin) {
    links.push({ to: '/users', label: 'User Management', icon: UserCog });
  }

  return (
    <aside className="sidebar-container glass-panel">
      <div className="sidebar-brand">
        <div className="brand-logo">A</div>
        <span className="brand-text">Apex<span>ERP</span></span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink 
              key={link.to} 
              to={link.to} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="nav-label">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="username">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>

      <style>{`
        .sidebar-container {
          width: 260px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-top: none;
          border-bottom: none;
          border-left: none;
          background: var(--bg-sidebar);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-brand {
          height: 70px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-brand), var(--accent-info));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
          font-size: 18px;
        }

        .brand-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
        }

        .brand-text span {
          color: var(--accent-brand);
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: var(--accent-brand);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #ffffff;
          font-size: 15px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .username {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-danger);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
        }

        @media (max-width: 768px) {
          .sidebar-container {
            width: 70px;
          }
          .brand-text, .nav-label, .user-info, .logout-btn span {
            display: none;
          }
          .sidebar-brand, .sidebar-footer {
            justify-content: center;
            padding: 16px 0;
          }
          .nav-link {
            justify-content: center;
            padding: 12px 0;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
