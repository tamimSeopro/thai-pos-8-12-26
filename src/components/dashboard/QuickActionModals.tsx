import React, { useState, useEffect } from 'react';
import { X, HandCoins, ReceiptText, UserPlus, PackagePlus, Check } from 'lucide-react';
import { Customer, Product } from '../../types';
import { api } from '../../lib/api';
import { fmtNum } from '../../lib/formatters';

// 1. Quick Collect Due Modal
interface QuickCollectDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStoreId: string;
  customers: Customer[];
  preSelectedCustomer?: Customer | null;
  onSuccess: () => void;
}

export const QuickCollectDueModal: React.FC<QuickCollectDueModalProps> = ({
  isOpen,
  onClose,
  activeStoreId,
  customers,
  preSelectedCustomer,
  onSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preSelectedCustomer?.id || (customers[0]?.id ?? '')
  );
  const [amount, setAmount] = useState<number>(preSelectedCustomer?.totalDue || 0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedCustomer) {
        setSelectedCustomerId(preSelectedCustomer.id);
        setAmount(preSelectedCustomer.totalDue || 0);
      } else if (customers.length > 0) {
        const found = customers.find((c) => (c.totalDue || 0) > 0) || customers[0];
        setSelectedCustomerId(found.id);
        setAmount(found.totalDue || 0);
      }
    }
  }, [isOpen, preSelectedCustomer, customers]);

  if (!isOpen) return null;

  const currentCustomer =
    customers.find((c) => c.id === selectedCustomerId) || preSelectedCustomer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amount <= 0) return;
    setSaving(true);
    try {
      await api.collectCustomerDue(
        activeStoreId,
        selectedCustomerId,
        amount,
        paymentMethod,
        note || 'ড্যাশবোর্ড থেকে বকেয়া আদায়'
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <HandCoins className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">বকেয়া আদায় (Receive Due)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">গ্রাহক নির্বাচন করুন:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const found = customers.find((c) => c.id === e.target.value);
                if (found) setAmount(found.totalDue);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — বকেয়া: ৳{fmtNum(c.totalDue)}
                </option>
              ))}
            </select>
          </div>

          {currentCustomer && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex justify-between">
              <span>মোট বকেয়া পাওনা:</span>
              <strong className="font-mono">৳ {fmtNum(currentCustomer.totalDue)}</strong>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">আদায়ের পরিমাণ (টাকা):</label>
            <input
              type="number"
              min="1"
              max={currentCustomer ? currentCustomer.totalDue : 9999999}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">পেমেন্ট মেথড:</label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'bkash', 'nagad', 'bank'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg border font-bold capitalize transition ${
                    paymentMethod === m
                      ? 'bg-rose-500 text-slate-950 border-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">নোট / বিবরণ (ঐচ্ছিক):</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: ক্যাশ রিসিট বা রেফারেন্স"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || amount <= 0}
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'আদায় সম্পন্ন করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Quick Add Expense Modal
interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStoreId: string;
  onSuccess: () => void;
}

