import React, { useEffect, useState } from 'react';
import {
  Receipt,
  User,
  Phone,
  MapPin,
  Search,
  Plus,
  Trash2,
  Printer,
  Calculator,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';
import { Product, CartItem, Customer, ProductCategory, Invoice } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../common/EmptyState';
import { fmtNum } from '../../lib/formatters';
import { downloadElementAsPDF } from '../../lib/pdfHelper';

export const PosBillingScreen: React.FC = () => {
  const { activeStoreId, activeStoreName, permissions, currentUser } = usePermissions();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout Toggle State
  const [isFullWidthCalc, setIsFullWidthCalc] = useState(false);

  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'retail' | 'dealer'>('retail');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Item Selection State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);
  const [sellUnit, setSellUnit] = useState<string>('sqft');
  const [directSqft, setDirectSqft] = useState<number | undefined>(undefined);

  // Glass Size Calculator (Inches)
  const [heightInches, setHeightInches] = useState<number>(0);
  const [widthInches, setWidthInches] = useState<number>(0);

  // Cart Items State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Memo Preview & Print Modal
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSignatureOption, setShowSignatureOption] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const prods = await api.getProducts(activeStoreId);
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProductId(prods[0].id);
          setRate(prods[0].sellingPrice);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [activeStoreId]);

  // ESC Key listener to close PDF / Print preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrintModal) {
        setShowPrintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintModal]);

  // Handle Product Selection Change
  useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setRate(prod.sellingPrice);
      setSellUnit(prod.unit || 'sqft');
      setHeightInches(0);
      setWidthInches(0);
      setDirectSqft(undefined);
    }
  }, [selectedProductId, products]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery =
      p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Calculated SqFt per 1 pc: (Height × Width) / 144
  const calculatedOnePcSqft =
    heightInches > 0 && widthInches > 0
      ? Number(((heightInches * widthInches) / 144).toFixed(2))
      : 0;

  // Calculated Total SqFt for the line item
  const calculatedTotalSqft =
    sellUnit === 'sqft'
      ? directSqft && directSqft > 0
        ? Number(directSqft.toFixed(2))
        : heightInches > 0 && widthInches > 0
        ? Number(((heightInches * widthInches * quantity) / 144).toFixed(2))
        : Number(quantity.toFixed(2))
      : 0;

  // Estimated Item Total before adding to cart
  const estimatedItemTotal =
    sellUnit === 'sqft'
      ? Math.round(calculatedTotalSqft * rate)
      : Math.round(quantity * rate);

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    let itemTotal = 0;
    let itemSqft: number | undefined = undefined;

    if (sellUnit === 'sqft') {
      if (directSqft && directSqft > 0) {
        itemSqft = Number(directSqft.toFixed(2));
        itemTotal = Math.round(itemSqft * rate);
      } else if (heightInches > 0 && widthInches > 0) {
        itemSqft = Number(((heightInches * widthInches * quantity) / 144).toFixed(2));
        itemTotal = Math.round(itemSqft * rate);
      } else {
        itemSqft = Number(quantity.toFixed(2));
        itemTotal = Math.round(quantity * rate);
      }
    } else {
      itemTotal = Math.round(quantity * rate);
    }

    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: selectedProduct.id,
      productNameBn: selectedProduct.nameBn,
      productNameEn: selectedProduct.nameEn,
      category: selectedProduct.category,
      unit: sellUnit,
      rate,
      qty: quantity,
      heightInches: heightInches > 0 ? heightInches : undefined,
      widthInches: widthInches > 0 ? widthInches : undefined,
      sqft: itemSqft,
      total: itemTotal,
    };

    setCartItems([...cartItems, newItem]);

    // Reset inputs
    setQuantity(1);
    setHeightInches(0);
    setWidthInches(0);
    setDirectSqft(undefined);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((i) => i.id !== id));
  };

  const handleUpdateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };
        const newQty = updated.qty !== undefined ? Math.max(0, updated.qty) : item.qty;
        const newRate = updated.rate !== undefined ? Math.max(0, updated.rate) : item.rate;

        let newSqft = updated.sqft;
        let newTotal = 0;

        if (updated.heightInches && updated.widthInches && updated.heightInches > 0 && updated.widthInches > 0) {
          newSqft = Number(((updated.heightInches * updated.widthInches * newQty) / 144).toFixed(2));
          newTotal = Math.round(newSqft * newRate);
        } else if (updated.unit === 'sqft') {
          newSqft = updated.sqft !== undefined ? updated.sqft : (item.sqft !== undefined ? item.sqft : newQty);
          newTotal = Math.round(newSqft * newRate);
        } else {
          newTotal = Math.round(newQty * newRate);
        }

        return {
          ...updated,
          qty: newQty,
          rate: newRate,
          sqft: newSqft,
          total: newTotal,
        };
      })
    );
  };

  // Billing Totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const effectiveDiscount = permissions.canApplyDiscount ? discount : 0;
  const grandTotal = Math.max(0, subtotal - effectiveDiscount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  // Save & Print Memo
  const handleSaveAndPrint = async () => {
    if (cartItems.length === 0) return;

    try {
      const invoiceData = {
        storeId: activeStoreId,
        customerName: customerName || 'সাধারণ ক্রেতা',
        customerType,
        customerMobile: customerMobile || 'N/A',
        customerAddress: customerAddress || 'N/A',
        items: cartItems.map((item) => ({
          productId: item.productId,
          productNameBn: item.productNameBn,
          productNameEn: item.productNameEn,
          rate: item.rate,
          qty: item.qty,
          unit: item.unit,
          heightInches: item.heightInches,
          widthInches: item.widthInches,
          sqft: item.sqft,
          total: item.total,
        })),
        subtotal,
        discount: effectiveDiscount,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentStatus:
          dueAmount === 0 ? ('paid' as const) : paidAmount > 0 ? ('partial' as const) : ('due' as const),
        createdByName: currentUser?.name || 'স্টাফ',
      };

      const invoice = await api.createInvoice(invoiceData);
      setSavedInvoice(invoice);
      setShowPrintModal(true);

      // Reset Form
      setCartItems([]);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerAddress('');
      setDiscount(0);
      setPaidAmount(0);

      setSuccessMsg(`মেমো #${invoice.invoiceNo} সফলভাবে সংরক্ষিত হয়েছে!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Receipt className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{t('navBilling')}</h2>
            <p className="text-xs text-slate-400">খুচরা ও ডিলার ক্যাশ মেমো বিলিং ক্যালকুলেটর</p>
          </div>
        </div>

        <button
          onClick={() => setIsFullWidthCalc(!isFullWidthCalc)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
        >
          {isFullWidthCalc ? <Minimize2 className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{t('toggleFullWidth')}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two-Column / Full-Width Layout */}
      <div
        className={`grid gap-6 ${
          isFullWidthCalc ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
        }`}
      >
        {/* Left Column: Customer Info & Product Selection Calculator */}
        <div className={`${isFullWidthCalc ? 'w-full' : 'lg:col-span-7'} space-y-6`}>
          {/* Customer Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>{t('customerInfo')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('customerName')}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: মো: কামরুল ইসলাম"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('customerType')}
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="retail">{t('typeRetail')}</option>
                  <option value="dealer">{t('typeDealer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('customerMobile')}
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="01711XXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('customerAddress')}
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="ঠিকানা / লোকেশন"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Product Selector & Glass Calculator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>{t('calcSectionTitle')}</span>
              </span>
              {selectedProduct && (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  স্টক: {selectedProduct.stockQty} {selectedProduct.unit}
                </span>
              )}
            </h3>

            {/* Category Filter + Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('categoryFilter')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">সকল ক্যাটাগরি (All)</option>
                  <option value="glass">গ্লাস (Glass)</option>
                  <option value="thai">থাই (Thai)</option>
                  <option value="aluminum">অ্যালুমিনিয়াম (Aluminum)</option>
                  <option value="accessories">এক্সেসরিজ (Accessories)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('productSearch')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="পণ্যের নাম লিখে খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Product Select Dropdown & Sell Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('selectProduct')}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameBn} ({p.nameEn}) - ৳{p.sellingPrice}/{p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  বিক্রয় একক (Sell Unit)
                </label>
                <select
                  value={sellUnit}
                  onChange={(e) => setSellUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-bold uppercase"
                >
                  <option value="sqft">SqFt (স্কোয়ার ফিট)</option>
                  <option value="pcs">Pcs (পিস)</option>
                  <option value="kg">Kg (কেজি)</option>
                  <option value="feet">Feet (ফিট)</option>
                  <option value="meter">Meter (মিটার)</option>
                  <option value="liter">Liter (লিটার)</option>
                  <option value="set">Set (সেট)</option>
                </select>
              </div>
            </div>

            {/* Glass Size Calculator or Direct SqFt */}
            {sellUnit === 'sqft' && (
              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>গ্লাস ও স্কোয়ার ফিট মাপ (Inches / SqFt Calculator)</span>
                  </h4>
                  {calculatedOnePcSqft > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      ১ পিস = {calculatedOnePcSqft} SqFt
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      দৈর্ঘ্য / Height (ইঞ্চি)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={heightInches || ''}
                      onChange={(e) => {
                        setHeightInches(parseFloat(e.target.value) || 0);
                        if (e.target.value) setDirectSqft(undefined);
                      }}
                      placeholder="যেমন: 72"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      প্রস্থ / Width (ইঞ্চি)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={widthInches || ''}
                      onChange={(e) => {
                        setWidthInches(parseFloat(e.target.value) || 0);
                        if (e.target.value) setDirectSqft(undefined);
                      }}
                      placeholder="যেমন: 48"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-amber-400 mb-1">
                      অথবা সরাসরি স্কোয়ার ফিট (SqFt)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={directSqft ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDirectSqft(isNaN(val) ? undefined : val);
                        if (!isNaN(val)) {
                          setHeightInches(0);
                          setWidthInches(0);
                        }
                      }}
                      placeholder="যেমন: 25.5"
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rate & Qty Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  দর (Price per {sellUnit.toUpperCase()}) (৳)
                </label>
                <input
                  type="number"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {sellUnit === 'sqft' && heightInches > 0 && widthInches > 0
                    ? 'মোট পিস (Pieces Count)'
                    : `পরিমাণ (${sellUnit.toUpperCase()})`}
                </label>
                <input
                  type="number"
                  step="any"
                  min={0.01}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  মোট হিসাব (Calculated Line Item)
                </span>
                <span className="font-semibold text-slate-200">
                  {sellUnit === 'sqft'
                    ? `মোট SqFt: ${calculatedTotalSqft} SqFt (${quantity} পিস)`
                    : `পরিমাণ: ${quantity} ${sellUnit.toUpperCase()}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  আনুমানিক মূল্য
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  ৳ {fmtNum(estimatedItemTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('btnAddCart')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Memo Items Cart & Grand Total */}
        <div className={`${isFullWidthCalc ? 'w-full' : 'lg:col-span-5'} space-y-6`}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <span>{t('cartTitle')}</span>
              <div className="flex items-center gap-2">
                {cartItems.reduce((acc, i) => acc + (i.sqft || 0), 0) > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    মোট: {cartItems.reduce((acc, i) => acc + (i.sqft || 0), 0).toFixed(2)} SqFt
                  </span>
                )}
                <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {cartItems.length} টি আইটেম
                </span>
              </div>
            </h3>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <EmptyState title={t('cartEmpty')} description="বামপাশের ক্যালকুলেটর থেকে পণ্য নির্বাচন করে যোগ করুন।" />
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-xs">{item.productNameBn}</h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {item.unit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline Editable Inputs */}
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                      {item.heightInches && item.widthInches ? (
                        <>
                          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-300">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-mono">H:</span>
                              <input
                                type="number"
                                step="any"
                                value={item.heightInches}
                                onChange={(e) =>
                                  handleUpdateCartItem(item.id, { heightInches: parseFloat(e.target.value) || 0 })
                                }
                                className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-slate-500 font-mono">× W:</span>
                              <input
                                type="number"
                                step="any"
                                value={item.widthInches}
                                onChange={(e) =>
                                  handleUpdateCartItem(item.id, { widthInches: parseFloat(e.target.value) || 0 })
                                }
                                className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-slate-400">"</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">পিস:</span>
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) =>
                                  handleUpdateCartItem(item.id, { qty: parseFloat(e.target.value) || 1 })
                                }
                                className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center font-mono text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                            <span className="text-emerald-400 font-mono font-bold">
                              {item.sqft} SqFt
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">দর: ৳</span>
                              <input
                                type="number"
                                step="any"
                                value={item.rate}
                                onChange={(e) =>
                                  handleUpdateCartItem(item.id, { rate: parseFloat(e.target.value) || 0 })
                                }
                                className="w-16 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-right font-mono text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </>
                      ) : item.unit === 'sqft' ? (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">SqFt:</span>
                            <input
                              type="number"
                              step="any"
                              value={item.sqft ?? item.qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateCartItem(item.id, { sqft: val, qty: val });
                              }}
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center font-mono text-amber-300 font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">দর/SqFt: ৳</span>
                            <input
                              type="number"
                              step="any"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateCartItem(item.id, { rate: parseFloat(e.target.value) || 0 })
                              }
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right font-mono text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">পরিমাণ ({item.unit}):</span>
                            <input
                              type="number"
                              step="any"
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateCartItem(item.id, { qty: parseFloat(e.target.value) || 0 })
                              }
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center font-mono text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">দর: ৳</span>
                            <input
                              type="number"
                              step="any"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateCartItem(item.id, { rate: parseFloat(e.target.value) || 0 })
                              }
                              className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right font-mono text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total Row */}
                    <div className="flex justify-end text-[11px]">
                      <span className="font-mono font-bold text-slate-100 text-xs">
                        মোট: ৳ {fmtNum(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Summary */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t('subtotal')}:</span>
                <span className="font-mono font-bold text-slate-200">
                  ৳ {fmtNum(subtotal)}
                </span>
              </div>

              {permissions.canApplyDiscount ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">{t('discountTk')}:</span>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-28 text-right bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div className="flex justify-between text-slate-500 text-[11px] italic">
                  <span>ছাড় প্রদান নিষ্ক্রিয় (Permission Off)</span>
                  <span>৳ 0</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-emerald-400 pt-2 border-t border-slate-800">
                <span>{t('grandTotal')}:</span>
                <span className="font-mono">৳ {fmtNum(grandTotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-slate-300 font-medium">{t('paidAmountTk')}:</span>
                <input
                  type="number"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-32 text-right bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-between text-xs font-bold text-rose-400 pt-1">
                <span>{t('dueAmountTk')}:</span>
                <span className="font-mono">৳ {fmtNum(dueAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAndPrint}
              disabled={cartItems.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t('btnSavePrintMemo')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Memo Modal */}
      {showPrintModal && savedInvoice && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 relative">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>{t('memoPreviewTitle')}</span>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer select-none bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={showSignatureOption}
                    onChange={(e) => setShowSignatureOption(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-0 accent-emerald-500 w-3.5 h-3.5"
                  />
                  <span>স্বাক্ষর অপশন</span>
                </label>

                <button
                  onClick={() => downloadElementAsPDF('printable-cash-memo', `Cash_Memo_${savedInvoice.invoiceNo}`)}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                  title="Download / Save as PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('btnPrintNow')}</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
                  title="Close Modal (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>বন্ধ করুন (Close)</span>
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-cash-memo" className="p-6 bg-white text-slate-900 font-sans printable-memo text-xs space-y-4">
              {/* Receipt Header */}
              <div className="text-center border-b pb-3 border-slate-300">
                <h2 className="text-base font-bold text-slate-900">{activeStoreName}</h2>
                <p className="text-[11px] text-slate-600">থাই গ্লাস, অ্যালুমিনিয়াম প্রফাইল ও ডোর ফিটিংস পাইকারি ও খুচরা বিক্রেতা</p>
                <p className="text-[10px] text-slate-500 mt-0.5">ক্যাশ মেমো / ইনভয়েস</p>
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                <div>
                  <p><strong>মেমো নং:</strong> {savedInvoice.invoiceNo}</p>
                  <p><strong>গ্রাহক:</strong> {savedInvoice.customerName} ({savedInvoice.customerType === 'dealer' ? 'ডিলার' : 'খুচরা'})</p>
                  <p><strong>মোবাইল:</strong> {savedInvoice.customerMobile}</p>
                </div>
                <div className="text-right">
                  <p><strong>তারিখ:</strong> {savedInvoice.createdAt ? new Date(savedInvoice.createdAt).toLocaleDateString('bn-BD') : '-'}</p>
                  <p><strong>বিক্রয়কর্মী:</strong> {savedInvoice.createdByName}</p>
                  <p><strong>ঠিকানা:</strong> {savedInvoice.customerAddress}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-1.5 border-r border-slate-300">পণ্যের নাম</th>
                    <th className="p-1.5 border-r border-slate-300 text-center">ইউনিট</th>
                    <th className="p-1.5 border-r border-slate-300 text-center">সাইজ / পরিমাণ</th>
                    <th className="p-1.5 border-r border-slate-300 text-right">দর (৳)</th>
                    <th className="p-1.5 text-right">মোট (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {savedInvoice.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border-r border-slate-300 font-medium">{it.productNameBn}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold text-slate-800 uppercase text-[10px]">
                        {it.unit || 'sqft'}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center">
                        {it.heightInches && it.widthInches
                          ? `${it.heightInches}"×${it.widthInches}" (${it.sqft} SqFt)`
                          : `${it.qty} ${it.unit}`}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-right">৳{fmtNum(it.rate)}</td>
                      <td className="p-1.5 text-right font-bold">৳{fmtNum(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-60 text-[11px] space-y-1 font-semibold">
                  {savedInvoice.items.reduce((sum, item) => sum + (item.sqft || 0), 0) > 0 && (
                    <div className="flex justify-between text-slate-800 font-bold border-b border-slate-300 pb-1 mb-1">
                      <span>মোট স্কোয়ার ফিট (Total SqFt):</span>
                      <span>{savedInvoice.items.reduce((sum, item) => sum + (item.sqft || 0), 0).toFixed(2)} SqFt</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>সাব-টোটাল:</span>
                    <span>৳ {fmtNum(savedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডিসকাউন্ট:</span>
                    <span>- ৳ {fmtNum(savedInvoice.discount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-400 pt-1 text-sm font-bold text-slate-900">
                    <span>সর্বমোট বিল:</span>
                    <span>৳ {fmtNum(savedInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>নগদ জমা:</span>
                    <span>৳ {fmtNum(savedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>বাকি পাওনা:</span>
                    <span>৳ {fmtNum(savedInvoice.dueAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures Section */}
              {showSignatureOption && (
                <div className="pt-12 pb-2 grid grid-cols-3 gap-4 text-center text-[11px] text-slate-800">
                  <div>
                    <div className="border-t border-dashed border-slate-400 pt-1 font-semibold">
                      গ্রাহকের স্বাক্ষর
                    </div>
                    <span className="text-[9px] text-slate-500">(Customer)</span>
                  </div>

                  <div>
                    <div className="border-t border-dashed border-slate-400 pt-1 font-semibold">
                      বিক্রয়কর্মীর স্বাক্ষর
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 mt-0.5 block">
                      {savedInvoice.createdByName || 'বিক্রয়কর্মী'}
                    </span>
                  </div>

                  <div>
                    <div className="border-t border-dashed border-slate-400 pt-1 font-semibold">
                      অনুমোদিত স্বাক্ষর
                    </div>
                    <span className="text-[9px] text-slate-500">(Authorized)</span>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
                <p>ধন্যবাদ! আবার আসবেন। ক্রয়ে কোনো পরিবর্তন করতে মূল মেমো সঙ্গে রাখুন।</p>
                <p className="font-mono mt-0.5">Software by Thai Glass POS Systems</p>
              </div>
            </div>

            {/* Bottom Modal Footer (no-print) */}
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadElementAsPDF('printable-cash-memo', `Cash_Memo_${savedInvoice.invoiceNo}`)}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন (Print Now)</span>
                </button>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
              >
                <X className="w-4 h-4" />
                <span>বন্ধ করুন (Close)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
