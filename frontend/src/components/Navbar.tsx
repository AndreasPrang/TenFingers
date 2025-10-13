import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TenFingers ⌨️
        </Link>

        <div className="navbar-menu">
          {/* Lektionen-Link für alle (Gäste und eingeloggte Benutzer) */}
          <Link to="/lessons" className="navbar-link">
            Lektionen
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'teacher' ? (
                <>
                  <Link to="/teacher" className="navbar-link">
                    Meine Klassen
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                </>
              )}
              <div className="navbar-user">
                <span className="navbar-username">
                  {user?.username}
                  {user?.role === 'teacher' && <span className="user-badge">Lehrer</span>}
                </span>
                <button onClick={handleLogout} className="navbar-logout">
                  Abmelden
                </button>
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
