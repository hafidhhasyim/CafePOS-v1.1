
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Archive, History as HistoryIcon, Settings, LogOut } from 'lucide-react';
import { Product, Category, Order, ViewState, CartItem, CafeSettings } from './types';
import { StorageService } from './services/storageService';
import PosPage from './components/PosPage';
import InventoryPage from './components/InventoryPage';
import ReportsPage from './components/ReportsPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [currentView, setCurrentView] = useState<ViewState>('pos');
  
  // Global State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<CafeSettings>({
    name: '', 
    address: '', 
    phone: '', 
    footerMessage: '',
    taxEnabled: false,
    taxRate: 0,
    discountEnabled: false,
    discountType: 'percent',
    discountRate: 0
  });

  // Initial Load
  useEffect(() => {
    // Load all data
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
    setOrders(StorageService.getOrders());
    setSettings(StorageService.getSettings());
  }, []);

  // Persist when changed (except orders which are saved individually on checkout)
  useEffect(() => {
    if (products.length > 0) StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) StorageService.saveCategories(categories);
  }, [categories]);

  // Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      
      // Check Stock Limit
      if (!product.isUnlimited) {
        const currentQty = existing ? existing.quantity : 0;
        if (currentQty + 1 > product.stock) {
          alert("Stok tidak mencukupi!");
          return prev;
        }
      }

      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (!item) return prev;

      // Check Stock Limit for increase
      if (delta > 0 && !item.isUnlimited && item.quantity + delta > item.stock) {
        return prev;
      }

      return prev.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const handleCheckout = (orderData: Order) => {
    // Deduct Stock
    const updatedProducts = products.map(p => {
      const orderItem = orderData.items.find(i => i.productId === p.id);
      if (orderItem && !p.isUnlimited) {
        return { ...p, stock: Math.max(0, p.stock - orderItem.quantity) };
      }
      return p;
    });

    setProducts(updatedProducts); // Save new stock levels
    StorageService.saveOrder(orderData);
    setOrders(prev => [orderData, ...prev]);
    clearCart();
  };

  // --- HISTORY & TRANSACTION EDITING LOGIC ---

  // Void/Delete Transaction -> Return Stock
  const handleVoidOrder = (orderId: string) => {
    const orderToVoid = orders.find(o => o.id === orderId);
    if (!orderToVoid) return;

    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Stok akan dikembalikan.')) {
      // Restore Stock
      const updatedProducts = products.map(p => {
        const itemInOrder = orderToVoid.items.find(i => i.productId === p.id);
        if (itemInOrder && !p.isUnlimited) {
          return { ...p, stock: p.stock + itemInOrder.quantity };
        }
        return p;
      });

      // Update State & Storage
      const updatedOrders = orders.filter(o => o.id !== orderId);
      
      setProducts(updatedProducts);
      setOrders(updatedOrders);
      StorageService.saveProducts(updatedProducts);
      StorageService.saveOrders(updatedOrders); 
    }
  };

  // Edit Transaction (Qty Change) -> Adjust Stock Difference
  const handleUpdateOrder = (updatedOrder: Order) => {
    const oldOrder = orders.find(o => o.id === updatedOrder.id);
    if (!oldOrder) return;

    // Calculate Stock Adjustments
    let tempProducts = [...products];
    let stockError = false;

    // Map all involved product IDs
    const allProductIds = new Set([
      ...oldOrder.items.map(i => i.productId),
      ...updatedOrder.items.map(i => i.productId)
    ]);

    // Process stock changes
    const newProductsState = tempProducts.map(prod => {
      if (!allProductIds.has(prod.id) || prod.isUnlimited) return prod;

      const oldItem = oldOrder.items.find(i => i.productId === prod.id);
      const newItem = updatedOrder.items.find(i => i.productId === prod.id);

      const oldQty = oldItem ? oldItem.quantity : 0;
      const newQty = newItem ? newItem.quantity : 0;
      const diff = newQty - oldQty; 

      // If we need more stock (diff > 0), check if we have enough
      if (diff > 0 && prod.stock < diff) {
        stockError = true;
      }

      return { ...prod, stock: prod.stock - diff };
    });

    if (stockError) {
      alert('Gagal mengupdate transaksi: Stok produk tidak mencukupi untuk penambahan jumlah.');
      return;
    }

    // Apply Updates
    setProducts(newProductsState);
    const updatedOrdersList = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updatedOrdersList);
    
    StorageService.saveProducts(newProductsState);
    StorageService.saveOrders(updatedOrdersList);
  };

  // --- SETTINGS & INVENTORY LOGIC ---

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const handleEditProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateSettings = (newSettings: CafeSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleManualResetStock = () => {
    // Perform reset logic directly on current state to ensure sync
    let resetCount = 0;
    const updatedProducts = products.map(p => {
      if (p.autoResetStock && !p.isUnlimited) {
        resetCount++;
        // Use initialStock if available, otherwise fallback to 0 (but careful not to reset unconfigured items)
        const resetValue = p.initialStock !== undefined ? p.initialStock : 0;
        return { ...p, stock: resetValue };
      }
      return p;
    });

    if (resetCount === 0) {
      alert("Tidak ada produk yang diatur untuk reset harian. Silakan atur di menu Inventaris > Edit Produk > Centang 'Reset Stok Tiap Hari'.");
      return;
    }

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);
    // Notification handled in SettingsPage via callback success
  };

  const handleRestoreData = () => {
    // Reload all data from local storage
    setProducts(StorageService.getProducts());
    setCategories(StorageService.getCategories());
    setOrders(StorageService.getOrders());
    setSettings(StorageService.getSettings());
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('pos'); // Reset View
  };

  // Navigation Items
  const navItems = [
    { id: 'pos', label: 'Kasir', icon: ShoppingCart },
    { id: 'history', label: 'Riwayat', icon: HistoryIcon },
    { id: 'inventory', label: 'Inventaris', icon: Archive },
    { id: 'reports', label: 'Laporan', icon: LayoutDashboard },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-0 lg:mr-3">
            K
          </div>
          <span className="hidden lg:block font-bold text-xl text-slate-800">{settings.name || 'KafeKita'}</span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewState)}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              AD
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Admin Kafe</span>
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {currentView === 'pos' && (
          <PosPage 
            products={products} 
            categories={categories} 
            cart={cart}
            settings={settings}
            onAddToCart={addToCart}
            onUpdateCart={updateCartQuantity}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
        )}
        {currentView === 'history' && (
          <HistoryPage 
            orders={orders} 
            products={products}
            settings={settings}
            onVoidOrder={handleVoidOrder}
            onUpdateOrder={handleUpdateOrder}
          />
        )}
        {currentView === 'inventory' && (
          <InventoryPage 
            products={products} 
            categories={categories}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
        {currentView === 'reports' && (
          <ReportsPage orders={orders} />
        )}
        {currentView === 'settings' && (
          <SettingsPage 
            settings={settings}
            products={products}
            onUpdateSettings={handleUpdateSettings}
            onResetStock={handleManualResetStock}
            onRestore={handleRestoreData}
          />
        )}
      </main>
    </div>
  );
};

export default App;
