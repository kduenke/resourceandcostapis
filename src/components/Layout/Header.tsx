import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../../auth/authConfig';
import './Header.css';

export function Header() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(console.error);
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(console.error);
  };

  const userName = accounts[0]?.name || accounts[0]?.username || '';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <span className="header-logo-icon">⬡</span>
          <div className="header-title-group">
            <h1 className="header-title">Azure API Explorer</h1>
            <span className="header-subtitle">Interactive REST API Training</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {isAuthenticated ? (
          <div className="header-user">
            <div className="header-user-info">
              <span className="header-user-name">{userName}</span>
              <span className="header-user-status">
                <span className="status-dot" />
                Connected
              </span>
            </div>
            <button className="header-btn header-btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="header-btn header-btn-login" onClick={handleLogin}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.5 0H0v7.5h7.5V0z" fill="#f25022" />
              <path d="M16 0H8.5v7.5H16V0z" fill="#7fba00" />
              <path d="M7.5 8.5H0V16h7.5V8.5z" fill="#00a4ef" />
              <path d="M16 8.5H8.5V16H16V8.5z" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        )}
      </div>
    </header>
  );
}
