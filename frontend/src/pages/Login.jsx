import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const autofill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-wrapper">
      <div className="background-glows">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <div className="login-card glass-panel">
        <div className="brand-section">
          <div className="brand-logo">A</div>
          <h2>Apex<span>ERP</span></h2>
          <p>Order & Inventory Management System</p>
        </div>

        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input 
                type="text" 
                className="form-control" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <KeyRound size={16} className="input-icon" />
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="autofill-helpers">
          <span className="helper-label">Demo Logins (Click to autofill):</span>
          <div className="helper-btns">
            <button 
              type="button" 
              onClick={() => autofill('admin', 'admin123')} 
              className="btn btn-secondary btn-sm helper-btn"
            >
              <Shield size={12} /> Admin
            </button>
            <button 
              type="button" 
              onClick={() => autofill('employee', 'employee123')} 
              className="btn btn-secondary btn-sm helper-btn"
            >
              User
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060913;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .background-glows {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          animation: float 20s infinite alternate ease-in-out;
        }

        .glow-1 {
          width: 400px;
          height: 400px;
          background: var(--accent-brand);
          top: -100px;
          left: -100px;
        }

        .glow-2 {
          width: 500px;
          height: 500px;
          background: var(--accent-info);
          bottom: -150px;
          right: -150px;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          z-index: 2;
          border-radius: 20px;
          text-align: center;
          background: rgba(17, 25, 40, 0.7);
        }

        .brand-section {
          margin-bottom: 30px;
        }

        .brand-section h2 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 12px 0 4px 0;
        }

        .brand-section h2 span {
          color: var(--accent-brand);
        }

        .brand-section p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-danger);
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: left;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .input-with-icon .form-control {
          padding-left: 42px;
        }

        .login-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 15px;
          margin-top: 10px;
        }

        .autofill-helpers {
          margin-top: 30px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .helper-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .helper-btns {
          display: flex;
          gap: 10px;
        }

        .helper-btn {
          padding: 8px 14px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </div>
  );
};

export default Login;
