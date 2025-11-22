
export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
  description?: string;
  stock: number;
  isUnlimited: boolean;
  // New fields for auto-reset
  initialStock?: number; 
  autoResetStock?: boolean; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  timestamp: number;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'qris' | 'debit';
  customerName?: string; // Optional Customer Name
  // Payment Details
  cashReceived?: number;
  change?: number;
  // Tax Details Snapshot
  taxRate?: number;
  taxAmount?: number;
  // Discount Details Snapshot
  discountEnabled?: boolean;
  discountType?: 'percent' | 'nominal';
  discountRate?: number; // Stores the value (percent or nominal amount)
  discountAmount?: number; // The actual deducted amount in currency
}

export interface CafeSettings {
  name: string;
  address: string;
  phone: string;
  footerMessage: string;
  logo?: string; // Base64 Image
  // Tax Configuration
  taxEnabled: boolean;
  taxRate: number; // in percentage
  // Discount Configuration
  discountEnabled: boolean;
  discountType: 'percent' | 'nominal';
  discountRate: number; // Stores value. If type is nominal, this is the amount in Rp.
  // Printer Configuration
  printerType: 'browser' | 'bluetooth';
  printerWidth: 32 | 48; // Characters per line (32 for 58mm, 48 for 80mm)
}

export type ViewState = 'pos' | 'inventory' | 'reports' | 'history' | 'settings';
