import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Settings as SettingsIcon, Globe, Moon, Sun, Store, List } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'categories'
  
  // --- Category State ---
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ nameEn: '', nameAr: '' });

  // --- General Settings State ---
  const [cafeInfo, setCafeInfo] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' }
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCafeInfo();
  }, []);

  // --- API Calls ---

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCafeInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cafe-info`);
      const data = await res.json();
      if (data) setCafeInfo(data);
    } catch (error) {
      console.error('Error fetching cafe info:', error);
    }
  };

  const handleSaveCafeInfo = async (e) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const res = await fetch(`${API_URL}/api/cafe-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cafeInfo)
      });
      if (res.ok) {
        alert(t('save') + ' ' + t('completed')); // Simple feedback
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // --- Category Handlers ---

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        nameEn: category.name.en,
        nameAr: category.name.ar
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ nameEn: '', nameAr: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const url = editingCategory 
      ? `${API_URL}/api/categories/${editingCategory.id}`
      : `${API_URL}/api/categories`;
    
    const method = editingCategory ? 'PUT' : 'POST';

    const payload = {
      name: { en: categoryForm.nameEn, ar: categoryForm.nameAr }
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchCategories();
        handleCloseModal();
      } else {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          alert(errorData.message || 'Failed to save category');
        } catch {
          console.error('Server returned non-JSON response:', text);
          alert(`Server Error (${res.status}): The server is not responding correctly.`);
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="text-luxury-gold" />
          {t('settings')}
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
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-4 flex items-center gap-2 font-bold transition-all relative ${
              activeTab === 'general' 
                ? 'text-luxury-gold' 
                : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store size={20} />
            {t('generalSettings')}
            {activeTab === 'general' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-luxury-gold rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-4 flex items-center gap-2 font-bold transition-all relative ${
              activeTab === 'categories' 
                ? 'text-luxury-gold' 
                : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List size={20} />
            {t('categoryManager')}
            {activeTab === 'categories' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-luxury-gold rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'general' ? (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-luxury-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Store className="text-luxury-gold" />
                {t('generalSettings')}
              </h2>
              
              <form onSubmit={handleSaveCafeInfo} className="space-y-6 max-w-2xl">
                {/* Cafe Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">{t('cafeNameEn')}</label>
                    <input
                      type="text"
                      value={cafeInfo.name.en}
                      onChange={(e) => setCafeInfo({ ...cafeInfo, name: { ...cafeInfo.name, en: e.target.value } })}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-gray-400">{t('cafeNameAr')}</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={cafeInfo.name.ar}
                      onChange={(e) => setCafeInfo({ ...cafeInfo, name: { ...cafeInfo.name, ar: e.target.value } })}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Save size={20} />
                    {isSavingInfo ? 'Saving...' : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <List className="text-luxury-gold" />
                  {t('categoryManager')}
                </h2>
                <button
                  onClick={() => handleOpenModal()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    isDarkMode 
                      ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <Plus size={20} />
                  {t('addCategory')}
                </button>
              </div>

              <div className="grid gap-4">
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex justify-between items-center ${
                      isDarkMode ? 'bg-luxury-800 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-bold">{category.name[language] || category.name.en}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        {language === 'en' ? category.name.ar : category.name.en}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(category)}
                        className="p-2 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Modal */}
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
                  {editingCategory ? t('editCategory') : t('addCategory')}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categoryNameEn')}</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.nameEn}
                    onChange={e => setCategoryForm({...categoryForm, nameEn: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('categoryNameAr')}</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={categoryForm.nameAr}
                    onChange={e => setCategoryForm({...categoryForm, nameAr: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
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
