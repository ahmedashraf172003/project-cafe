import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Coffee, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductManager() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, toggleLanguage } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    price: '',
    descriptionEn: '',
    descriptionAr: '',
    category: '',
    sizes: [],
    addons: [],
    image: null
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nameEn: product.name.en,
        nameAr: product.name.ar,
        price: product.price,
        descriptionEn: product.description.en,
        descriptionAr: product.description.ar,
        category: product.category,
        sizes: product.sizes || [],
        addons: product.addons || [],
        image: product.image || null
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        nameEn: '', nameAr: '', price: '', descriptionEn: '', descriptionAr: '', category: '',
        sizes: [], addons: [], image: null
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imagePath = formData.image;

    // Check if image is a File object (new upload)
    if (formData.image instanceof File) {
      const uploadData = new FormData();
      uploadData.append('image', formData.image);

      try {
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          imagePath = uploadResult.imagePath;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
        return;
      }
    }

    const url = editingProduct 
      ? `${API_URL}/api/products/${editingProduct.id}`
      : `${API_URL}/api/products`;
    
    const method = editingProduct ? 'PUT' : 'POST';

    const payload = {
      name: { en: formData.nameEn, ar: formData.nameAr },
      price: Number(formData.price),
      description: { en: formData.descriptionEn, ar: formData.descriptionAr },
      category: formData.category,
      sizes: formData.sizes,
      addons: formData.addons,
      image: imagePath
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchProducts();
        handleCloseModal();
      } else {
        console.error('Failed to save product');
        alert('Failed to save product. Please try again.');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please check your connection.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // --- Variant Handlers ---
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { name: { en: '', ar: '' }, price: 0 }]
    }));
  };

  const updateSize = (index, field, value, lang = null) => {
    const newSizes = [...formData.sizes];
    if (lang) {
      newSizes[index].name[lang] = value;
    } else {
      newSizes[index][field] = value;
    }
    setFormData({ ...formData, sizes: newSizes });
  };

  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: { en: '', ar: '' }, price: 0 }]
    }));
  };

  const updateAddon = (index, field, value, lang = null) => {
    const newAddons = [...formData.addons];
    if (lang) {
      newAddons[index].name[lang] = value;
    } else {
      newAddons[index][field] = value;
    }
    setFormData({ ...formData, addons: newAddons });
  };

  const removeAddon = (index) => {
    const newAddons = formData.addons.filter((_, i) => i !== index);
    setFormData({ ...formData, addons: newAddons });
  };

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Coffee className="text-luxury-gold" />
          {t('productManager')}
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
            {t('addProduct')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl border relative group ${
              isDarkMode ? 'bg-luxury-800 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleOpenModal(product)}
                className="p-2 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(product.id)}
                className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-4">
              {product.image && (
                <img 
                  src={`${API_URL}${product.image}`} 
                  alt={product.name.en} 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {categories.find(c => c.id === product.category)?.name[language] || product.category}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{product.name[language] || product.name.en}</h3>
            <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              {product.description[language] || product.description.en}
            </p>
            <div className={`text-lg font-bold ${isDarkMode ? 'text-luxury-gold' : 'text-slate-900'}`}>
              {product.price} EGP
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
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('productNameEn')}</label>
                    <input
                      type="text"
                      required
                      value={formData.nameEn}
                      onChange={e => setFormData({...formData, nameEn: e.target.value})}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                          : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('productNameAr')}</label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      value={formData.nameAr}
                      onChange={e => setFormData({...formData, nameAr: e.target.value})}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                          : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('price')}</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                          : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('category')}</label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                          : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                      }`}
                    >
                      <option value="" disabled>{t('category')}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name[language] || cat.name.en}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('productImage')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFormData({...formData, image: e.target.files[0]})}
                    className={`w-full p-2 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('descriptionEn')}</label>
                  <textarea
                    rows="2"
                    value={formData.descriptionEn}
                    onChange={e => setFormData({...formData, descriptionEn: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('descriptionAr')}</label>
                  <textarea
                    rows="2"
                    dir="rtl"
                    value={formData.descriptionAr}
                    onChange={e => setFormData({...formData, descriptionAr: e.target.value})}
                    className={`w-full p-3 rounded-lg outline-none border focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                        : 'bg-slate-50 border-slate-200 focus:ring-slate-900/20'
                    }`}
                  />
                </div>

                {/* --- Sizes Section --- */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold">{t('sizes')}</h3>
                    <button type="button" onClick={addSize} className="text-sm text-blue-500 font-bold flex items-center gap-1">
                      <Plus size={16} /> {t('addSize')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.sizes.map((size, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          placeholder={t('nameEn')}
                          value={size.name.en}
                          onChange={e => updateSize(index, 'name', e.target.value, 'en')}
                          className={`w-1/3 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <input
                          placeholder={t('nameAr')}
                          dir="rtl"
                          value={size.name.ar}
                          onChange={e => updateSize(index, 'name', e.target.value, 'ar')}
                          className={`w-1/3 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <input
                          type="number"
                          placeholder={t('extraPrice')}
                          value={size.price}
                          onChange={e => updateSize(index, 'price', Number(e.target.value))}
                          className={`w-1/4 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <button type="button" onClick={() => removeSize(index)} className="p-2 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- Addons Section --- */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold">{t('addons')}</h3>
                    <button type="button" onClick={addAddon} className="text-sm text-blue-500 font-bold flex items-center gap-1">
                      <Plus size={16} /> {t('addAddon')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.addons.map((addon, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          placeholder={t('nameEn')}
                          value={addon.name.en}
                          onChange={e => updateAddon(index, 'name', e.target.value, 'en')}
                          className={`w-1/3 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <input
                          placeholder={t('nameAr')}
                          dir="rtl"
                          value={addon.name.ar}
                          onChange={e => updateAddon(index, 'name', e.target.value, 'ar')}
                          className={`w-1/3 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <input
                          type="number"
                          placeholder={t('price')}
                          value={addon.price}
                          onChange={e => updateAddon(index, 'price', Number(e.target.value))}
                          className={`w-1/4 p-2 rounded text-sm border outline-none focus:ring-2 ${
                            isDarkMode 
                              ? 'bg-luxury-800 border-white/10 focus:ring-luxury-gold/50' 
                              : 'bg-white border-slate-200 focus:ring-slate-900/20'
                          }`}
                        />
                        <button type="button" onClick={() => removeAddon(index)} className="p-2 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
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
