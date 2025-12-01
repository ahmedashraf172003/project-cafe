import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const isManager = user?.role === 'MANAGER';

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {isManager && <Sidebar />}
      <div className="flex-1 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}