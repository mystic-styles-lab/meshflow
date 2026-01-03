import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await auth.checkAuth();
      setIsAuthenticated(response.data.authenticated);
      if (response.data.authenticated) {
        setUsername(response.data.username);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setIsAuthenticated(false);
      setUsername('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/balancer">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/" /> : 
              <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Dashboard username={username} onLogout={handleLogout} view="proxies" /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/logs" 
          element={
            isAuthenticated ? 
              <Dashboard username={username} onLogout={handleLogout} view="logs" /> : 
              <Navigate to="/login" />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
