import React, { useEffect, useState } from 'react';
import { Moon, Sun, Coffee, ShoppingBag, Globe, Plus, Minus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';

const socket = io(API_URL);

export default function Menu() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [cafeName, setCafeName] = useState(null);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Customization State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customization, setCustomization] = useState({ size: null, addons: [] });

  useEffect(() => {
    // Fetch Products
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error fetching products:', err));

    // Fetch Cafe Info
    fetch(`${API_URL}/api/cafe-info`)
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setCafeName(data.name);
        }
      })
      .catch(err => console.error('Error fetching cafe info:', err));
  }, []);

  const handleAddToCartClick = (product) => {
    if ((product.sizes && product.sizes.length > 0) || (product.addons && product.addons.length > 0)) {
      setSelectedProduct(product);
      setCustomization({ size: null, addons: [] });
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product, customOptions = null) => {
    const cartItem = {
      ...product,
      // Create a unique ID based on options to separate same product with different options
      cartId: customOptions ? `${product.id}-${Date.now()}` : product.id,
      selectedSize: customOptions?.size || null,
      selectedAddons: customOptions?.addons || [],
      // Calculate final price
      finalPrice: (product.price || 0) + 
                  (customOptions?.size?.price || 0) + 
                  (customOptions?.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0)
    };

    setCart(prev => {
      // If it's a simple product, check for duplicates
      if (!customOptions) {
        const existing = prev.find(item => item.id === product.id && !item.selectedSize);
        if (existing) {
          return prev.map(item => 
            item.id === product.id && !item.selectedSize ? { ...item, qty: item.qty + 1 } : item
          );
        }
      }
      return [...prev, { ...cartItem, qty: 1 }];
    });
    
    setSelectedProduct(null);
  };

  const updateQty = (cartId, delta) => {
    setCart(prev => prev.map(item => {
      // Use cartId if available (for custom items), otherwise fallback to id
      const idToMatch = item.cartId || item.id;
      if (idToMatch === cartId) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const placeOrder = () => {
    if (cart.length === 0) return;
    
    const order = {
      tableId: Math.floor(Math.random() * 10) + 1, // Random table for now
      items: cart.map(item => ({
        name: item.name[language] || item.name.en,
        qty: item.qty,
        price: item.finalPrice || item.price,
        size: item.selectedSize,
        addons: item.selectedAddons,
        // Add details string for kitchen/waiter
        details: [
          item.selectedSize ? `${t('size')}: ${item.selectedSize.name[language] || item.selectedSize.name.en}` : '',
          item.selectedAddons && item.selectedAddons.length > 0 
            ? `${t('addons')}: ${item.selectedAddons.map(a => a.name[language] || a.name.en).join(', ')}` 
            : ''
        ].filter(Boolean).join(' | ')
      })),
      total: cart.reduce((sum, item) => sum + ((item.finalPrice || item.price) * item.qty), 0)
    };

    socket.emit('place_order', order);
    alert(t('orderPlaced'));
    setCart([]);
    setIsCartOpen(false);
  };

  const totalAmount = cart.reduce((sum, item) => sum + ((item.finalPrice || item.price) * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-500 ${isDarkMode ? 'bg-luxury-900 text-white' : 'bg-modern-50 text-slate-900'}`}>
      
      <nav className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-white/10 bg-luxury-800/50' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-50`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white'}`}>
            <Coffee size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">
            {cafeName ? (cafeName[language] || cafeName.en) : t('appName')}
          </h1>
        </div>

        <div className="flex gap-4 items-center">
            <Link to="/login" className="text-sm font-bold py-2 px-4 rounded-full border border-current opacity-70 hover:opacity-100">{t('staffLogin')}</Link>
            
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
      </nav>

      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center my-8 md:my-12"
        >
          <h2 className="text-3xl md:text-6xl font-bold mb-4">
            {isDarkMode ? <span className="text-luxury-gold">{t('tasteLuxury')}</span> : <span>{t('freshModern')}</span>}
          </h2>
          <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            {t('experience')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {products.map((product) => (
            <MenuCard 
              key={product.id}
              product={product}
              language={language}
              isDarkMode={isDarkMode}
              onAdd={() => handleAddToCartClick(product)}
            />
          ))}
        </div>
      </main>

      {/* Customization Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDarkMode ? 'bg-luxury-900 border border-white/10 text-white' : 'bg-white text-slate-900'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedProduct.name[language] || selectedProduct.name.en}</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sizes */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex justify-between">
                      {t('selectSize')} 
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">{t('required')}</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.sizes.map((size, idx) => (
                        <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          customization.size === size 
                            ? (isDarkMode ? 'border-luxury-gold bg-luxury-gold/10' : 'border-slate-900 bg-slate-100')
                            : (isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50')
                        }`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              name="size" 
                              checked={customization.size === size}
                              onChange={() => setCustomization(prev => ({ ...prev, size: size }))}
                              className="w-5 h-5 accent-luxury-gold"
                            />
                            <span>{size.name[language] || size.name.en}</span>
                          </div>
                          <span className="font-bold">
                            {size.price > 0 ? `+${size.price}` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addons */}
                {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex justify-between">
                      {t('selectAddons')}
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">{t('optional')}</span>
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.addons.map((addon, idx) => {
                        const isSelected = customization.addons.includes(addon);
                        return (
                          <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? (isDarkMode ? 'border-luxury-gold bg-luxury-gold/10' : 'border-slate-900 bg-slate-100')
                              : (isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50')
                          }`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {
                                  setCustomization(prev => ({
                                    ...prev,
                                    addons: isSelected 
                                      ? prev.addons.filter(a => a !== addon)
                                      : [...prev.addons, addon]
                                  }));
                                }}
                                className="w-5 h-5 accent-luxury-gold"
                              />
                              <span>{addon.name[language] || addon.name.en}</span>
                            </div>
                            <span className="font-bold">+{addon.price}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-xl font-bold">
                  {t('total')}: {
                    (selectedProduct.price || 0) + 
                    (customization.size?.price || 0) + 
                    (customization.addons.reduce((sum, a) => sum + a.price, 0))
                  } EGP
                </div>
                <button
                  disabled={selectedProduct.sizes?.length > 0 && !customization.size}
                  onClick={() => addToCart(selectedProduct, customization)}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${
                    selectedProduct.sizes?.length > 0 && !customization.size
                      ? 'opacity-50 cursor-not-allowed bg-gray-500 text-white'
                      : isDarkMode 
                        ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {t('addToOrder')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile & Desktop) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50"
          >
            <div 
              onClick={() => setIsCartOpen(true)}
              className={`max-w-4xl mx-auto rounded-2xl p-4 shadow-2xl cursor-pointer flex justify-between items-center ${
                isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-black/10 p-2 rounded-full">
                  <ShoppingBag size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">{totalItems} {t('items')}</span>
                  <span className="text-sm opacity-80">{t('viewCart')}</span>
                </div>
              </div>
              <span className="font-bold text-xl">{totalAmount} EGP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal / Bottom Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col ${
                isDarkMode ? 'bg-luxury-900 text-white' : 'bg-white text-slate-900'
              }`}
            >
              {/* Cart Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-luxury-gold" />
                  {t('yourOrder')}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <ChevronDown size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className={`flex justify-between items-center p-4 rounded-xl ${
                    isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                  }`}>
                    <div>
                      <h3 className="font-bold">{item.name[language] || item.name.en}</h3>
                      {/* Show details if any */}
                      {(item.selectedSize || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                        <p className="text-xs opacity-70 mt-1">
                          {[
                            item.selectedSize ? `${item.selectedSize.name[language] || item.selectedSize.name.en}` : '',
                            item.selectedAddons?.map(a => a.name[language] || a.name.en).join(', ')
                          ].filter(Boolean).join(' | ')}
                        </p>
                      )}
                      <p className="text-luxury-gold font-bold">{(item.finalPrice || item.price) * item.qty} EGP</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQty(item.cartId, -1)}
                        className={`p-1 rounded-full ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold w-6 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.cartId, 1)}
                        className={`p-1 rounded-full ${isDarkMode ? 'bg-luxury-gold text-black' : 'bg-slate-900 text-white'}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className={`p-6 border-t ${isDarkMode ? 'border-white/10 bg-luxury-800' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-6 text-xl font-bold">
                  <span>{t('total')}</span>
                  <span>{totalAmount} EGP</span>
                </div>
                <button
                  onClick={placeOrder}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                    isDarkMode 
                      ? 'bg-luxury-gold text-black hover:bg-yellow-500' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {t('placeOrder')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function MenuCard({ product, language, isDarkMode, onAdd }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-4 md:p-6 rounded-2xl border flex flex-col justify-between h-full ${
        isDarkMode ? 'bg-luxury-800 border-white/5' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div>
        {product.image && (
          <img 
            src={`${API_URL}${product.image}`} 
            alt={product.name[language] || product.name.en} 
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        )}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg md:text-xl font-semibold">{product.name[language] || product.name.en}</h3>
          <span className={`font-bold whitespace-nowrap ${isDarkMode ? 'text-luxury-gold' : 'text-slate-900'}`}>
            {product.price} EGP
          </span>
        </div>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
          {product.description[language] || product.description.en}
        </p>
      </div>
      
      <button
        onClick={onAdd}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
          isDarkMode 
            ? 'bg-white/10 hover:bg-white/20 text-white' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
        }`}
      >
        <Plus size={18} />
        {/* Using hardcoded text here as fallback, but ideally use t('addToOrder') */}
        {language === 'en' ? 'Add to Order' : 'أضف للطلب'}
      </button>
    </motion.div>
  )
}
