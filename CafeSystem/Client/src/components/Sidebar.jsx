import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChefHat, 
  User, 
  Coffee, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu as MenuIcon,
  Package,
  Settings,
  Users,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [cafeName, setCafeName] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/cafe-info`)
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setCafeName(data.name);
        }
      })
      .catch(err => console.error('Failed to fetch cafe info', err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/manager', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/cashier', icon: DollarSign, label: 'cashierStation' },
    { path: '/products', icon: Package, label: 'productManager' },
    { path: '/staff', icon: Users, label: 'staffManager' },
    { path: '/kitchen', icon: ChefHat, label: 'kitchenView' },
    { path: '/waiter', icon: User, label: 'waiterView' },
    { path: '/settings', icon: Settings, label: 'settings' },
    { path: '/', icon: Coffee, label: 'menuView' },
  ];

  return (
    <motion.div 
      animate={{ width: isCollapsed ? '80px' : '280px' }}
      className={`h-screen sticky top-0 flex flex-col border-r z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-luxury-900 border-white/10 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl tracking-wider whitespace-nowrap"
          >
            {cafeName ? (cafeName[language] || cafeName.en) : t('appName')}
          </motion.h1>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'
          }`}
        >
          {language === 'ar' 
            ? (isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)
            : (isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)
          }
        </button>
      </div>

      {/* User Info */}
      <div className={`px-4 mb-6 ${isCollapsed ? 'text-center' : ''}`}>
        <div className={`p-3 rounded-xl flex items-center gap-3 ${
          isDarkMode ? 'bg-white/5' : 'bg-slate-50'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white'
          }`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="font-bold truncate">{user?.name}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                {user?.role}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 p-3 rounded-xl transition-all duration-300
              ${isActive 
                ? (isDarkMode ? 'bg-luxury-gold text-black font-bold shadow-lg shadow-yellow-500/20' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20')
                : (isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
              }
            `}
          >
            <item.icon size={24} />
            {!isCollapsed && <span>{t(item.label)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-500/10' 
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut size={24} />
          {!isCollapsed && <span className="font-bold">{t('logout')}</span>}
        </button>
      </div>
    </motion.div>
  );
}