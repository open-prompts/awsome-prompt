import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import './Header.scss';

/**
 * Header component for the application.
 * Displays the logo, navigation links, and user authentication status.
 */
const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

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
          <div className="user-profile" style={{ position: 'relative' }}>
             <button 
              className="user-name-btn" 
              onClick={toggleDropdown}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}
            >
              <span className="user-name" style={{ marginRight: '8px' }}>{user.displayName || user.email || 'User'}</span>
              <div className="avatar-circle">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </button>
            
            {isDropdownOpen && (
              <div className="profile-dropdown" style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                backgroundColor: 'white', 
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
                borderRadius: '4px',
                padding: '8px 0',
                minWidth: '150px',
                zIndex: 1000,
                color: 'black'
              }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => console.log('Profile Settings')}>
                  Profile Settings
                </div>
                 <div style={{ padding: '8px 16px', cursor: 'pointer', color: 'red' }} onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
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
