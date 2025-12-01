import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Users, Moon, Sun, Globe, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

export default function StaffManager() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'WAITER'
  });

  const roles = [
    { id: 'MANAGER', label: 'Manager' },
    { id: 'KITCHEN', label: 'Kitchen' },
    { id: 'WAITER', label: 'Waiter' },
    { id: 'CASHIER', label: 'Cashier' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // Don't show current password
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', role: 'WAITER' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingUser 
      ? `${API_URL}/api/users/${editingUser.username}`
      : `${API_URL}/api/users`;
    
    const method = editingUser ? 'PUT' : 'POST';

    // Only include password if it's set (for edits) or required (for new users)
    const payload = {
      name: formData.name,
      username: formData.username,
      role: formData.role
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchUsers();
        handleCloseModal();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please check your connection.');
    }
  };

  const handleDelete = async (username) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        const res = await fetch(`${API_URL}/api/users/${username}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
        } else {
          const data = await res.json();
          alert(data.message);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="text-luxury-gold" />
          {t('staffManager')}
        </h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleLanguage}
            className={`p-2 rounded-full transition-all flex items-center gap-1 font-bold text-sm ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'}`}
          >
            <Globe size={18} />
            {language === 'en' ? 'AR' : 'EN'}
          </button>

          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'}`}
          >
            {isDarkMode ? <Sun size={20} className="text-luxury-gold" /> : <Moon size={20} className="text-slate-700" />}
          </button>

          <button
            onClick={() => handleOpenModal()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              isDarkMode 
                ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Plus size={20} />
            {t('addStaff')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div
            key={user.username}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl border relative group ${
              isDarkMode ? 'bg-luxury-800 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleOpenModal(user)}
                className="p-2 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <Edit2 size={16} />
              </button>
              {user.username !== 'admin' && (
                <button 
                  onClick={() => handleDelete(user.username)}
                  className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white'
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>@{user.username}</p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600'
            }`}>
              <Shield size={12} />
              {user.role}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${
                isDarkMode ? 'bg-luxury-900 border border-white/10' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingUser ? t('editStaff') : t('addStaff')}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('staffName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('username')}</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser} // Cannot change username when editing
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    } ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('password')}</label>
                  <input
                    type="password"
                    required={!editingUser} // Required only for new users
                    placeholder={editingUser ? t('passwordPlaceholder') : ''}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('role')}</label>
                  <select
                    required
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                      isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-lg font-bold transition-colors flex justify-center items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Save size={18} />
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
