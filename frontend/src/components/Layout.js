import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Add } from '@carbon/icons-react'; // Using Carbon icon
import Header from './Header';
import Sidebar from './Sidebar';
import CreateTemplateModal from './CreateTemplateModal';
import './Layout.scss';

/**
 * Layout component.
 * Wraps the application content with a Header and Sidebar.
 * Displays a floating create button for authenticated users.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to display
 * @param {Function} props.onFilterChange - Callback for sidebar filter changes
 */
const Layout = ({ children, onFilterChange }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSuccess = () => {
    // Optionally refresh lists or show success notification via global toast
    console.log("Template created successfully");
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar onFilterChange={onFilterChange} />
        <main className="app-content">
          {children}
        </main>
      </div>
      
      {isAuthenticated && (
        <>
          <button 
            className="floating-create-btn" 
            onClick={handleCreateClick} 
            aria-label="Create Template"
            title="Create Template"
          >
            <Add size={32} />
          </button>
          
          <CreateTemplateModal 
            open={isModalOpen} 
            onRequestClose={handleModalClose}
            onSuccess={handleModalSuccess}
          />
        </>
      )}
    </div>
  );
};

export default Layout;
