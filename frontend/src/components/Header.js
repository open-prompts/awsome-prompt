import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.scss';

/**
 * Header component for the application.
 * Displays the logo, navigation links, and user authentication status.
 */
const Header = () => {
  const navigate = useNavigate();
  // Placeholder for user authentication state
  // In a real app, this would come from a context or redux store
  const user = null; // const user = { name: 'John Doe', avatar: '...' };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo">
          Awsome Prompt
        </Link>
        <nav className="main-nav">
          <Link to="/">Home</Link>
        </nav>
      </div>
      <div className="header-right">
        {user ? (
          <div className="user-profile">
            <span className="user-name">{user.name}</span>
            {/* Placeholder for avatar */}
            <div className="avatar-circle">{user.name.charAt(0)}</div>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-register" onClick={() => navigate('/register')}>Register</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
