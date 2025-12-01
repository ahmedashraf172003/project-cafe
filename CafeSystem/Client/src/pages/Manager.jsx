import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { LayoutDashboard, DollarSign, Users, Sun, Moon, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

const socket = io(API_URL);

export default function Manager() {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data));

    socket.on('order_update', (updatedOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === updatedOrder.id);
        if (exists) {
          return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        } else {
          return [...prev, updatedOrder];
        }
      });
    });

    return () => socket.off('order_update');
  }, []);

  const markPaid = (orderId) => {
    socket.emit('mark_paid', orderId);
  };

  const activeOrders = orders.filter(o => o.status !== 'COMPLETED');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((acc, order) => {
      return acc + (order.total || 0);
  }, 0);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-modern-50 text-slate-900'}`}>
      <header className={`flex justify-between items-center mb-8 border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('managerDashboard')}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('overview')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`text-sm font-medium px-4 py-2 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
            {user?.name}
          </div>
          <button 
            onClick={toggleLanguage}
            className={`p-2 rounded-full transition-all flex items-center gap-1 font-bold text-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-luxury-gold' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
          >
            <Globe size={18} />
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-luxury-gold' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('activeOrders')}</p>
              <h3 className="text-3xl font-bold">{activeOrders.length}</h3>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('completedOrders')}</p>
              <h3 className="text-3xl font-bold">{completedOrders.length}</h3>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('totalRevenue')}</p>
              <h3 className="text-3xl font-bold">{totalRevenue} EGP</h3>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">{t('cashierView')}</h2>
      <div className={`rounded-xl shadow-sm overflow-hidden border ${isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'}`}>
        <table className="w-full text-left">
          <thead className={`border-b ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <tr>
              <th className={`p-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('orderId')}</th>
              <th className={`p-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('table')}</th>
              <th className={`p-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('status')}</th>
              <th className={`p-4 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('items')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {activeOrders.map(order => (
              <tr key={order.id} className={`border-b last:border-0 transition-colors ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                <td className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>#{order.id.slice(-4)}</td>
                <td className="p-4 font-bold">{t('table')} {order.tableId}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'SERVED' ? 'bg-blue-500/20 text-blue-500' : 
                    isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t(order.status)}
                  </span>
                </td>
                <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {order.items && order.items.map((i, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-medium">{i.qty}x {i.name}</span>
                      {i.size && <span className="text-xs opacity-75"> ({i.size.name[language] || i.size.name.en})</span>}
                      {i.addons && i.addons.length > 0 && (
                        <span className="text-xs opacity-75">
                           {' + ' + i.addons.map(a => a.name[language] || a.name.en).join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {activeOrders.length === 0 && (
              <tr>
                <td colSpan="4" className={`p-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('noActiveOrders')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
