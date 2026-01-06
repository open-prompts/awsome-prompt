import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initializeAuth } from './store/authSlice';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TemplateDetails from './pages/TemplateDetails';
import './index.scss'; // Global styles

/**
 * Main App component.
 * Sets up the router and defines the routes.
 */
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/template/:id" element={<TemplateDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
