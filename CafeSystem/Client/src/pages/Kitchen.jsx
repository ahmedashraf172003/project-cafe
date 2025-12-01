import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ChefHat, Clock, CheckCircle, Sun, Moon, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

const socket = io(API_URL);

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    // Initial load
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data.filter(o => o.status !== 'COMPLETED' && o.status !== 'SERVED')));

    // Real-time updates
    socket.on('order_update', (updatedOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === updatedOrder.id);
        if (exists) {
          // If status is SERVED or COMPLETED, remove from kitchen view
          if (updatedOrder.status === 'SERVED' || updatedOrder.status === 'COMPLETED') {
            return prev.filter(o => o.id !== updatedOrder.id);
          }
          return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        } else {
          // Add new order if it's relevant to kitchen
          if (updatedOrder.status === 'PENDING' || updatedOrder.status === 'PREPARING' || updatedOrder.status === 'READY') {
            return [...prev, updatedOrder];
          }
          return prev;
        }
      });
    });

    return () => socket.off('order_update');
  }, []);

  const updateStatus = (orderId, status) => {
    if (status === 'PREPARING') socket.emit('mark_preparing', orderId);
    if (status === 'READY') socket.emit('mark_ready', orderId);
  };

  const toggleDetails = (orderId) => {
    setExpandedOrders(prev => ({...prev, [orderId]: !prev[orderId]}));
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-modern-50 text-slate-900'}`}>
      <header className={`flex justify-between items-center mb-8 border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-luxury-gold text-black' : 'bg-orange-500 text-white'}`}>
            <ChefHat size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('kitchenDisplay')}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('liveFeed')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`text-sm font-medium px-4 py-2 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
            {t('chef')}: {user?.name}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.length === 0 && (
          <div className={`col-span-full text-center py-20 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-white/10 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
            <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">{t('noActiveOrders')}</p>
            <p className="text-sm opacity-70">{t('readyToCook')}</p>
          </div>
        )}
        
        {orders.map(order => (
          <div key={order.id} className={`rounded-2xl p-6 border shadow-lg transition-all ${
            isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'
          } ${
            order.status === 'PENDING' ? 'border-l-4 border-l-red-500' : 
            order.status === 'PREPARING' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'
          }`}>
            <div className="flex justify-between mb-4">
              <span className="font-bold text-xl">{t('table')} {order.tableId || '?'}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                order.status === 'PENDING' ? 'bg-red-500/10 text-red-500' : 
                order.status === 'PREPARING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
              }`}>
                {t(order.status)}
              </span>
            </div>

            <div className="mb-6">
              <button
                onClick={() => toggleDetails(order.id)}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold ${
                  isDarkMode ? 'bg-white/5 hover:bg-white/10 text-luxury-gold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {expandedOrders[order.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                {expandedOrders[order.id] ? t('hideDetails') : t('showDetails')}
              </button>

              {expandedOrders[order.id] && (
                <div className={`mt-4 space-y-3 p-4 rounded-xl ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>{item.name}</span>
                        {item.size && (
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                            {item.size.name[language] || item.size.name.en}
                          </span>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                            {item.addons.map(addon => `+ ${addon.name[language] || addon.name.en}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                        {item.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {order.status === 'PENDING' && (
                <button 
                  onClick={() => updateStatus(order.id, 'PREPARING')}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={18} /> {t('startCooking')}
                </button>
              )}
              
              {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                <button 
                  onClick={() => updateStatus(order.id, 'READY')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> {t('markReady')}
                </button>
              )}
            </div>
            <div className={`mt-4 text-xs text-right ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
              {t('orderedAt')}: {new Date(order.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