export const QuickAddExpenseModal: React.FC<QuickAddExpenseModalProps> = ({
  isOpen,
  onClose,
  activeStoreId,
  onSuccess,
}) => {
  const [type, setType] = useState<'electricity' | 'rent' | 'salary' | 'transport' | 'other'>('transport');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;
    setSaving(true);
    try {
      await api.createExpense({
        storeId: activeStoreId,
        type,
        amount,
        description,
        date: new Date().toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ReceiptText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">খরচ যোগ করুন (Add Expense)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">খরচের খাত:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            >
              <option value="transport">যাতায়াত ও পরিবহন (Transport)</option>
              <option value="electricity">বিদ্যুৎ ও ইউটিলিটি বিল (Electricity)</option>
              <option value="salary">স্টাফ বেতন ও মজুরি (Salary)</option>
              <option value="rent">দোকান ভাড়া (Rent)</option>
              <option value="other">অন্যান্য সাধারণ ব্যয় (Other)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">পরিমাণ (টাকা):</label>
            <input
              type="number"
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="৳ 0"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">বিবরণ:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: গ্লাস আনলোডিং লেবার খরচ"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || amount <= 0 || !description.trim()}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'যোগ হচ্ছে...' : 'খরচ নিশ্চিত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Quick Add Customer Modal
interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStoreId: string;
  onSuccess: () => void;
}

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  onClose,
  activeStoreId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [type, setType] = useState<'retail' | 'dealer'>('retail');
  const [address, setAddress] = useState('');
  const [initialDue, setInitialDue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createCustomer({
        storeId: activeStoreId,
        name,
        mobile,
        type,
        address,
        totalDue: initialDue || 0,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">নতুন গ্রাহক যোগ (Add Customer)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">গ্রাহকের নাম:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: আবাসন বিল্ডার্স / মো: রফিকুল"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">মোবাইল নম্বর:</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">গ্রাহক ধরন:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('retail')}
                className={`py-1.5 rounded-lg border font-bold transition ${
                  type === 'retail'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                খুচরা (Retail)
              </button>
              <button
                type="button"
                onClick={() => setType('dealer')}
                className={`py-1.5 rounded-lg border font-bold transition ${
                  type === 'dealer'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                ডিলার (Dealer)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">ঠিকানা:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: মিরপুর ১০, ঢাকা"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">পূর্বের বাকি (যদি থাকে):</label>
            <input
              type="number"
              min="0"
              value={initialDue || ''}
              onChange={(e) => setInitialDue(Number(e.target.value))}
              placeholder="৳ 0"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'যোগ হচ্ছে...' : 'গ্রাহক সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. Quick Add Stock Modal
interface QuickAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStoreId: string;
  products: Product[];
  onSuccess: () => void;
}

export const QuickAddStockModal: React.FC<QuickAddStockModalProps> = ({
  isOpen,
  onClose,
  activeStoreId,
  products,
  onSuccess,
}) => {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [supplierName, setSupplierName] = useState('');
  const [receivedQty, setReceivedQty] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && products.length > 0) {
      if (!productId || !products.some((p) => p.id === productId)) {
        setProductId(products[0].id);
        setUnitCost(products[0].buyingPrice || 0);
      }
    }
  }, [isOpen, products, productId]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || receivedQty <= 0) return;
    setSaving(true);
    try {
      const prodName = currentProduct ? currentProduct.nameBn : 'পণ্য';
      const totalCost = unitCost > 0 ? unitCost * receivedQty : (currentProduct?.buyingPrice || 0) * receivedQty;

      await api.createStockArrival({
        storeId: activeStoreId,
        productId,
        productName: prodName,
        supplierName: supplierName || 'মেসার্স গ্লাস সাপ্লায়ার্স',
        receivedQty,
        unitCost: unitCost || currentProduct?.buyingPrice || 0,
        totalCost,
        date: new Date().toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">স্টক যোগ করুন (Add Stock)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">পণ্য নির্বাচন করুন:</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const found = products.find((p) => p.id === e.target.value);
                if (found) setUnitCost(found.buyingPrice);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameBn} (বর্তমান স্টক: {p.stockQty} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">সরবরাহকারী / মহাজনের নাম:</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="যেমন: নাসির গ্লাস ইন্ডাস্ট্রিজ"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">আগত পরিমাণ ({currentProduct?.unit || 'একক'}):</label>
              <input
                type="number"
                min="1"
                value={receivedQty || ''}
                onChange={(e) => setReceivedQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono font-bold text-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">একক ক্রয়মূল্য (৳):</label>
              <input
                type="number"
                min="0"
                value={unitCost || ''}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                placeholder={String(currentProduct?.buyingPrice || 0)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between text-slate-300">
            <span>মোট ক্রয় খরচ:</span>
            <strong className="font-mono text-emerald-400">
              ৳ {fmtNum(receivedQty * (unitCost || currentProduct?.buyingPrice || 0))}
            </strong>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || receivedQty <= 0}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'স্টক যোগ নিশ্চিত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
