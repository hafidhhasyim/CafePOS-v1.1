
import React, { useState, useRef, useEffect } from 'react';
import { Save, RefreshCw, Download, Upload, Store, Database, Check, AlertTriangle, Receipt, Image as ImageIcon, Percent, X, Info, AlertCircle, Lock, Key, Printer, Bluetooth } from 'lucide-react';
import { CafeSettings, Product } from '../types';
import { StorageService } from '../services/storageService';
import { PrinterService } from '../services/printerService';

interface SettingsPageProps {
  settings: CafeSettings;
  products: Product[];
  onUpdateSettings: (settings: CafeSettings) => void;
  onResetStock: () => void;
  onRestore: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, products, onUpdateSettings, onResetStock, onRestore }) => {
  const [formData, setFormData] = useState<CafeSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Count resettable products
  const resettableCount = products.filter(p => p.autoResetStock && !p.isUnlimited).length;

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
    setIsSaved(false);
  };

  const handleDiscountTypeChange = (type: 'percent' | 'nominal') => {
    setFormData(prev => ({ ...prev, discountType: type, discountRate: 0 }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
        ...formData,
        taxRate: Number(formData.taxRate),
        discountRate: Number(formData.discountRate)
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Semua kolom harus diisi.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
      return;
    }

    if (StorageService.checkPassword(oldPassword)) {
      StorageService.setPassword(newPassword);
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 3000);
    } else {
      setPasswordMsg({ type: 'error', text: 'Password lama salah.' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
      setFormData(prev => ({ ...prev, logo: undefined }));
      setIsSaved(false);
  };

  const handleExport = () => {
    const jsonString = StorageService.exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `kafekita_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (StorageService.importData(content)) {
        alert('Database berhasil dipulihkan!');
        onRestore();
      } else {
        alert('Gagal memulihkan database. File tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetClick = () => {
      if (resettableCount === 0) {
          alert('Tidak ada produk yang diatur untuk "Reset Harian". Silakan atur produk di menu Inventaris terlebih dahulu.');
          return;
      }
      setIsResetModalOpen(true);
  };

  const confirmResetStock = () => {
      onResetStock();
      setIsResetModalOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleConnectPrinter = async () => {
      const success = await PrinterService.connect();
      if (success) {
          alert("Printer Berhasil Terhubung!");
          PrinterService.testPrint(formData);
      }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Pengaturan</h1>
          <p className="text-slate-500 mt-1">Kelola identitas kafe, tampilan struk, pajak, dan data.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Identitas Kafe</h2>
            </div>
            <div className="p-6 space-y-6">
               {/* Logo Upload */}
               <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-auto flex flex-col items-center">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Struk</label>
                    <div 
                        className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden group"
                        onClick={() => logoInputRef.current?.click()}
                    >
                        {formData.logo ? (
                        <>
                            <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Ubah</span>
                            </div>
                        </>
                        ) : (
                        <>
                            <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                            <span className="text-slate-400 text-xs">Upload</span>
                        </>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    {formData.logo && (
                        <button type="button" onClick={handleRemoveLogo} className="text-red-500 text-xs mt-2 hover:underline">Hapus Logo</button>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Kafe</label>
                        <input 
                            type="text" name="name" required
                            value={formData.name} onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Telepon</label>
                        <input 
                            type="text" name="phone"
                            value={formData.phone} onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Lengkap</label>
                        <textarea 
                        name="address" rows={2} required
                        value={formData.address} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Pesan Footer Struk</label>
                        <input 
                        type="text" name="footerMessage"
                        value={formData.footerMessage} onChange={handleChange}
                        placeholder="Contoh: Terima kasih atas kunjungan Anda!"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Printer Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Printer className="w-6 h-6 text-slate-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Konfigurasi Printer</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Metode Cetak</label>
                <select
                  name="printerType"
                  value={formData.printerType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="browser">Bawaan Browser / System Dialog</option>
                  <option value="bluetooth">Bluetooth Thermal (Langsung)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.printerType === 'browser' 
                    ? 'Menggunakan dialog print bawaan HP/Laptop (cocok untuk printer PDF/AirPrint).'
                    : 'Mengirim perintah RAW ESC/POS langsung ke printer thermal Bluetooth (Hanya Google Chrome).'
                  }
                </p>
              </div>

              {formData.printerType === 'bluetooth' && (
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2">
                       <Bluetooth className="w-5 h-5 text-blue-600 mt-0.5" />
                       <div>
                          <h4 className="font-bold text-blue-800 text-sm">Koneksi Bluetooth</h4>
                          <p className="text-xs text-blue-600">Pastikan Bluetooth HP aktif dan printer sudah dinyalakan.</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handleConnectPrinter}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"
                      >
                        Hubungkan Printer
                      </button>
                      <button
                        type="button"
                        onClick={() => PrinterService.testPrint(formData)}
                        className="px-4 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-semibold"
                      >
                        Tes Cetak
                      </button>
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* Tax & Discount Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Pembayaran (Pajak & Diskon)</h2>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Discount Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Percent className="w-5 h-5" /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Diskon Global</h3>
                            <p className="text-sm text-slate-500">Berikan potongan harga otomatis pada semua transaksi.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="discountEnabled"
                        checked={!!formData.discountEnabled} 
                        onChange={handleToggle} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>

                {formData.discountEnabled && (
                    <div className="pl-4 animate-in fade-in slide-in-from-top-2 space-y-4">
                        {/* Type Selection */}
                        <div>
                             <label className="block text-sm font-semibold text-slate-700 mb-2">Tipe Diskon</label>
                             <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => handleDiscountTypeChange('percent')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        formData.discountType === 'percent' 
                                        ? 'bg-orange-50 border-orange-200 text-orange-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    % Persen
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleDiscountTypeChange('nominal')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        formData.discountType === 'nominal' 
                                        ? 'bg-orange-50 border-orange-200 text-orange-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Rp Nominal
                                </button>
                             </div>
                        </div>

                        {/* Value Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {formData.discountType === 'percent' ? 'Besaran Diskon (%)' : 'Jumlah Nominal Diskon (Rp)'}
                            </label>
                            <div className="relative max-w-xs">
                                {formData.discountType === 'nominal' && (
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
                                )}
                                <input 
                                    type="number" name="discountRate"
                                    min="0" 
                                    max={formData.discountType === 'percent' ? "100" : undefined}
                                    step={formData.discountType === 'percent' ? "0.1" : "500"}
                                    value={formData.discountRate} onChange={handleChange}
                                    className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none ${formData.discountType === 'nominal' ? 'pl-10 pr-4' : 'px-4'}`}
                                />
                                {formData.discountType === 'percent' && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Receipt className="w-5 h-5" /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Pajak (Tax / PPN)</h3>
                            <p className="text-sm text-slate-500">Tambahkan pajak pada total transaksi (setelah diskon).</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="taxEnabled"
                        checked={!!formData.taxEnabled} 
                        onChange={handleToggle} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {formData.taxEnabled && (
                    <div className="pl-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Besaran Pajak (%)</label>
                    <div className="relative max-w-xs">
                        <input 
                        type="number" name="taxRate"
                        min="0" max="100" step="0.1"
                        value={formData.taxRate} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
                    </div>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan
            </button>
            {isSaved && (
              <span className="text-green-600 flex items-center gap-1 text-sm font-medium animate-in fade-in">
                <Check className="w-4 h-4" /> Pengaturan Tersimpan!
              </span>
            )}
          </div>
        </form>

        {/* Password Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 mt-8">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <Lock className="w-6 h-6 text-slate-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Keamanan Akun</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Password Lama</label>
                 <input 
                   type="password" 
                   value={oldPassword}
                   onChange={e => setOldPassword(e.target.value)}
                   className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                 <input 
                   type="password" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                 <input 
                   type="password" 
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 />
               </div>
               <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Ubah Password
                  </button>
                  {passwordMsg.text && (
                    <span className={`text-sm font-medium ${passwordMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {passwordMsg.text}
                    </span>
                  )}
               </div>
            </form>
          </div>
        </div>

        {/* Stock Management (No Form wrapper) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 mt-8">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-amber-50 p-2 rounded-lg">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Operasional Stok</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800">Reset Stok Harian</h3>
                <p className="text-sm text-slate-500 mt-1">Kembalikan jumlah stok produk ke "Stok Awal" yang telah ditentukan.</p>
                <div className="mt-2 text-sm text-slate-600 font-medium flex items-center gap-2">
                   <Info className="w-4 h-4 text-blue-500" />
                   {resettableCount > 0 
                     ? <span className="text-blue-600">{resettableCount} produk terkonfigurasi untuk reset harian.</span> 
                     : <span className="text-slate-400">Belum ada produk yang diatur untuk reset harian.</span>
                   }
                </div>
              </div>
              <button 
                onClick={handleResetClick}
                disabled={resettableCount === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" /> Reset Stok
              </button>
            </div>
            {resetSuccess && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
                    <Check className="w-4 h-4" />
                    Stok harian berhasil direset!
                </div>
            )}
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Database & Backup</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors">
              <h3 className="font-bold text-slate-800 mb-2">Export Database</h3>
              <p className="text-sm text-slate-500 mb-4">Download seluruh data (produk, transaksi, pengaturan) ke file JSON untuk cadangan.</p>
              <button 
                onClick={handleExport}
                className="w-full px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Backup
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors">
              <h3 className="font-bold text-slate-800 mb-2">Import Database</h3>
              <p className="text-sm text-slate-500 mb-4">Pulihkan data dari file JSON. <span className="text-red-500 font-bold">Peringatan: Data saat ini akan tertimpa.</span></p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload File Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Reset */}
      {isResetModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Reset Stok</h3>
                      <p className="text-slate-600 mb-4">
                          Anda akan mereset stok untuk <span className="font-bold text-blue-600">{resettableCount} produk</span> kembali ke jumlah stok awal harian.
                      </p>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-left text-sm text-amber-800 mb-6 flex gap-2 items-start">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Tindakan ini akan menimpa jumlah stok saat ini dengan jumlah stok awal yang telah diatur. Pastikan shift sebelumnya sudah selesai.</span>
                      </div>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setIsResetModalOpen(false)}
                              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                          >
                              Batal
                          </button>
                          <button 
                              onClick={confirmResetStock}
                              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-100 transition-colors"
                          >
                              Ya, Reset Sekarang
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsPage;
