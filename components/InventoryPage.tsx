
import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, Tag, X, Upload, Image as ImageIcon, AlertTriangle, CheckCircle, Infinity, RefreshCw } from 'lucide-react';
import { Product, Category } from '../types';

interface InventoryPageProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (p: Product) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (c: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodIsUnlimited, setProdIsUnlimited] = useState(false);
  const [prodAutoReset, setProdAutoReset] = useState(false);
  const [prodInitialStock, setProdInitialStock] = useState('');
  
  const [catName, setCatName] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice('');
    setProdCat(categories[0]?.id || '');
    setProdDesc('');
    setProdImage('');
    setProdStock('0');
    setProdIsUnlimited(false);
    setProdAutoReset(false);
    setProdInitialStock('0');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(product.price.toString());
    setProdCat(product.categoryId);
    setProdDesc(product.description || '');
    setProdImage(product.image || '');
    setProdStock(product.stock.toString());
    setProdIsUnlimited(product.isUnlimited);
    setProdAutoReset(product.autoResetStock || false);
    setProdInitialStock(product.initialStock?.toString() || product.stock.toString());
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoResetToggle = (checked: boolean) => {
      setProdAutoReset(checked);
      if (checked && !prodInitialStock) {
          // Auto fill initial stock with current stock if empty
          setProdInitialStock(prodStock || '0');
      }
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodCat) return;

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
      name: prodName,
      price: Number(prodPrice),
      categoryId: prodCat,
      description: prodDesc,
      image: prodImage,
      stock: prodIsUnlimited ? 0 : Number(prodStock),
      isUnlimited: prodIsUnlimited,
      autoResetStock: prodAutoReset,
      initialStock: prodAutoReset ? Number(prodInitialStock) : undefined
    };

    if (editingProduct) {
      onEditProduct(newProduct);
    } else {
      onAddProduct(newProduct);
    }
    setIsModalOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    onAddCategory({
      id: `cat_${Date.now()}`,
      name: catName
    });
    setCatName('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Inventaris</h1>
            <p className="text-slate-500 mt-1">Kelola stok produk, menu, dan kategori.</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Daftar Produk
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Kategori
            </button>
          </div>
        </div>

        {activeTab === 'products' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Semua Produk ({products.length})
              </h2>
              <button 
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Produk
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Gambar</th>
                    <th className="px-6 py-4">Nama Produk</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Stok</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const isLowStock = !product.isUnlimited && product.stock <= 5 && product.stock > 0;
                    const isOutOfStock = !product.isUnlimited && product.stock === 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            <img 
                              src={product.image || `https://picsum.photos/seed/${product.id}/100/100`} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{product.name}</div>
                          {product.autoResetStock && !product.isUnlimited && (
                            <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <RefreshCw className="w-3 h-3" /> Reset Harian: {product.initialStock}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                            {category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           {product.isUnlimited ? (
                             <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-lg w-fit font-medium text-xs">
                               <Infinity className="w-3 h-3" /> Unlimited
                             </span>
                           ) : (
                             <div className={`flex items-center gap-2 font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                                {isOutOfStock ? (
                                  <span className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">Habis</span>
                                ) : isLowStock ? (
                                  <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                    <AlertTriangle className="w-3 h-3" /> {product.stock}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                                    <CheckCircle className="w-3 h-3" /> {product.stock}
                                  </span>
                                )}
                             </div>
                           )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">Rp {product.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(product)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteProduct(product.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Belum ada produk. Silakan tambah produk baru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
              <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Daftar Kategori
              </h2>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <button 
                      onClick={() => onDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
              <h2 className="font-bold text-lg text-slate-800 mb-4">Tambah Kategori Baru</h2>
              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input 
                  type="text" 
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Nama Kategori..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button 
                  type="submit"
                  disabled={!catName}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:bg-slate-300"
                >
                  Simpan
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                {/* Image Upload Section */}
                <div className="flex flex-col items-center mb-4">
                  <div 
                    className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {prodImage ? (
                      <>
                        <img src={prodImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium flex items-center gap-2"><Pencil className="w-4 h-4" /> Ganti Foto</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm font-medium">Klik untuk upload foto</p>
                        <p className="text-slate-400 text-xs">atau drag & drop disini</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {prodImage && (
                    <button 
                      type="button"
                      onClick={() => setProdImage('')}
                      className="text-red-500 text-sm mt-2 hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Produk</label>
                  <input 
                    type="text" required
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Harga (Rp)</label>
                    <input 
                      type="number" required min="0"
                      value={prodPrice}
                      onChange={e => setProdPrice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                    <select 
                      value={prodCat}
                      onChange={e => setProdCat(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Stock Management */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">Manajemen Stok</label>
                  </div>

                  {/* Unlimited Toggle */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isUnlimited"
                      checked={prodIsUnlimited}
                      onChange={e => setProdIsUnlimited(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isUnlimited" className="text-sm text-slate-600 cursor-pointer select-none">Stok Tak Terbatas</label>
                  </div>
                  
                  {!prodIsUnlimited && (
                    <>
                      {/* Current Stock */}
                      <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah Stok Saat Ini</label>
                         <div className="relative">
                           <input 
                             type="number"
                             min="0"
                             value={prodStock}
                             onChange={e => setProdStock(e.target.value)}
                             className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                             Unit
                           </div>
                         </div>
                      </div>

                      {/* Auto Reset Toggle */}
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox"
                            id="autoReset"
                            checked={prodAutoReset}
                            onChange={e => handleAutoResetToggle(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <label htmlFor="autoReset" className="text-sm text-slate-600 cursor-pointer select-none flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-blue-500" /> Reset Stok Tiap Hari
                          </label>
                        </div>

                        {prodAutoReset && (
                          <div className="pl-6 animate-in fade-in slide-in-from-top-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Stok Awal Harian (Default)</label>
                            <input 
                               type="number"
                               min="0"
                               value={prodInitialStock}
                               onChange={e => setProdInitialStock(e.target.value)}
                               className="w-full px-4 py-2 bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                               placeholder="Jumlah reset pagi..."
                             />
                             <p className="text-[10px] text-slate-400 mt-1">Stok akan kembali ke jumlah ini setiap berganti hari.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi (Opsional)</label>
                  <textarea 
                    value={prodDesc}
                    onChange={e => setProdDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200">
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
