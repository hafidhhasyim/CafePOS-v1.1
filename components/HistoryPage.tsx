
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Printer, Edit, Trash2, X, Calendar, Filter, AlertCircle, Check, Minus, Plus } from 'lucide-react';
import { Order, Product, OrderItem, CafeSettings } from '../types';

interface HistoryPageProps {
  orders: Order[];
  products: Product[];
  settings: CafeSettings;
  onVoidOrder: (orderId: string) => void;
  onUpdateOrder: (order: Order) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ orders, products, settings, onVoidOrder, onUpdateOrder }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesId = order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = filterDate ? new Date(order.timestamp).toISOString().split('T')[0] === filterDate : true;
      return matchesId && matchesDate;
    });
  }, [orders, searchQuery, filterDate]);

  // Helper: Format Currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Print Receipt Function
  const handlePrint = (order: Order) => {
    const receiptWindow = window.open('', '', 'width=300,height=600');
    if (!receiptWindow) return;

    // Calculate from items for receipt breakdown
    const orderSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Fallback logic for Tax & Discount
    let calcTax = 0;
    let taxRateDisplay = 0;
    let calcDiscount = 0;
    let discountRateDisplay = 0;
    let discountTypeDisplay = order.discountType || 'percent';

    if (order.taxAmount !== undefined) {
        calcTax = order.taxAmount;
        taxRateDisplay = order.taxRate || 0;
    } 
    
    if (order.discountAmount !== undefined) {
        calcDiscount = order.discountAmount;
        discountRateDisplay = order.discountRate || 0;
    } else {
         // Legacy tax calculation attempt if no stored fields
        if (order.totalAmount > orderSubtotal && order.taxAmount === undefined) {
            calcTax = order.totalAmount - orderSubtotal;
            // Approx
            taxRateDisplay = Math.round((calcTax / orderSubtotal) * 100);
        }
    }
    
    const displayReceived = order.cashReceived || order.totalAmount;
    const displayChange = order.change || 0;
    const formatNum = (num: number) => new Intl.NumberFormat('id-ID').format(num);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Reprint</title>
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
            .reprint-badge { text-align: center; margin-bottom: 5px; font-weight: bold; border: 1px solid #000; padding: 2px; }
          </style>
        </head>
        <body>
          <div class="reprint-badge">COPY / REPRINT</div>
          <div class="center">
            ${settings.logo ? `<img src="${settings.logo}" class="logo" />` : ''}
            <div class="bold" style="font-size: 14px;">${settings.name || 'KafeKita'}</div>
            <div>${settings.address || ''}</div>
            <div>${settings.phone || ''}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="flex">
            <span>Tgl: ${new Date(order.timestamp).toLocaleDateString('id-ID')}</span>
            <span>Jam: ${new Date(order.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div class="left">Order: ${order.id}</div>
          ${order.customerName ? `<div class="left">Pelanggan: ${order.customerName}</div>` : ''}
          
          <div class="divider"></div>
          
          <div>
            ${order.items.map(item => `
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
          
           ${calcDiscount > 0 ? `
          <div class="flex">
            <span>Diskon (${discountTypeDisplay === 'percent' ? discountRateDisplay + '%' : 'Rp'})</span>
            <span>-${formatNum(calcDiscount)}</span>
          </div>
          ` : ''}

          ${calcTax > 0 ? `
          <div class="flex">
            <span>Pajak (${taxRateDisplay}%)</span>
            <span>${formatNum(calcTax)}</span>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
           <div class="flex bold" style="font-size: 14px;">
            <span>TOTAL</span>
            <span>Rp ${formatNum(order.totalAmount)}</span>
          </div>
          
           <br/>

          <div class="flex">
            <span>Metode</span>
            <span>${order.paymentMethod.toUpperCase()}</span>
          </div>
          <div class="flex">
             <span>Bayar</span>
             <span>${formatNum(displayReceived)}</span>
          </div>
          <div class="flex">
             <span>Kembali</span>
             <span>${formatNum(displayChange)}</span>
          </div>
          
          <div class="footer">
            ${settings.footerMessage || 'Terima Kasih (Struk Salinan)'}
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

  // --- Edit Modal Logic ---
  const handleOpenEdit = (order: Order) => {
    // Ensure we have fields for cashReceived even if old record
    const orderCopy = JSON.parse(JSON.stringify(order));
    if (orderCopy.cashReceived === undefined) orderCopy.cashReceived = orderCopy.totalAmount;
    if (orderCopy.change === undefined) orderCopy.change = 0;
    setEditingOrder(orderCopy); 
  };

  const updateOrderTotalAndChange = (order: Order) => {
      const subtotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      // Calculate Discount
      // Priority: stored snapshot, else settings if missing (though edit usually should respect snapshot, we recalculate totals here based on snapshot parameters)
      const discEnabled = order.discountEnabled !== undefined ? order.discountEnabled : settings.discountEnabled;
      const discRate = order.discountRate !== undefined ? order.discountRate : settings.discountRate;
      const discType = order.discountType !== undefined ? order.discountType : settings.discountType;

      let discount = 0;
      if (discEnabled) {
          if (discType === 'nominal') {
              discount = Math.min(discRate, subtotal);
          } else {
              discount = subtotal * (discRate / 100);
          }
      }
      
      const taxable = Math.max(0, subtotal - discount);

      // Calculate Tax
      const taxRate = order.taxRate !== undefined ? order.taxRate : settings.taxRate;
      const tax = taxable * (taxRate / 100);
      
      const total = taxable + tax;
      
      // Reset change logic
      let received = order.cashReceived || 0;
      if (order.paymentMethod !== 'cash') {
          received = total;
      }
      
      const change = Math.max(0, received - total);

      return {
          ...order,
          totalAmount: total,
          cashReceived: received,
          change: change,
          taxAmount: tax,
          taxRate: taxRate,
          discountAmount: discount,
          discountRate: discRate,
          discountEnabled: discEnabled,
          discountType: discType
      };
  };

  const handleEditItemQty = (idx: number, delta: number) => {
    if (!editingOrder) return;
    
    const newItems = [...editingOrder.items];
    const item = newItems[idx];
    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
        if(confirm("Hapus item ini dari transaksi?")) {
            newItems.splice(idx, 1);
        } else {
            return;
        }
    } else {
        // Check stock availability if increasing
        if (delta > 0) {
            const productInfo = products.find(p => p.id === item.productId);
            // We approximate availablity
            const currentInventory = productInfo ? productInfo.stock : 0;
            if (productInfo && !productInfo.isUnlimited && currentInventory <= 0) {
                 alert(`Stok produk mungkin tidak mencukupi.`);
                 // We allow edit but warn
            }
        }
        item.quantity = newQty;
        item.subtotal = item.price * newQty;
    }

    const updatedOrder = updateOrderTotalAndChange({
        ...editingOrder,
        items: newItems
    });
    setEditingOrder(updatedOrder);
  };

  const handlePaymentChange = (val: string) => {
      if (!editingOrder) return;
      const newReceived = Number(val);
      const change = Math.max(0, newReceived - editingOrder.totalAmount);
      setEditingOrder({
          ...editingOrder,
          cashReceived: newReceived,
          change: change
      });
  };

  const handleMethodChange = (method: 'cash' | 'qris' | 'debit') => {
      if (!editingOrder) return;
      let received = editingOrder.cashReceived;
      if (method !== 'cash') {
          received = editingOrder.totalAmount;
      }
      const change = Math.max(0, (received || 0) - editingOrder.totalAmount);
      setEditingOrder({
          ...editingOrder,
          paymentMethod: method,
          cashReceived: received,
          change: change
      });
  };

  const handleSaveEdit = () => {
    if (!editingOrder) return;
    if (editingOrder.items.length === 0) {
        alert("Transaksi tidak boleh kosong. Gunakan fitur Hapus Transaksi jika ingin membatalkan.");
        return;
    }
    // Validate Cash
    if (editingOrder.paymentMethod === 'cash' && (editingOrder.cashReceived || 0) < editingOrder.totalAmount) {
        alert("Uang diterima kurang dari total tagihan!");
        return;
    }

    onUpdateOrder(editingOrder);
    setEditingOrder(null);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-slate-500 mt-1">Kelola, cetak ulang, atau perbaiki kesalahan transaksi.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Cari ID Transaksi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
            <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-slate-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">ID Order</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{new Date(order.timestamp).toLocaleDateString('id-ID')}</div>
                      <div className="text-xs">{new Date(order.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-500">{order.id}</div>
                        {order.customerName && (
                            <div className="text-xs font-semibold text-blue-600 mt-1">{order.customerName}</div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                            {order.items.slice(0, 2).map((item, idx) => (
                                <span key={idx} className="text-slate-700 text-xs">
                                    {item.quantity}x {item.name}
                                </span>
                            ))}
                            {order.items.length > 2 && (
                                <span className="text-xs text-slate-400 italic">+{order.items.length - 2} lainnya...</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{formatRupiah(order.totalAmount)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase
                            ${order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 
                              order.paymentMethod === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                        `}>
                            {order.paymentMethod}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handlePrint(order)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Cetak Ulang Struk"
                            >
                                <Printer className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleOpenEdit(order)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Transaksi"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onVoidOrder(order.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus / Void Transaksi"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada riwayat transaksi yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Edit Transaksi</h3>
                        <p className="text-xs text-slate-500 font-mono">{editingOrder.id}</p>
                    </div>
                    <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Items List */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Item Pesanan</label>
                        <div className="space-y-3">
                            {editingOrder.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                        <p className="text-xs text-slate-400">{formatRupiah(item.price)} / pcs</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleEditItemQty(idx, -1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                                        >
                                            {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                        </button>
                                        <span className="font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleEditItemQty(idx, 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Metode Pembayaran</label>
                        <div className="flex gap-3 mb-4">
                            {['cash', 'qris', 'debit'].map((method) => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method as any)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize border transition-all
                                        ${editingOrder.paymentMethod === method 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                                    `}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                        
                        {editingOrder.paymentMethod === 'cash' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Total Tagihan</label>
                                    <div className="text-lg font-bold text-slate-800">{formatRupiah(editingOrder.totalAmount)}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Uang Diterima</label>
                                    <input 
                                        type="number" 
                                        value={editingOrder.cashReceived || ''}
                                        onChange={(e) => handlePaymentChange(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-600">Kembalian</span>
                                    <span className={`font-bold ${ (editingOrder.change || 0) >= 0 ? 'text-green-600' : 'text-red-600' }`}>
                                        {formatRupiah(editingOrder.change || 0)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setEditingOrder(null)}
                        className="px-5 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSaveEdit}
                        className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
