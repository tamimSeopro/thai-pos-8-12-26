import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Truck,
  CheckCircle2,
  DollarSign,
  Layers,
  X,
  EyeOff,
} from 'lucide-react';
import { Product, ProductCategory, StockArrival } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../common/EmptyState';
import { fmtNum } from '../../lib/formatters';

export const InventoryScreen: React.FC = () => {
  const { activeStoreId, permissions } = usePermissions();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [stockArrivals, setStockArrivals] = useState<StockArrival[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<ProductCategory | 'all' | 'arrivals'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form fields
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<ProductCategory>('glass');
  const [unit, setUnit] = useState<string>('sqft');
  const [stockQty, setStockQty] = useState<number>(100);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(50);
  const [buyingPrice, setBuyingPrice] = useState<number>(50);
  const [sellingPrice, setSellingPrice] = useState<number>(75);
  const [thicknessMm, setThicknessMm] = useState<number | undefined>(undefined);
  const [color, setColor] = useState('');

  // Stock Arrival Entry Form state inside arrivals tab
  const [arrivalProductId, setArrivalProductId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [receivedQty, setReceivedQty] = useState<number>(100);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [arrivalNote, setArrivalNote] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, arrs] = await Promise.all([
        api.getProducts(activeStoreId),
        api.getStockArrivals(activeStoreId),
      ]);
      setProducts(prods);
      setStockArrivals(arrs);
      if (prods.length > 0 && !arrivalProductId) {
        setArrivalProductId(prods[0].id);
        setUnitCost(prods[0].buyingPrice);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStoreId]);

  const openAddModal = () => {
    setEditingProductId(null);
    setNameBn('');
    setNameEn('');
    setCategory('glass');
    setUnit('sqft');
    setStockQty(100);
    setLowStockThreshold(50);
    setBuyingPrice(50);
    setSellingPrice(75);
    setThicknessMm(undefined);
    setColor('');
    setShowProductModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setNameBn(prod.nameBn);
    setNameEn(prod.nameEn);
    setCategory(prod.category);
    setUnit(prod.unit);
    setStockQty(prod.stockQty);
    setLowStockThreshold(prod.lowStockThreshold);
    setBuyingPrice(prod.buyingPrice);
    setSellingPrice(prod.sellingPrice);
    setThicknessMm(prod.thicknessMm);
    setColor(prod.color || '');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          nameBn,
          nameEn,
          category,
          unit,
          stockQty,
          lowStockThreshold,
          buyingPrice,
          sellingPrice,
          thicknessMm,
          color,
        });
        setSuccessMsg('পণ্য সফলভাবে আপডেট হয়েছে!');
      } else {
        await api.createProduct({
          storeId: activeStoreId,
          nameBn,
          nameEn,
          category,
          unit,
          stockQty,
          lowStockThreshold,
          buyingPrice,
          sellingPrice,
          thicknessMm,
          color,
        });
        setSuccessMsg('নতুন পণ্য সফলভাবে ইনভেন্টরিতে যুক্ত হয়েছে!');
      }

      setShowProductModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) return;
    try {
      await api.deleteProduct(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Record Stock Arrival Submission
  const handleAddStockArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalProductId || receivedQty <= 0) return;

    const prod = products.find((p) => p.id === arrivalProductId);
    if (!prod) return;

    try {
      await api.createStockArrival({
        storeId: activeStoreId,
        productId: prod.id,
        productName: prod.nameBn,
        supplierName: supplierName || 'সাধারণ সাপ্লায়ার',
        receivedQty,
        unitCost: unitCost || prod.buyingPrice,
        totalCost: (unitCost || prod.buyingPrice) * receivedQty,
        date: new Date().toISOString().split('T')[0],
        note: arrivalNote,
      });

      setSuccessMsg(`"${prod.nameBn}" এর ${receivedQty} ${prod.unit} নতুন স্টক যুক্ত হয়েছে!`);
      setReceivedQty(100);
      setSupplierName('');
      setArrivalNote('');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesTab = activeTab === 'all' || activeTab === 'arrivals' || p.category === activeTab;
    const matchesQuery =
      p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Package className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{t('inventoryTitle')}</h2>
            <p className="text-xs text-slate-400">গ্লাস, থাই সেকশন ও অ্যালুমিনিয়াম আইটেম তালিকা</p>
          </div>
        </div>

        {permissions.canAddProduct && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('btnAddNewProduct')}</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('tabAll')}
          </button>

          <button
            onClick={() => setActiveTab('glass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'glass'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('tabGlass')}
          </button>

          <button
            onClick={() => setActiveTab('thai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'thai'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('tabThai')}
          </button>

          <button
            onClick={() => setActiveTab('aluminum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'aluminum'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('tabAluminum')}
          </button>

          <button
            onClick={() => setActiveTab('accessories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'accessories'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('tabAccessories')}
          </button>

          <button
            onClick={() => setActiveTab('arrivals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'arrivals'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{t('tabStockArrivals')}</span>
            <span className="bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
              {t('newBadge')}
            </span>
          </button>
        </div>

        {/* Search Input Top-Right */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'arrivals' ? (
        /* Stock Arrivals Tab View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Record Stock Arrival Form (5 cols) */}
          {permissions.canManageStockArrivals ? (
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>{t('stockArrivalTitle')}</span>
              </h3>

              <form onSubmit={handleAddStockArrival} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('selectProduct')}
                  </label>
                  <select
                    value={arrivalProductId}
                    onChange={(e) => {
                      setArrivalProductId(e.target.value);
                      const p = products.find((x) => x.id === e.target.value);
                      if (p) setUnitCost(p.buyingPrice);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameBn} ({p.stockQty} {p.unit} মজুদ)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('supplierName')}
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="যেমন: পিএইচপি গ্লাস লিমিটেড"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('receivedQty')}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('unitCostPrice')}
                    </label>
                    <input
                      type="number"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('expDescription')}
                  </label>
                  <input
                    type="text"
                    value={arrivalNote}
                    onChange={(e) => setArrivalNote(e.target.value)}
                    placeholder="চালান নং বা গাড়ি নম্বর..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-950/40"
                >
                  {t('btnAddStockArrivalSubmit')}
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-5 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 italic">
              স্টক আগমন এন্ট্রি করার অনুমতি আপনার অ্যাকাউন্ট থেকে বন্ধ আছে।
            </div>
          )}

          {/* Recent Stock Arrivals Log List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800 flex items-center justify-between mb-4">
              <span>{t('stockArrivalHistoryTitle')}</span>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                {stockArrivals.length} টি লগ
              </span>
            </h3>

            {stockArrivals.length === 0 ? (
              <EmptyState title={t('noStockArrivals')} description="নতুন মালামাল এন্ট্রি করা হলে এখানে রেকর্ড দেখা যাবে।" />
            ) : (
              <div className="space-y-3">
                {stockArrivals.map((arr) => (
                  <div
                    key={arr.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100">{arr.productName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        সাপ্লায়ার: <strong>{arr.supplierName}</strong> | তারিখ: {arr.date}
                      </p>
                      {arr.note && <p className="text-[10px] text-slate-500 italic mt-0.5">{arr.note}</p>}
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        +{arr.receivedQty} পিস/স্কয়ারফিট
                      </span>
                      <p className="text-[10px] text-slate-400">
                        মোট খরচ: ৳{fmtNum(arr.totalCost)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Regular Products Grid Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
          {filteredProducts.length === 0 ? (
            <EmptyState title={t('noProductsFound')} description="নতুন পণ্য যোগ করতে উপরে '+ নতুন পণ্য যোগ করুন' বাটনে ক্লিক করুন।" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/40">
                    <th className="p-3">পণ্যের বিবরণ</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3 text-center">ইউনিট</th>
                    <th className="p-3 text-center">বর্তমান স্টক</th>
                    {permissions.canViewCostPrice && <th className="p-3 text-right">ক্রয়মূল্য</th>}
                    <th className="p-3 text-right">বিক্রয়মূল্য</th>
                    <th className="p-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProducts.map((prod) => {
                    const isLowStock = prod.stockQty <= prod.lowStockThreshold;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-950/40 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-100">{prod.nameBn}</p>
                          <p className="text-[11px] text-slate-400">{prod.nameEn}</p>
                          {prod.thicknessMm && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              {prod.thicknessMm} mm
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                            {prod.category}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="bg-slate-800/80 border border-slate-700/60 text-emerald-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                            {prod.unit || 'sqft'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`font-mono font-bold px-2 py-1 rounded-lg text-xs ${
                                isLowStock
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {prod.stockQty} {prod.unit}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-rose-400" title={t('lowStockWarning')} />
                            )}
                          </div>
                        </td>

                        {permissions.canViewCostPrice && (
                          <td className="p-3 text-right font-mono font-semibold text-slate-400">
                            ৳ {prod.buyingPrice}
                          </td>
                        )}

                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          ৳ {prod.sellingPrice}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {permissions.canEditProduct && (
                              <button
                                onClick={() => openEditModal(prod)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="সম্পাদনা"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {permissions.canDeleteProduct && (
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                title="ডিলিট"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">{t('productModalTitle')}</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('productNameBnLabel')}*
                </label>
                <input
                  type="text"
                  required
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: ৫ মিমি ক্লিয়ার গ্লাস"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('productNameEnLabel')}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. 5mm Clear Glass"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="glass">গ্লাস (Glass)</option>
                    <option value="thai">থাই (Thai)</option>
                    <option value="aluminum">অ্যালুমিনিয়াম (Aluminum)</option>
                    <option value="accessories">এক্সেসরিজ (Accessories)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('unitLabel')}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="sqft">স্কয়ার ফিট (SqFt)</option>
                    <option value="pcs">পিস (Pcs)</option>
                    <option value="feet">ফুট / রানিং ফিট (Feet)</option>
                    <option value="kg">কেজি (Kg)</option>
                    <option value="bundle">বান্ডিল (Bundle)</option>
                    <option value="meter">মিটার (Meter)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('colStockQty')}
                  </label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('lowStockThresholdLabel')}
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('colBuyingPrice')} (৳)
                  </label>
                  <input
                    type="number"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('colSellingPrice')} (৳)
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold"
                >
                  {t('btnSaveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
