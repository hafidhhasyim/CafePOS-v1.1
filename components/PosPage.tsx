
import React, { useState, useMemo, useRef } from 'react';
import { Search, Coffee, Utensils, Trash2, Plus, Minus, CreditCard, Banknote, Printer, CheckCircle, ArrowLeft, Infinity, RotateCcw, User } from 'lucide-react';
import { Product, Category, CartItem, Order, CafeSettings } from '../types';
import { PrinterService } from '../services/printerService';

interface PosPageProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  settings: CafeSettings;
  onAddToCart: (product: Product) => void;
  onUpdateCart: (id: string, delta: number) => void;
  onClearCart: () => void;
  onCheckout: (order: Order) => void;
}

const PosPage: React.FC<PosPageProps> = ({ 
  products, 
  categories, 
  cart,
  settings,
  onAddToCart, 
  onUpdateCart, 
  onClearCart,
  onCheckout 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Checkout State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'payment' | 'success'>('method');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations with Settings
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // 1. Calculate Discount
  let discountAmount = 0;
  if (settings.discountEnabled) {
      if (settings.discountType === 'nominal') {
          // Fixed amount, but not more than subtotal
          discountAmount = Math.min(settings.discountRate, subtotal);
      } else {
          // Percentage
          discountAmount = subtotal * (settings.discountRate / 100);
      }
  }
  
  // 2. Base for Tax (Subtotal - Discount)
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  // 3. Calculate Tax
  const taxRate = (settings.taxEnabled === true) ? settings.taxRate : 0;
  const taxAmount = taxableAmount * (taxRate / 100);
  
  // 4. Final Total
  const total = taxableAmount + taxAmount;
  
  const change = Math.max(0, cashReceived - total);

  // Currency Formatter
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Handle Checkout Flow
  const openCheckout = () => {
    setIsCheckoutModalOpen(true);
    setCheckoutStep('method');
    setCashReceived(0);
  };

  const handleSelectMethod = (method: 'cash' | 'qris' | 'debit') => {
    setSelectedPaymentMethod(method);
    if (method === 'cash') {
      setCheckoutStep('payment');
    } else {
      // For non-cash, proceed directly to completion
      finalizeOrder(method);
    }
  };

  const finalizeOrder = (method: 'cash' | 'qris' | 'debit') => {
    const finalCash = method === 'cash' ? cashReceived : total;
    const finalChange = method === 'cash' ? change : 0;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      timestamp: Date.now(),
      items: [...cart].map(c => ({
        productId: c.id,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        subtotal: c.price * c.quantity
      })),
      totalAmount: total,
      paymentMethod: method,
      cashReceived: finalCash,
      change: finalChange,
      customerName: customerName.trim() || undefined,
      // Save snapshots
      taxRate: taxRate,
      taxAmount: taxAmount,
      discountEnabled: settings.discountEnabled,
      discountType: settings.discountType,
      discountRate: settings.discountRate, // Store the raw value (percent or fixed amount)
      discountAmount: discountAmount
    };
    
    setLastOrder(newOrder);
    onCheckout(newOrder);
    setCheckoutStep('success');
  };

  const resetAfterCheckout = () => {
      setIsCheckoutModalOpen(false);
      setCustomerName(''); // Reset customer name
      setCashReceived(0);
      setLastOrder(null);
  }

  const printReceipt = () => {
    if (!lastOrder) return;

    // Check Printer Type
    if (settings.printerType === 'bluetooth') {
        PrinterService.printOrder(lastOrder, settings);
        return;
    }

    // Fallback to Browser Print
    const receiptWindow = window.open('', '', 'width=300,height=600');
    if (!receiptWindow) return;

    // Use stored snapshot data
    const orderSubtotal = lastOrder.items.reduce((s, i) => s + i.subtotal, 0);
    const orderTax = lastOrder.taxAmount || 0;
    const orderTaxRate = lastOrder.taxRate || 0;
    const orderDiscount = lastOrder.discountAmount || 0;
    const orderDiscountRate = lastOrder.discountRate || 0;
    const orderDiscountType = lastOrder.discountType || 'percent';

    const formatNum = (num: number) => new Intl.NumberFormat('id-ID').format(num);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Belanja</title>
          <style>
            @media print {
              body { width: 58mm; margin: 0; padding: 0; }
              @page { margin: 0; size: 58mm auto; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 11px; 
              color: #000; 
              padding: 10px;
              width: 100%;
              max-width: 300px;
              margin: 0 auto;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .left { text-align: left; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item-row { margin-bottom: 4px; }
            .item-name { font-weight: bold; margin-bottom: 2px; }
            .item-details { display: flex; justify-content: space-between; font-size: 10px; padding-left: 8px; }
            .logo { max-width: 80px; max-height: 80px; margin-bottom: 5px; filter: grayscale(100%); }
            .footer { margin-top: 15px; text-align: center; font-size: 9px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="center">
            ${settings.logo ? `<img src="${settings.logo}" class="logo" />` : ''}
            <div class="bold" style="font-size: 14px;">${settings.name || 'KafeKita'}</div>
            <div>${settings.address || ''}</div>
            <div>${settings.phone || ''}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="flex">
            <span>Tgl: ${new Date(lastOrder.timestamp).toLocaleDateString('id-ID')}</span>
            <span>Jam: ${new Date(lastOrder.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div class="left">Order: ${lastOrder.id}</div>
          ${lastOrder.customerName ? `<div class="left">Pelanggan: ${lastOrder.customerName}</div>` : ''}
          
          <div class="divider"></div>
          
          <div>
            ${lastOrder.items.map(item => `
              <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                  <span>${item.quantity} x ${formatNum(item.price)}</span>
                  <span>${formatNum(item.price * item.quantity)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="flex">
            <span>Subtotal</span>
            <span>${formatNum(orderSubtotal)}</span>
          </div>
          
          ${orderDiscount > 0 ? `
          <div class="flex">
            <span>Diskon (${orderDiscountType === 'percent' ? orderDiscountRate + '%' : 'Rp'})</span>
            <span>-${formatNum(orderDiscount)}</span>
          </div>
          ` : ''}

          ${orderTax > 0 ? `
          <div class="flex">
            <span>Pajak (${orderTaxRate}%)</span>
            <span>${formatNum(orderTax)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>

          <div class="flex bold" style="font-size: 14px;">
            <span>TOTAL</span>
            <span>Rp ${formatNum(lastOrder.totalAmount)}</span>
          </div>
          
          <br/>
          
          <div class="flex">
            <span>Bayar (${lastOrder.paymentMethod.toUpperCase()})</span>
            <span>${formatNum(lastOrder.cashReceived || lastOrder.totalAmount)}</span>
          </div>
          <div class="flex">
            <span>Kembali</span>
            <span>${formatNum(lastOrder.change || 0)}</span>
          </div>
          
          <div class="footer">
            ${settings.footerMessage || 'Terima Kasih atas kunjungan Anda!'}
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  const quickCashAmounts = [5000, 10000, 20000, 50000, 100000];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden order-1 lg:order-1">
        {/* Header & Filters */}
        <div className="p-4 lg:p-6 bg-white border-b border-slate-100 shadow-sm z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Menu Pesanan</h1>
              <p className="text-slate-500 text-xs lg:text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="relative w-full sm:w-64 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Cari menu..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Coffee className="w-12 h-12 lg:w-16 lg:h-16 mb-4 opacity-20" />
              <p className="text-sm">Tidak ada produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5 pb-20 lg:pb-0">
              {filteredProducts.map(product => {
                const cartItem = cart.find(c => c.id === product.id);
                const currentQty = cartItem ? cartItem.quantity : 0;
                const isOutOfStock = !product.isUnlimited && product.stock <= 0;
                const canAdd = product.isUnlimited || currentQty < product.stock;

                return (
                  <div 
                    key={product.id} 
                    onClick={() => canAdd && !isOutOfStock && onAddToCart(product)}
                    className={`group bg-white rounded-xl lg:rounded-2xl border shadow-sm transition-all overflow-hidden flex flex-col relative
                      ${isOutOfStock ? 'opacity-60 grayscale border-slate-200 cursor-not-allowed' : 'border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer active:scale-95'}
                    `}
                  >
                    {isOutOfStock && (
                      <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-[10px] lg:text-xs font-bold shadow-sm">HABIS</span>
                      </div>
                    )}
                    
                    {/* Image Height reduced for mobile */}
                    <div className="h-28 sm:h-36 bg-slate-100 relative overflow-hidden">
                      <img 
                        src={product.image || `https://picsum.photos/seed/${product.id}/400/300`} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] lg:text-xs font-semibold shadow-sm text-slate-700 flex items-center gap-1">
                         {product.isUnlimited ? (
                           <Infinity className="w-3 h-3" />
                         ) : (
                           <span>Stok: {product.stock}</span>
                         )}
                      </div>
                      {currentQty > 0 && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                          {currentQty}
                        </div>
                      )}
                    </div>
                    <div className="p-3 lg:p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-800 mb-1 line-clamp-1 text-sm lg:text-base leading-tight">{product.name}</h3>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2 flex-1 hidden sm:block">{product.description || 'Menu spesial cafe.'}</p>
                      <div className="font-bold text-blue-600 text-sm lg:text-base">{formatRupiah(product.price)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart / Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[45vh] lg:h-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-none z-20 order-2 lg:order-2">
        <div className="p-3 lg:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-base lg:text-lg text-slate-800">Pesanan ({cart.reduce((a,b) => a + b.quantity, 0)})</h2>
          <button 
            onClick={onClearCart}
            className="text-red-500 hover:text-red-700 text-xs lg:text-sm font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            disabled={cart.length === 0}
          >
            <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" /> Hapus
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Utensils className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-500 text-sm mb-1">Keranjang Kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-2 lg:gap-3 p-2 lg:p-3 bg-white rounded-lg lg:rounded-xl border border-slate-100 shadow-sm">
                <img 
                  src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} 
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover bg-slate-100"
                  alt={item.name}
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-800 text-xs lg:text-sm line-clamp-1">{item.name}</h4>
                    <span className="font-bold text-slate-800 text-xs lg:text-sm">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1 lg:mt-2">
                    <span className="text-[10px] lg:text-xs text-slate-400">@ {formatRupiah(item.price)}</span>
                    <div className="flex items-center gap-2 lg:gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateCart(item.id, -1); }}
                        className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 hover:border-blue-200 border border-transparent transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs lg:text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!item.isUnlimited && item.quantity >= item.stock) {
                            // Limit reached
                          } else {
                            onUpdateCart(item.id, 1); 
                          }
                        }}
                        disabled={!item.isUnlimited && item.quantity >= item.stock}
                        className={`w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center bg-white rounded shadow-sm border border-transparent transition-all
                          ${!item.isUnlimited && item.quantity >= item.stock ? 'text-slate-300 cursor-not-allowed' : 'hover:text-blue-600 hover:border-blue-200'}
                        `}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 lg:p-6 bg-slate-50 border-t border-slate-200">
           {/* Customer Name Input */}
           <div className="mb-3 lg:mb-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-3 h-3 lg:w-4 lg:h-4" />
                </div>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan (Opsional)"
                  className="w-full pl-8 lg:pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs lg:text-sm"
                />
              </div>
           </div>

          <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-6">
            <div className="flex justify-between text-xs lg:text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            
            {settings.discountEnabled && (
                 <div className="flex justify-between text-xs lg:text-sm text-orange-600 font-medium">
                    <span>Diskon ({settings.discountType === 'percent' ? settings.discountRate + '%' : 'Rp'})</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                 </div>
            )}

            {settings.taxEnabled && (
                <div className="flex justify-between text-xs lg:text-sm text-slate-500">
                    <span>Pajak ({settings.taxRate}%)</span>
                    <span>{formatRupiah(taxAmount)}</span>
                </div>
            )}
            
            <div className="flex justify-between text-base lg:text-lg font-bold text-slate-800 pt-2 lg:pt-3 border-t border-slate-200">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>
          <button 
            onClick={openCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 text-sm lg:text-base"
          >
             Bayar {formatRupiah(total)}
          </button>
        </div>
      </div>

      {/* Advanced Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-slate-800">
                  {checkoutStep === 'method' && 'Pilih Metode Pembayaran'}
                  {checkoutStep === 'payment' && 'Pembayaran Tunai'}
                  {checkoutStep === 'success' && 'Transaksi Berhasil'}
                </h3>
                <p className="text-slate-500 text-xs lg:text-sm mt-1">Total Tagihan: <span className="font-bold text-blue-600">{formatRupiah(total)}</span></p>
              </div>
              {checkoutStep === 'payment' && (
                <button onClick={() => setCheckoutStep('method')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Checkout Steps */}
            <div className="p-4 lg:p-6 overflow-y-auto">
              
              {/* Step 1: Select Method */}
              {checkoutStep === 'method' && (
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleSelectMethod('cash')}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800">Tunai (Cash)</h4>
                      <p className="text-xs text-slate-500">Hitung kembalian</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleSelectMethod('qris')}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <div className="font-bold text-xs">QRIS</div>
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800">QRIS</h4>
                      <p className="text-xs text-slate-500">Scan barcode digital</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleSelectMethod('debit')}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-colors">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800">Debit / Kredit</h4>
                      <p className="text-xs text-slate-500">Mesin EDC</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Step 2: Cash Calculation */}
              {checkoutStep === 'payment' && (
                <div className="space-y-4 lg:space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input 
                        type="number" 
                        autoFocus
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg font-bold text-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Cash Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCashReceived(total)} 
                            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                        >
                            Uang Pas
                        </button>
                        <button 
                            onClick={() => setCashReceived(0)} 
                            className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Reset nominal"
                        >
                           <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        {quickCashAmounts.map(amount => (
                        <button 
                            key={amount}
                            onClick={() => setCashReceived(prev => prev + amount)}
                            className="px-1 py-3 text-[10px] lg:text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 rounded-lg transition-all active:scale-95"
                        >
                            +{amount / 1000}k
                        </button>
                        ))}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${change >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {change >= 0 ? 'Kembalian' : 'Kurang Bayar'}
                      </span>
                      <span className={`text-xl font-bold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatRupiah(Math.abs(change))}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => finalizeOrder('cash')}
                    disabled={cashReceived < total}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                  >
                    Bayar & Selesai
                  </button>
                </div>
              )}

              {/* Step 3: Success & Print */}
              {checkoutStep === 'success' && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2">Pembayaran Berhasil!</h4>
                  <p className="text-slate-500 mb-6 text-sm">Transaksi telah tersimpan dalam sistem.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={printReceipt}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" /> Cetak Struk
                    </button>
                    <button 
                      onClick={resetAfterCheckout}
                      className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold"
                    >
                      Transaksi Baru
                    </button>
                  </div>
                </div>
              )}

            </div>
            
            {/* Footer Cancel (Only show if not success) */}
            {checkoutStep !== 'success' && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-6 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-sm"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;
