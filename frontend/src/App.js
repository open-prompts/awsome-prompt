import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './index.scss'; // Global styles

/**
 * Main App component.
 * Sets up the router and defines the routes.
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes here as needed, e.g., /login, /register, /template/:id */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
