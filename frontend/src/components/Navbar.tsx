import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setDropdownOpen(false);
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TypeHero ⌨️
        </Link>

        <div className="navbar-menu">
          {/* Lektionen-Link für alle (Gäste und eingeloggte Benutzer) */}
          <Link to="/lessons" className="navbar-link">
            Lektionen
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              {user?.role === 'teacher' && (
                <Link to="/teacher" className="navbar-link">
                  Meine Klassen
                </Link>
              )}
              <div className="navbar-user" ref={dropdownRef}>
                <button
                  className="navbar-username-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="navbar-username">
                    {user?.display_name || user?.username}
                    {user?.role === 'admin' && <span className="user-badge admin">ADMIN</span>}
                    {user?.role === 'teacher' && <span className="user-badge">LEHRER</span>}
                  </span>
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-username">{user?.display_name || user?.username}</div>
                      {user?.email && <div className="dropdown-email">{user?.email}</div>}
                    </div>
                    <div className="dropdown-divider"></div>
                    {user?.role === 'admin' && (
                      <>
                        <button className="dropdown-item" onClick={handleAdminClick}>
                          <span className="dropdown-icon">👑</span>
                          Admin Dashboard
                        </button>
                        <div className="dropdown-divider"></div>
                      </>
                    )}
                    <button className="dropdown-item" onClick={handleSettingsClick}>
                      <span className="dropdown-icon">⚙️</span>
                      Einstellungen
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <span className="dropdown-icon">🚪</span>
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Anmelden
              </Link>
              <Link to="/register" className="navbar-link-primary">
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
