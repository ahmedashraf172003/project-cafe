import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Menu from './pages/Menu';
import Login from './pages/Login';
import Kitchen from './pages/Kitchen';
import Waiter from './pages/Waiter';
import Manager from './pages/Manager';
import Cashier from './pages/Cashier';
import ProductManager from './pages/ProductManager';
import Settings from './pages/Settings';
import StaffManager from './pages/StaffManager';
import Connect from './pages/Connect';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/connect" element={<Connect />} />
              <Route path="/" element={<Menu />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes with Layout */}
              <Route element={<Layout />}>
                <Route 
                  path="/kitchen" 
                  element={
                    <ProtectedRoute allowedRoles={['KITCHEN', 'MANAGER']}>
                      <Kitchen />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/waiter" 
                  element={
                    <ProtectedRoute allowedRoles={['WAITER', 'MANAGER']}>
                      <Waiter />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/manager" 
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <Manager />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/cashier" 
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER', 'CASHIER']}>
                      <Cashier />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <ProductManager />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/staff" 
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <StaffManager />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute allowedRoles={['MANAGER']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
              </Route>
            </Routes>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
