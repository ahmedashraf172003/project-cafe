import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { User, CheckCircle, Bell, Sun, Moon, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

const socket = io(API_URL);

export default function Waiter() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setReadyOrders(data.filter(o => o.status === 'READY')));

    socket.on('order_update', (updatedOrder) => {
      setReadyOrders(prev => {
        if (updatedOrder.status === 'READY') {
          // Add if not exists
          if (!prev.find(o => o.id === updatedOrder.id)) return [...prev, updatedOrder];
          return prev;
        } else {
          // Remove if status changed from READY to SERVED
          return prev.filter(o => o.id !== updatedOrder.id);
        }
      });
    });

    return () => socket.off('order_update');
  }, []);

  const markServed = (orderId) => {
    socket.emit('mark_served', orderId);
  };

  const toggleDetails = (orderId) => {
    setExpandedOrders(prev => ({...prev, [orderId]: !prev[orderId]}));
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-modern-50 text-slate-900'}`}>
      <header className={`flex justify-between items-center mb-8 border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('waiterDashboard')}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{t('readyForPickup')}</p>
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

      <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
        <Bell className="animate-bounce" /> {t('readyToServe')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {readyOrders.length === 0 && (
          <div className={`col-span-full text-center py-20 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-white/10 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">{t('allCaughtUp')}</p>
            <p className="text-sm opacity-70">{t('noOrdersPickup')}</p>
          </div>
        )}

        {readyOrders.map(order => (
          <div key={order.id} className={`rounded-2xl p-6 shadow-lg border-l-4 border-l-green-500 transition-all ${
            isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100'
          }`}>
            <div className="flex justify-between mb-4">
              <span className="font-bold text-2xl">{t('table')} {order.tableId}</span>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-green-500/20">
                {t('READY')}
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

            <button 
              onClick={() => markServed(order.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <CheckCircle size={20} /> {t('markServed')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
