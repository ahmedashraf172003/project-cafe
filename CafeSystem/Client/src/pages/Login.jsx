import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Coffee, Lock, User, Sun, Moon, ArrowRight, Globe, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [serverIp, setServerIp] = useState(localStorage.getItem('SERVER_IP') || '');
  
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
        // Redirect based on role
        switch (data.user.role) {
          case 'KITCHEN': navigate('/kitchen'); break;
          case 'WAITER': navigate('/waiter'); break;
          case 'MANAGER': navigate('/manager'); break;
          case 'CASHIER': navigate('/manager'); break; // Cashier goes to manager view for now
          default: navigate('/');
        }
      } else {
        setError(t('invalidCredentials'));
      }
    } catch (err) {
      setError(t('serverError') + ' - ' + API_URL);
    }
  };

  const saveServerIp = () => {
    if (serverIp) {
      localStorage.setItem('SERVER_IP', serverIp);
    } else {
      localStorage.removeItem('SERVER_IP');
    }
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900' : 'bg-modern-50'}`}>
      
      {/* Background Elements for Luxury Feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-luxury-gold' : 'bg-blue-400'}`}></div>
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-900' : 'bg-purple-300'}`}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl backdrop-blur-xl border ${
          isDarkMode 
            ? 'bg-luxury-800/80 border-white/10 shadow-black/50' 
            : 'bg-white/80 border-white/50 shadow-slate-200'
        }`}
      >
        {/* Toggles */}
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-all flex items-center gap-1 font-bold text-xs ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-luxury-gold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={toggleLanguage}
            className={`p-2 rounded-full transition-all flex items-center gap-1 font-bold text-xs ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-luxury-gold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Globe size={16} />
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10 text-luxury-gold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className={`p-4 rounded-2xl mb-4 shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-luxury-gold to-yellow-600 text-black' : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'}`}
          >
            <Coffee size={40} strokeWidth={1.5} />
          </motion.div>
          <h2 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {t('welcomeBack')}
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
            {t('enterCredentials')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <label className="block text-xs font-bold mb-2 uppercase">Server IP Address</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="e.g. 192.168.1.5"
                    className={`flex-1 p-2 rounded-lg text-sm outline-none border ${
                      isDarkMode ? 'bg-luxury-900 border-white/10 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                  <button 
                    onClick={saveServerIp}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs opacity-50 mt-2">Current API: {API_URL}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>{t('username')}</label>
            <div className="relative group">
              <User className={`absolute left-4 top-3.5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-luxury-gold' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full rounded-xl py-3 pl-12 pr-4 outline-none border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-luxury-900/50 border-white/5 focus:border-luxury-gold/50 text-white placeholder-gray-600' 
                    : 'bg-slate-50 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400'
                }`}
                placeholder="e.g. chef"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>{t('password')}</label>
            <div className="relative group">
              <Lock className={`absolute left-4 top-3.5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-luxury-gold' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl py-3 pl-12 pr-4 outline-none border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-luxury-900/50 border-white/5 focus:border-luxury-gold/50 text-white placeholder-gray-600' 
                    : 'bg-slate-50 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
              isDarkMode 
                ? 'bg-gradient-to-r from-luxury-gold to-yellow-600 text-black hover:shadow-yellow-500/20' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20'
            }`}
          >
            <span>{t('signIn')}</span>
            <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
            {t('protectedSystem')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
