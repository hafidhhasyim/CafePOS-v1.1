
import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, ShoppingBag, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Order } from '../types';

interface ReportsPageProps {
  orders: Order[];
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

const ReportsPage: React.FC<ReportsPageProps> = ({ orders }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('daily');

  // Helper functions for date comparison
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  };

  const isSameMonth = (d1: Date, d2: Date) => 
    d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  // Filter Orders based on Selected Range
  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0,0,0,0);

      if (selectedRange === 'daily') return isSameDay(orderDate, today);
      if (selectedRange === 'weekly') {
        const startOfWeek = getStartOfWeek(today);
        return orderDate >= startOfWeek;
      }
      if (selectedRange === 'monthly') return isSameMonth(orderDate, today);
      return true;
    });
  }, [orders, selectedRange]);

  // Calculate Stats based on filtered data
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalCount = filteredOrders.length;
    const averageValue = totalCount > 0 ? totalRevenue / totalCount : 0;
    
    // Payment Method Stats
    const byMethod = filteredOrders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return { totalRevenue, totalCount, averageValue, byMethod };
  }, [filteredOrders]);

  // Chart Data Logic
  const chartData = useMemo(() => {
    if (selectedRange === 'daily') {
      // Show hourly data for today
      const hourlyData = Array(24).fill(0).map((_, i) => ({ name: `${i}:00`, total: 0 }));
      filteredOrders.forEach(order => {
        const hour = new Date(order.timestamp).getHours();
        hourlyData[hour].total += order.totalAmount;
      });
      // Filter out hours with no sales at start/end if wanted, or keep full day
      return hourlyData.filter((_, i) => i >= 8 && i <= 22); // Show 8 AM to 10 PM
    } 
    else if (selectedRange === 'weekly') {
      // Show last 7 days
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dailyData = Array(7).fill(0).map((_, i) => ({ name: days[i], total: 0, fullDate: '' }));
      
      filteredOrders.forEach(order => {
        const day = new Date(order.timestamp).getDay();
        dailyData[day].total += order.totalAmount;
      });
      // Rearrange to start from Monday if needed, but standard Day index is fine
      return dailyData;
    }
    else {
      // Monthly - Show days of month
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const monthData = Array(daysInMonth).fill(0).map((_, i) => ({ name: `${i+1}`, total: 0 }));
      filteredOrders.forEach(order => {
        const date = new Date(order.timestamp).getDate();
        monthData[date-1].total += order.totalAmount;
      });
      return monthData;
    }
  }, [filteredOrders, selectedRange]);

  const exportToExcel = () => {
    const title = `Laporan Penjualan ${selectedRange === 'daily' ? 'Harian' : selectedRange === 'weekly' ? 'Mingguan' : 'Bulanan'}`;
    
    // 1. Prepare Data for Sheet 1 (Transaction Details)
    const detailRows = filteredOrders.map(order => ({
      'ID Transaksi': order.id,
      'Tanggal & Waktu': new Date(order.timestamp).toLocaleString('id-ID'),
      'Item Terjual': order.items.map(i => `${i.name} (${i.quantity})`).join(', '),
      'Metode Bayar': order.paymentMethod.toUpperCase(),
      'Total (Rp)': order.totalAmount
    }));

    // 2. Prepare Summary Data (Sheet 2)
    const summaryRows = [
      { 'Metric': 'Total Pendapatan', 'Nilai': stats.totalRevenue },
      { 'Metric': 'Total Transaksi', 'Nilai': stats.totalCount },
      { 'Metric': 'Rata-rata Transaksi', 'Nilai': stats.averageValue },
      { 'Metric': 'Tunai', 'Nilai': stats.byMethod['cash'] || 0 },
      { 'Metric': 'QRIS', 'Nilai': stats.byMethod['qris'] || 0 },
      { 'Metric': 'Debit', 'Nilai': stats.byMethod['debit'] || 0 },
    ];

    // 3. Create Worksheets
    const wsDetails = XLSX.utils.json_to_sheet(detailRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    // 4. Styling Columns (Auto Width approximation)
    const colWidths = [
      { wch: 20 }, // ID
      { wch: 25 }, // Time
      { wch: 50 }, // Items
      { wch: 15 }, // Method
      { wch: 15 }, // Total
    ];
    wsDetails['!cols'] = colWidths;

    // 5. Build Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsDetails, "Detail Transaksi");
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan");

    // 6. Export
    const filename = `Laporan_KafeKita_${selectedRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const formatRupiah = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Laporan Penjualan</h1>
            <p className="text-slate-500 mt-1">
              Periode: <span className="font-semibold text-blue-600 capitalize">{selectedRange === 'daily' ? 'Hari Ini' : selectedRange === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    selectedRange === range 
                    ? 'bg-slate-800 text-white shadow' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range === 'daily' ? 'Harian' : range === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>

            <button 
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pendapatan {selectedRange === 'daily' ? 'Hari Ini' : 'Periode Ini'}</p>
              <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.totalRevenue)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Transaksi</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCount} Order</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rata-rata Order</p>
              <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.averageValue)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Grafik Penjualan</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(value) => `${value/1000}k`} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatRupiah(value), 'Pendapatan']}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Rincian Transaksi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID Order</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{order.id}</td>
                    <td className="px-6 py-4 text-slate-800">
                      {new Date(order.timestamp).toLocaleDateString('id-ID')} <span className="text-slate-400 text-xs ml-1">{new Date(order.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                        ${order.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' : 
                          order.paymentMethod === 'qris' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">{formatRupiah(order.totalAmount)}</td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada data transaksi untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
