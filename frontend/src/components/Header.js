import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { UserAvatar } from '@carbon/icons-react';
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
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo">
          <img src="/images/logo.jpg" alt="Logo" style={{ height: '32px', marginRight: '10px', borderRadius: '50%' }} />
          Awsome Prompt
        </Link>
      </div>
      <div className="header-right">
        {user ? (
          <div className="user-profile" style={{ position: 'relative' }} ref={dropdownRef}>
             <button
              className="user-name-btn"
              onClick={toggleDropdown}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}
            >
              <span className="user-name" style={{ marginRight: '8px' }}>{user.displayName || user.email || 'User'}</span>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              ) : (
                <UserAvatar size={32} />
              )}
            </button>

            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}>
                  Profile
                </div>
                 <div className="dropdown-item logout" onClick={handleLogout}>
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
