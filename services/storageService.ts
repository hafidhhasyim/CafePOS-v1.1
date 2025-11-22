
import { Product, Category, Order, CafeSettings } from '../types';

const KEYS = {
  PRODUCTS: 'kafekita_products',
  CATEGORIES: 'kafekita_categories',
  ORDERS: 'kafekita_orders',
  SETTINGS: 'kafekita_settings',
  PASSWORD: 'kafekita_auth_password', // New Key for Auth
};

// Initial Data Seed
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Kopi' },
  { id: 'cat_2', name: 'Non-Kopi' },
  { id: 'cat_3', name: 'Makanan' },
  { id: 'cat_4', name: 'Snack' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod_1', name: 'Kopi Susu Gula Aren', price: 18000, categoryId: 'cat_1', description: 'Best seller kopi susu kekinian', stock: 50, isUnlimited: false, autoResetStock: true, initialStock: 50 },
  { id: 'prod_2', name: 'Americano', price: 15000, categoryId: 'cat_1', description: 'Kopi hitam klasik', stock: 0, isUnlimited: true, autoResetStock: false, initialStock: 0 },
  { id: 'prod_3', name: 'Matcha Latte', price: 22000, categoryId: 'cat_2', description: 'Green tea latte premium', stock: 20, isUnlimited: false, autoResetStock: false, initialStock: 20 },
  { id: 'prod_4', name: 'Nasi Goreng Spesial', price: 25000, categoryId: 'cat_3', description: 'Lengkap dengan telur dan ayam', stock: 15, isUnlimited: false, autoResetStock: true, initialStock: 15 },
  { id: 'prod_5', name: 'Kentang Goreng', price: 12000, categoryId: 'cat_4', description: 'Renyah dan gurih', stock: 4, isUnlimited: false, autoResetStock: false, initialStock: 10 },
];

const INITIAL_SETTINGS: CafeSettings = {
  name: 'KafeKita',
  address: 'Jl. Kopi Nikmat No. 123, Jakarta',
  phone: '0812-3456-7890',
  footerMessage: 'Terima Kasih atas kunjungan Anda!',
  taxEnabled: true,
  taxRate: 11,
  discountEnabled: false,
  discountType: 'percent',
  discountRate: 0,
  printerType: 'browser',
  printerWidth: 32
};

export const StorageService = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((p: any) => ({
        ...p,
        stock: p.stock ?? 0,
        isUnlimited: p.isUnlimited ?? false,
        autoResetStock: p.autoResetStock ?? false,
        initialStock: p.initialStock ?? (p.stock || 0)
      }));
    }
    return INITIAL_PRODUCTS;
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : INITIAL_CATEGORIES;
  },

  saveCategories: (categories: Category[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  saveOrder: (order: Order) => {
    const orders = StorageService.getOrders();
    orders.unshift(order);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  saveOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },

  getSettings: (): CafeSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    const parsed = data ? JSON.parse(data) : INITIAL_SETTINGS;
    // Merge with defaults to ensure new fields exist for existing users
    return { 
      ...INITIAL_SETTINGS, 
      ...parsed,
      // Ensure legacy settings have defaults
      discountType: parsed.discountType || 'percent',
      printerType: parsed.printerType || 'browser',
      printerWidth: parsed.printerWidth || 32
    };
  },

  saveSettings: (settings: CafeSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- AUTHENTICATION ---
  checkPassword: (inputPassword: string): boolean => {
    const stored = localStorage.getItem(KEYS.PASSWORD);
    // Default password if not set is 'admin'
    const actual = stored || 'admin'; 
    return inputPassword === actual;
  },

  setPassword: (newPassword: string) => {
    localStorage.setItem(KEYS.PASSWORD, newPassword);
  },
  
  // Manual Stock Reset
  resetStockManually: (): Product[] => {
    const currentProducts = StorageService.getProducts();
    const updatedProducts = currentProducts.map(p => {
      if (p.autoResetStock && !p.isUnlimited) {
        return { ...p, stock: p.initialStock || 0 };
      }
      return p;
    });
    StorageService.saveProducts(updatedProducts);
    return updatedProducts;
  },

  // Export Data (Backup)
  exportData: () => {
    const data = {
      products: StorageService.getProducts(),
      categories: StorageService.getCategories(),
      orders: StorageService.getOrders(),
      settings: StorageService.getSettings(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  // Import Data (Restore)
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.categories) localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.orders) localStorage.setItem(KEYS.ORDERS, JSON.stringify(data.orders));
      if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
};
