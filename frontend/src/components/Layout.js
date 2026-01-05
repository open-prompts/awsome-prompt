import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.scss';

/**
 * Layout component.
 * Wraps the application content with a Header and Sidebar.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to display
 * @param {Function} props.onFilterChange - Callback for sidebar filter changes
 */
const Layout = ({ children, onFilterChange }) => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar onFilterChange={onFilterChange} />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
