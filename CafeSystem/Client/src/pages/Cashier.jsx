import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { DollarSign, Printer, CheckCircle, Clock, Search, Filter, Sun, Moon, Globe, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

const socket = io(API_URL);

export default function Cashier() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, SERVED, COMPLETED
  const [cafeName, setCafeName] = useState(null);
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => setOrders(data));

    // Fetch Cafe Info
    fetch(`${API_URL}/api/cafe-info`)
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setCafeName(data.name);
        }
      })
      .catch(err => console.error('Error fetching cafe info:', err));

    socket.on('order_update', (updatedOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === updatedOrder.id);
        if (exists) {
          return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        } else {
          return [...prev, updatedOrder];
        }
      });
      
      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
    });

    return () => socket.off('order_update');
  }, [selectedOrder]);

  const markPaid = (orderId) => {
    if (window.confirm(t('confirmPayment'))) {
      socket.emit('mark_paid', orderId);
      setSelectedOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return order.status !== 'COMPLETED';
    if (filter === 'SERVED') return order.status === 'SERVED';
    if (filter === 'COMPLETED') return order.status === 'COMPLETED';
    return true;
  });

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handlePrint = () => {
    if (!selectedOrder) return;

    const printWindow = window.open('', '_blank');
    const total = calculateTotal(selectedOrder.items || []);
    
    const receiptContent = `
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>Receipt #${selectedOrder.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .details { font-size: 12px; color: #555; margin-left: 10px; }
            .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${cafeName ? (cafeName[language] || cafeName.en) : t('appName')}</h2>
            <p>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p>${t('orderId')}: #${selectedOrder.id.slice(-4)}</p>
            <p>${t('table')}: ${selectedOrder.tableId}</p>
          </div>
          
          <div class="items">
            ${selectedOrder.items.map(item => `
              <div>
                <div class="item">
                  <span>${item.qty}x ${item.name}</span>
                  <span>${item.price * item.qty}</span>
                </div>
                ${item.size ? `<div class="details">${t('size')}: ${item.size.name[language] || item.size.name.en}</div>` : ''}
                ${item.addons && item.addons.length > 0 ? `<div class="details">${t('addons')}: ${item.addons.map(a => a.name[language] || a.name.en).join(', ')}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="total">
            <span>${t('total')}</span>
            <span>${total} EGP</span>
          </div>

          <div class="footer">
            <p>${language === 'ar' ? 'شكراً لزيارتكم!' : 'Thank you for visiting!'}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-modern-50 text-slate-900'}`}>
      
      {/* Left Panel: Order List */}
      <div className={`w-full md:w-1/3 border-r flex flex-col h-screen ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="text-green-500" />
              {t('cashierStation')}
            </h1>
            <div className="flex gap-2">
                <button onClick={toggleLanguage} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                    <Globe size={16} />
                </button>
                <button onClick={toggleTheme} className={`p-2 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['ALL', 'SERVED', 'COMPLETED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  filter === f
                    ? (isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white')
                    : (isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200')
                }`}
              >
                {t(f)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <Search size={48} className="mx-auto mb-2" />
              <p>{t('noOrdersFound')}</p>
            </div>
          )}
          
          {filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                selectedOrder?.id === order.id
                  ? (isDarkMode ? 'bg-luxury-gold/10 border-luxury-gold' : 'bg-blue-50 border-blue-500')
                  : (isDarkMode ? 'bg-white/5 border-transparent hover:bg-white/10' : 'bg-white border-slate-100 hover:bg-slate-50')
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg">{t('table')} {order.tableId}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  order.status === 'SERVED' ? 'bg-green-500/20 text-green-500' : 
                  order.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-500' : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {t(order.status)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm opacity-70">
                <span>#{order.id.slice(-4)}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 font-bold text-right">
                {calculateTotal(order.items || [])} EGP
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Order Details (Invoice) */}
      <div className={`flex-1 flex flex-col h-screen ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
        {selectedOrder ? (
          <>
            <div className="flex-1 overflow-y-auto p-8">
              <div className={`max-w-2xl mx-auto p-8 rounded-2xl shadow-lg ${isDarkMode ? 'bg-luxury-800' : 'bg-white'}`}>
                
                {/* Invoice Header */}
                <div className="text-center border-b border-dashed pb-6 mb-6 opacity-70">
                  <Receipt size={48} className="mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{cafeName ? (cafeName[language] || cafeName.en) : t('appName')}</h2>
                  <p className="text-sm">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
                  <p className="text-sm">{t('orderId')}: #{selectedOrder.id}</p>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-8">
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">
                          {item.qty}x {item.name}
                        </div>
                        {item.size && (
                          <div className="text-xs opacity-60">
                             {t('size')}: {item.size.name[language] || item.size.name.en}
                          </div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-xs opacity-60">
                             {t('addons')}: {item.addons.map(a => a.name[language] || a.name.en).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="font-bold">
                        {item.price * item.qty} EGP
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed pt-6 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('total')}</span>
                    <span>{calculateTotal(selectedOrder.items || [])} EGP</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Bar */}
            <div className={`p-6 border-t ${isDarkMode ? 'bg-luxury-900 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="max-w-2xl mx-auto flex gap-4">
                <button 
                  onClick={handlePrint}
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'
                }`}>
                  <Printer size={20} />
                  {t('printReceipt')}
                </button>
                
                {selectedOrder.status !== 'COMPLETED' && (
                  <button 
                    onClick={() => markPaid(selectedOrder.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                  >
                    <CheckCircle size={20} />
                    {t('confirmPayment')}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <DollarSign size={64} className="mb-4" />
            <p className="text-xl font-bold">{t('selectOrderToPay')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
