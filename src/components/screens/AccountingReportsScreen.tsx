import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Wallet,
  DollarSign,
  PieChart,
  PlusCircle,
  Search,
  Printer,
  Trash2,
  CheckCircle2,
  Receipt,
  Eye,
  FileText,
  X,
  Clock,
  Archive,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Invoice, Expense, Product, Customer, AutoReportSnapshot, Store } from '../../types';
import { api } from '../../lib/api';
import { autoReportService } from '../../lib/autoReportService';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { fmtNum, fmtDate } from '../../lib/formatters';
import { downloadElementAsPDF, printElementDirectly } from '../../lib/pdfHelper';
import { SingleInvoiceModal } from '../common/SingleInvoiceModal';

export const AccountingReportsScreen: React.FC = () => {
  const { activeStoreId, activeStoreName, permissions } = usePermissions();
  const { t } = useLanguage();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  // 12-Hour Auto Report Snapshots State
  const [autoSnapshots, setAutoSnapshots] = useState<AutoReportSnapshot[]>([]);
  const [showAutoSnapshotModal, setShowAutoSnapshotModal] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);


  // Full Financial Report Print Modal
  const [showFullReportModal, setShowFullReportModal] = useState(false);

  // Timeframe selector
  const [timeframe, setTimeframe] = useState<
    'all' | 'today' | 'week' | 'month' | 'last_month' | 'custom'
  >('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Table Filters
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Operating Expense Filters & Modal State
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'all' | Expense['type']>('all');
  const [showExpenseReportModal, setShowExpenseReportModal] = useState(false);

  // Expense Form State
  const [expenseType, setExpenseType] = useState<Expense['type']>('electricity');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expenseDesc, setExpenseDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, exps, prods, custs, stores] = await Promise.all([
        api.getInvoices(activeStoreId),
        api.getExpenses(activeStoreId),
        api.getProducts(activeStoreId),
        api.getCustomers(activeStoreId),
        api.getStores(),
      ]);
      setInvoices(invs);
      setExpenses(exps);
      setProducts(prods);
      setCustomers(custs);
      const curStore = stores.find((s) => s.id === activeStoreId);
      if (curStore) {
        setStoreInfo(curStore);
      }

      // Refresh archived snapshots
      const list = autoReportService.getSnapshots(activeStoreId);
      setAutoSnapshots(list);

      // Check if 12 hours passed and trigger auto backup
      const newSnap = await autoReportService.checkAndRunAutoSnapshot(
        activeStoreId,
        activeStoreName || 'Thai Glass Store'
      );
      if (newSnap) {
        setAutoSnapshots(autoReportService.getSnapshots(activeStoreId));
        setAutoMsg('১২ ঘণ্টা পূর্ণ হওয়ায় স্বয়ংক্রিয় ব্যাকআপ স্ন্যাপশট সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setAutoMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAutoSnapshot = async () => {
    setAutoRunning(true);
    try {
      await autoReportService.generateSnapshot(activeStoreId, activeStoreName || 'Thai Glass Store');
      const list = autoReportService.getSnapshots(activeStoreId);
      setAutoSnapshots(list);
      setAutoMsg('১২-ঘণ্টার রিপো‌র্ট স্ন্যাপশট এখনই সেভ করা হয়েছে!');
      setTimeout(() => setAutoMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setAutoRunning(false);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    if (!window.confirm('এই ব্যাকআপ স্ন্যাপশটটি কি আর্কাইভ থেকে মুছে ফেলতে চান?')) return;
    autoReportService.deleteSnapshot(id);
    setAutoSnapshots(autoReportService.getSnapshots(activeStoreId));
  };


  useEffect(() => {
    loadData();
  }, [activeStoreId]);

  // ESC Key listener to close active PDF / Report modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedInvoice) setSelectedInvoice(null);
        if (showFullReportModal) setShowFullReportModal(false);
        if (showExpenseReportModal) setShowExpenseReportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice, showFullReportModal, showExpenseReportModal]);

  // PDF Download Handler
  const handleDownloadPDF = () => {
    setShowFullReportModal(true);
    setTimeout(() => {
      downloadElementAsPDF('printable-full-financial-report', 'Full_Financial_Report');
    }, 400);
  };

  // Filter invoices and expenses based on selected Timeframe
  const now = new Date();
  const filteredInvoices = invoices.filter((inv) => {
    const d = new Date(inv.createdAt);
    if (timeframe === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (timeframe === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= sevenDaysAgo;
    }
    if (timeframe === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeframe === 'last_month') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    }
    if (timeframe === 'custom' && customStartDate && customEndDate) {
      return d >= new Date(customStartDate) && d <= new Date(customEndDate);
    }
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    if (timeframe === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (timeframe === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= sevenDaysAgo;
    }
    if (timeframe === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Calculate Financial Stat Totals
  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

  // Estimate purchase cost from items sold or stock cost
  const totalPurchaseCost = filteredInvoices.reduce((acc, inv) => {
    return (
      acc +
      inv.items.reduce((itemAcc, it) => {
        const prod = products.find((p) => p.id === it.productId);
        const costRate = prod ? prod.buyingPrice : it.rate * 0.7;
        const qty = it.unit === 'sqft' ? (it.sqft || it.qty) : it.qty;
        return itemAcc + Math.round(costRate * qty);
      }, 0)
    );
  }, 0);

  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = totalRevenue - totalPurchaseCost - totalExpenses;

  // Dynamic 7-Day Trend Aggregation from Invoices & Transactions
  const last7DaysData = React.useMemo(() => {
    const days: {
      dateStr: string;
      label: string;
      fullDate: string;
      totalSales: number;
      count: number;
    }[] = [];
    const baseDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });

      // Match invoices for this day
      const dayInvoices = invoices.filter(
        (inv) => inv.createdAt && inv.createdAt.split('T')[0] === isoDate
      );
      const dayTotal = dayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      days.push({
        dateStr: isoDate,
        label: dayName,
        fullDate: dayNum,
        totalSales: dayTotal,
        count: dayInvoices.length,
      });
    }
    return days;
  }, [invoices]);

  const max7DaySales = Math.max(...last7DaysData.map((d) => d.totalSales), 1);
  const total7DaySales = last7DaysData.reduce((sum, d) => sum + d.totalSales, 0);

  // Dynamic Category Sales Share from Invoices
  const categoryShare = React.useMemo(() => {
    const counts: Record<string, number> = {
      glass: 0,
      thai: 0,
      aluminum: 0,
      accessories: 0,
    };
    let totalCatAmount = 0;

    filteredInvoices.forEach((inv) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          const cat = prod?.category || 'glass';
          const amt = item.total || 0;
          counts[cat] = (counts[cat] || 0) + amt;
          totalCatAmount += amt;
        });
      }
    });

    if (totalCatAmount === 0) {
      return [
        { key: 'glass', name: 'গ্লাস (Glass)', pct: 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
        { key: 'thai', name: 'থাই (Thai Section)', pct: 0, color: 'bg-sky-500', text: 'text-sky-400' },
        { key: 'aluminum', name: 'অ্যালুমিনিয়াম (Aluminum)', pct: 0, color: 'bg-amber-500', text: 'text-amber-400' },
        { key: 'accessories', name: 'এক্সেসরিজ (Accessories)', pct: 0, color: 'bg-rose-500', text: 'text-rose-400' },
      ];
    }

    return [
      { key: 'glass', name: 'গ্লাস (Glass)', pct: Math.round((counts.glass / totalCatAmount) * 100), color: 'bg-emerald-500', text: 'text-emerald-400' },
      { key: 'thai', name: 'থাই (Thai Section)', pct: Math.round((counts.thai / totalCatAmount) * 100), color: 'bg-sky-500', text: 'text-sky-400' },
      { key: 'aluminum', name: 'অ্যালুমিনিয়াম (Aluminum)', pct: Math.round((counts.aluminum / totalCatAmount) * 100), color: 'bg-amber-500', text: 'text-amber-400' },
      { key: 'accessories', name: 'এক্সেসরিজ (Accessories)', pct: Math.round((counts.accessories / totalCatAmount) * 100), color: 'bg-rose-500', text: 'text-rose-400' },
    ];
  }, [filteredInvoices, products]);

  // Add Expense Handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;

    try {
      await api.createExpense({
        storeId: activeStoreId,
        type: expenseType,
        amount: expenseAmount,
        date: expenseDate,
        description: expenseDesc || 'পরিচালন ব্যয়',
      });

      setSuccessMsg('নতুন পরিচালন ব্যয় সফলভাবে যুক্ত হয়েছে!');
      setExpenseAmount(0);
      setExpenseDesc('');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Memo No', 'Date', 'Customer', 'Grand Total', 'Paid', 'Due', 'Status'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNo,
      inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-',
      `"${inv.customerName}"`,
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
      inv.paymentStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${activeStoreId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ইনভয়েসটি মুছে ফেলতে চান?')) return;
    try {
      await api.deleteInvoice(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পরিচালন খরচটি মুছে ফেলতে চান?')) return;
    try {
      await api.deleteExpense(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Expense Category Totals Breakdown
  const electricityTotal = filteredExpenses.filter((e) => e.type === 'electricity').reduce((sum, e) => sum + e.amount, 0);
  const rentTotal = filteredExpenses.filter((e) => e.type === 'rent').reduce((sum, e) => sum + e.amount, 0);
  const salaryTotal = filteredExpenses.filter((e) => e.type === 'salary').reduce((sum, e) => sum + e.amount, 0);
  const transportTotal = filteredExpenses.filter((e) => e.type === 'transport').reduce((sum, e) => sum + e.amount, 0);
  const otherTotal = filteredExpenses.filter((e) => e.type === 'other').reduce((sum, e) => sum + e.amount, 0);

  // Filtered expenses for display table
  const tableExpenses = filteredExpenses.filter((exp) => {
    const matchesCategory = expenseCategoryFilter === 'all' || exp.type === expenseCategoryFilter;
    const matchesQuery =
      exp.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      exp.type.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      exp.amount.toString().includes(expenseSearch) ||
      exp.date.includes(expenseSearch);
    return matchesCategory && matchesQuery;
  });

  const getExpenseTypeBadge = (type: Expense['type']) => {
    switch (type) {
      case 'electricity':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">⚡ বিদ্যুৎ বিল</span>;
      case 'rent':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">🏢 দোকান ভাড়া</span>;
      case 'salary':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">👨‍💼 কর্মচারী বেতন</span>;
      case 'transport':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">🚚 যাতায়াত খরচ</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 border border-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">📦 অন্যান্য খরচ</span>;
    }
  };

  const tableInvoices = filteredInvoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    const matchesQuery =
      inv.invoiceNo.toLowerCase().includes(tableSearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      inv.customerMobile.includes(tableSearch);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{t('accountingTitle')}</h2>
            <p className="text-xs text-slate-400">লাভ-ক্ষতি, বিক্রয় রাজস্ব ও পরিচালন ব্যয়ের বিস্তারিত রিপোর্ট</p>
          </div>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAutoSnapshotModal(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-amber-950/40 relative"
            title="View 12-Hour Auto Saved Financial Report Snapshots"
          >
            <Clock className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>১২-ঘণ্টা অটো সেভ ({autoSnapshots.length})</span>
            {autoSnapshots.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-950 absolute -top-0.5 -right-0.5 animate-ping" />
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-rose-950/40"
            title="Download complete financial summary as PDF"
          >
            <FileText className="w-4 h-4" />
            <span>ডাউনলোড পিডিএফ</span>
          </button>


          <button
            onClick={() => setShowFullReportModal(true)}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-sky-950/40"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট ফুল রিপোর্ট (Print Ledger)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-950/40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('btnExportExcel')}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('btnExportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector Pill Row */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t('timeframeLabel')}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeframe === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('timeAllTime')}
          </button>

          <button
            onClick={() => setTimeframe('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeframe === 'today'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('timeToday')}
          </button>

          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeframe === 'week'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('timeWeek')}
          </button>

          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeframe === 'month'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('timeMonth')}
          </button>

          <button
            onClick={() => setTimeframe('last_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeframe === 'last_month'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t('timeLastMonth')}
          </button>

          <button
            onClick={() => setTimeframe('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              timeframe === 'custom'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('timeCustom')}</span>
          </button>

          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg"
              />
              <span className="text-slate-500">থেকে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('statTotalRevenue')}
          value={`৳ ${fmtNum(totalRevenue)}`}
          subtitle="মোট বিক্রি রাজস্ব"
          icon={TrendingUp}
          variant="emerald"
        />

        <StatCard
          title={t('statPurchaseCost')}
          value={`৳ ${fmtNum(totalPurchaseCost)}`}
          subtitle="পণ্য কেনা খরচ (COGS)"
          icon={Wallet}
          variant="slate"
        />

        <StatCard
          title={t('statOperatingExpenses')}
          value={`৳ ${fmtNum(totalExpenses)}`}
          subtitle="দোকান পরিচালনা খরচ"
          icon={DollarSign}
          variant="amber"
        />

        <StatCard
          title={t('statNetProfit')}
          value={`৳ ${fmtNum(netProfit)}`}
          subtitle="নিট লাভ (Net Income)"
          icon={TrendingUp}
          variant={netProfit >= 0 ? 'emerald' : 'rose'}
          trend={{ value: netProfit >= 0 ? '+লাভ' : '-লোকসান', isUp: netProfit >= 0 }}
        />
      </div>

      {/* Two-Column Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sales Trend Analysis (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{t('chartSalesTrendTitle')}</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                ৭ দিনের মোট: ৳ {fmtNum(total7DaySales)}
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>বিক্রয় ট্রেন্ড লোড হচ্ছে...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Visual Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
                  {last7DaysData.map((day, idx) => {
                    const heightPercent =
                      max7DaySales > 0 && day.totalSales > 0
                        ? Math.max(8, Math.round((day.totalSales / max7DaySales) * 100))
                        : 4;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <span className="text-[10px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100 transition whitespace-nowrap absolute -top-4 pointer-events-none">
                          ৳{fmtNum(day.totalSales)}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          title={`${day.fullDate} (${day.label}): ৳${fmtNum(day.totalSales)} (${day.count} টি মেমো)`}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            day.totalSales > 0
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:brightness-125'
                              : 'bg-slate-800/80'
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {total7DaySales === 0 && (
                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    গত ৭ দিনে কোনো বিক্রয়ের রেকর্ড পাওয়া যায়নি।
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>দৈনিক বিক্রয় অনুপাত</span>
            <span className="font-mono">সর্বোচ্চ দিন: ৳ {fmtNum(max7DaySales > 1 ? max7DaySales : 0)}</span>
          </div>
        </div>

        {/* Right: Category Sales Share (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-sky-400" />
            <span>{t('chartCategoryShareTitle')}</span>
          </h3>

          <div className="space-y-3.5">
            {categoryShare.map((cat) => (
              <div key={cat.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{cat.name}</span>
                  <span className={`font-mono ${cat.text}`}>{cat.pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.pct}%` }}
                    className={`h-full ${cat.color} transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Expense Form Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>{t('addExpenseTitle')}</span>
        </h3>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('expenseType')}
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="electricity">{t('expElectricity')}</option>
              <option value="rent">{t('expRent')}</option>
              <option value="salary">{t('expSalary')}</option>
              <option value="transport">{t('expTransport')}</option>
              <option value="other">{t('expOther')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('expAmount')}
            </label>
            <input
              type="number"
              required
              min={1}
              value={expenseAmount || ''}
              onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
              placeholder="টাকা"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('expDate')}
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('expDescription')}
            </label>
            <input
              type="text"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="বিবরণ..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="sm:col-span-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-amber-950/40"
          >
            {t('btnSaveExpense')}
          </button>
        </form>
      </div>

      {/* Operating Expenses Report & Ledger Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>পরিচালন ব্যয়ের রিপোর্ট ও তালিকা (Operating Expense Ledger)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              দোকান পরিচালনা খরচ, ক্যাটাগরিভিত্তিক হিসাব ও বিবরণী (মোট: ৳{fmtNum(totalExpenses)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowExpenseReportModal(true);
                setTimeout(() => {
                  downloadElementAsPDF('printable-operating-expenses-report', 'Operating_Expenses_Report');
                }, 400);
              }}
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-rose-950/40"
              title="Download Operating Expense Report as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ডাউনলোড রিপোর্ট (PDF)</span>
            </button>

            <button
              onClick={() => setShowExpenseReportModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-950/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট খতিয়ান (Print)</span>
            </button>
          </div>
        </div>

        {/* Expense Category Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-slate-950/70 border border-amber-500/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">⚡ বিদ্যুৎ বিল</span>
            <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">৳ {fmtNum(electricityTotal)}</span>
          </div>
          <div className="bg-slate-950/70 border border-sky-500/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">🏢 দোকান ভাড়া</span>
            <span className="text-xs font-mono font-bold text-sky-400 mt-0.5 block">৳ {fmtNum(rentTotal)}</span>
          </div>
          <div className="bg-slate-950/70 border border-emerald-500/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">👨‍💼 কর্মচারী বেতন</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">৳ {fmtNum(salaryTotal)}</span>
          </div>
          <div className="bg-slate-950/70 border border-purple-500/20 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">🚚 যাতায়াত খরচ</span>
            <span className="text-xs font-mono font-bold text-purple-400 mt-0.5 block">৳ {fmtNum(transportTotal)}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-700 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">📦 অন্যান্য খরচ</span>
            <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block">৳ {fmtNum(otherTotal)}</span>
          </div>
          <div className="bg-slate-950/70 border border-rose-500/30 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block">💰 মোট পরিচালনা খরচ</span>
            <span className="text-xs font-mono font-bold text-rose-400 mt-0.5 block">৳ {fmtNum(totalExpenses)}</span>
          </div>
        </div>

        {/* Search & Category Filter for Expense Table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <select
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl"
            >
              <option value="all">সকল খাতের খরচ (All Expenses)</option>
              <option value="electricity">⚡ বিদ্যুৎ বিল</option>
              <option value="rent">🏢 দোকান ভাড়া</option>
              <option value="salary">👨‍💼 কর্মচারী বেতন</option>
              <option value="transport">🚚 যাতায়াত খরচ</option>
              <option value="other">📦 অন্যান্য খরচ</option>
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              placeholder="খরচ খুঁজুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Expense List Table */}
        {tableExpenses.length === 0 ? (
          <EmptyState title="কোনো পরিচালন খরচ পাওয়া যায়নি" description="উপরে ফর্ম ব্যবহার করে নতুন খরচ যুক্ত করুন।" />
        ) : (
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/60">
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ব্যয়ের খাত</th>
                  <th className="p-3">বিবরণ / নোট</th>
                  <th className="p-3 text-right">পরিমাণ</th>
                  <th className="p-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tableExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-950/40 transition">
                    <td className="p-3 font-mono text-slate-300 text-[11px]">
                      {exp.date ? new Date(exp.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td className="p-3">{getExpenseTypeBadge(exp.type)}</td>
                    <td className="p-3 text-slate-200 font-medium">{exp.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">৳ {fmtNum(exp.amount)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition inline-flex items-center gap-1"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200">{t('salesReportTableTitle')}</h3>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl"
            >
              <option value="all">{t('paymentStatusAll')}</option>
              <option value="paid">{t('paymentStatusPaid')}</option>
              <option value="partial">{t('paymentStatusPartial')}</option>
              <option value="due">{t('paymentStatusDue')}</option>
            </select>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={t('search')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {tableInvoices.length === 0 ? (
          <EmptyState title={t('noInvoicesFound')} description="কোনো বিক্রির রেকর্ড পাওয়া যায়নি।" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/40">
                  <th className="p-3">মেমো নং</th>
                  <th className="p-3">তারিখ ও সময়</th>
                  <th className="p-3">গ্রাহকের বিবরণ</th>
                  <th className="p-3 text-right">মোট বিল</th>
                  <th className="p-3 text-right">পরিশোধিত</th>
                  <th className="p-3 text-right">বাকি</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3 text-center">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tableInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-950/40 transition">
                    <td className="p-3 font-mono font-bold text-emerald-400">{inv.invoiceNo}</td>
                    <td className="p-3 text-amber-300 font-mono text-[11px]">
                      {fmtDate(inv.createdAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-200">{inv.customerName}</p>
                      <p className="text-[10px] text-slate-400">{inv.customerMobile}</p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      ৳ {fmtNum(inv.grandTotal)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">৳ {fmtNum(inv.paidAmount)}</td>
                    <td className="p-3 text-right font-mono text-rose-400">৳ {fmtNum(inv.dueAmount)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {inv.paymentStatus === 'paid'
                          ? 'পরিশোধিত'
                          : inv.paymentStatus === 'partial'
                          ? 'আংশিক বাকি'
                          : 'সম্পূর্ণ বাকি'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-semibold flex items-center gap-1 mx-auto transition"
                        title="মেমোর বিস্তারিত বিবরণ"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>বিস্তারিত</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice & Customer Detail Modal */}
      <SingleInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        activeStoreName={activeStoreName}
        activeStoreId={activeStoreId}
      />

      {/* FULL FINANCIAL LEDGER REPORT PRINT MODAL */}
      {showFullReportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFullReportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 no-print-modal-container">
            {/* Modal Control Bar (hidden when printing) */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  সম্পূর্ণ হিসাব-নিকাশ খতিয়ান (Full Financial Ledger Report)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadElementAsPDF('printable-full-financial-report', 'Full_Financial_Report')}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                  title="Download / Save as PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>
                <button
                  onClick={() => printElementDirectly('printable-full-financial-report', 'Full_Financial_Report')}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন (Print Now)</span>
                </button>
                <button
                  onClick={() => setShowFullReportModal(false)}
                  className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
                  title="Close Modal (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>বন্ধ করুন (Close)</span>
                </button>
              </div>
            </div>

            {/* Report Document Body */}
            <div id="printable-full-financial-report" className="p-8 bg-white text-slate-900 font-sans printable-financial-report space-y-6 text-xs">
              {/* Top Store Header */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">
                  {storeInfo?.name || activeStoreName || 'GLASS HOUSE DHAKA'}
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  {storeInfo?.address ? `ঠিকানা: ${storeInfo.address}` : '12/A, Dhanmondi, Dhaka'} | মোবাইল: {storeInfo?.phone || '01711223344'}
                </p>
                <div className="border-b-2 border-slate-900 pt-2" />
              </div>

              {/* Title Header Box */}
              <div className="border border-slate-900 rounded-lg p-3 text-center space-y-1 bg-slate-900 text-white">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  COMPLETE FINANCIAL LEDGER REPORT (সম্পূর্ণ হিসাব-নিকাশ খতিয়ান)
                </h2>
                <p className="text-xs font-bold text-slate-300">
                  Timeframe / সময়কাল:{' '}
                  {timeframe === 'today'
                    ? 'আজকের হিসাব (Today)'
                    : timeframe === 'week'
                    ? 'গত ৭ দিনের হিসাব (Last 7 Days)'
                    : timeframe === 'month'
                    ? 'চলতি মাসের হিসাব (This Month)'
                    : timeframe === 'last_month'
                    ? 'গত মাসের হিসাব (Last Month)'
                    : timeframe === 'custom'
                    ? `নির্দিষ্ট সময়কালের হিসাব (${customStartDate || '-'} থেকে ${customEndDate || '-'})`
                    : 'সকল সময়ের সামগ্রিক হিসাব (All Time)'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Generated: {new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })} | Invoices Count: {filteredInvoices.length} | Expenses Count: {filteredExpenses.length}
                </p>
              </div>

              {/* Section I. HISAB NIKASH SUMMARY */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                  I. HISAB NIKASH SUMMARY (হিসাব নিকাশ সারসংক্ষেপ)
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center pt-1">
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      TOTAL REVENUE
                    </span>
                    <span className="text-sm font-black text-slate-100 block mt-1 font-mono">
                      ৳{fmtNum(totalRevenue)}
                    </span>
                  </div>

                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      CASH COLLECTED
                    </span>
                    <span className="text-sm font-black text-emerald-400 block mt-1 font-mono">
                      ৳{fmtNum(filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0))}
                    </span>
                  </div>

                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      COST OF GOODS (COGS)
                    </span>
                    <span className="text-sm font-black text-slate-100 block mt-1 font-mono">
                      ৳{fmtNum(totalPurchaseCost)}
                    </span>
                  </div>

                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      OVERHEAD EXPENSES
                    </span>
                    <span className="text-sm font-black text-rose-400 block mt-1 font-mono">
                      ৳{fmtNum(totalExpenses)}
                    </span>
                  </div>

                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                      NET PROFIT
                    </span>
                    <span
                      className={`text-sm font-black block mt-1 font-mono ${
                        netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ৳{fmtNum(netProfit)}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] italic text-slate-600 mt-1">
                  * Net profit is calculated as: Total Revenue (৳{fmtNum(totalRevenue)}) - COGS (৳{fmtNum(totalPurchaseCost)}) - Overhead Expenses (৳{fmtNum(totalExpenses)}).
                </p>
              </div>

              {/* Section II. BOKEYA KHATA SUMMARY */}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    II. BOKEYA KHATA SUMMARY (বকেয়া খাতা খতিয়ান)
                  </h3>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    PENDING DEBTS: {customers.filter((c) => c.totalDue > 0).length} CUSTOMERS
                  </span>
                </div>

                {customers.filter((c) => c.totalDue > 0).length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center italic text-slate-500 font-medium text-[11px]">
                    No outstanding customer dues or active debts recorded!
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-slate-900 text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-bold text-slate-900" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="p-1.5 border-r border-slate-900">Customer Name</th>
                        <th className="p-1.5 border-r border-slate-900">Mobile</th>
                        <th className="p-1.5 border-r border-slate-900">Address</th>
                        <th className="p-1.5 text-right">Total Outstanding Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers
                        .filter((c) => c.totalDue > 0)
                        .map((cust, idx) => (
                          <tr key={idx} className="border-b border-slate-300">
                            <td className="p-1.5 border-r border-slate-300 font-semibold">{cust.name}</td>
                            <td className="p-1.5 border-r border-slate-300 font-mono">{cust.mobile || '-'}</td>
                            <td className="p-1.5 border-r border-slate-300">{cust.address || '-'}</td>
                            <td className="p-1.5 text-right font-bold text-rose-700 font-mono">
                              ৳{fmtNum(cust.totalDue)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section III. CHRONOLOGICAL SALES INVOICE REGISTER */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                  III. CHRONOLOGICAL SALES INVOICE REGISTER (বিক্রয় মেমো খতিয়ান)
                </h3>

                {filteredInvoices.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center italic text-slate-500 font-medium text-[11px]">
                    No sales invoices recorded for this timeframe!
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-slate-900 text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-bold text-slate-900" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="p-1.5 border-r border-slate-900">Invoice ID</th>
                        <th className="p-1.5 border-r border-slate-900">Customer Name</th>
                        <th className="p-1.5 border-r border-slate-900">Date</th>
                        <th className="p-1.5 border-r border-slate-900 text-right">Total Bill</th>
                        <th className="p-1.5 border-r border-slate-900 text-right">Amount Paid</th>
                        <th className="p-1.5 border-r border-slate-900 text-right">Due Amount</th>
                        <th className="p-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold">{inv.invoiceNo}</td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{inv.customerName}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono">
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-US') : '-'}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">
                            ৳{fmtNum(inv.grandTotal)}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono text-emerald-700 font-bold">
                            ৳{fmtNum(inv.paidAmount)}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono text-rose-700 font-bold">
                            ৳{fmtNum(inv.dueAmount)}
                          </td>
                          <td className="p-1.5 text-center font-bold text-[9px] uppercase">
                            {inv.paymentStatus || 'PAID'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section IV. OVERHEAD EXPENSES REGISTRY */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                  IV. OVERHEAD EXPENSES REGISTRY (পরিচালন ও রক্ষণাবেক্ষণ খরচ খতিয়ান)
                </h3>

                {filteredExpenses.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center italic text-slate-500 font-medium text-[11px]">
                    No operating expenses recorded!
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-slate-900 text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-bold text-slate-900" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="p-1.5 border-r border-slate-900">Expense Type</th>
                        <th className="p-1.5 border-r border-slate-900">Description</th>
                        <th className="p-1.5 border-r border-slate-900">Date</th>
                        <th className="p-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-300 font-bold uppercase">{exp.type}</td>
                          <td className="p-1.5 border-r border-slate-300">{exp.description}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono">
                            {exp.date ? new Date(exp.date).toLocaleDateString('en-US') : '-'}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-rose-700">৳{fmtNum(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Report Footer */}
              <div className="pt-4 border-t border-dashed border-slate-400 text-center space-y-0.5">
                <p className="font-bold text-[11px] text-slate-800">Complete Financial Ledger Report</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Confidential Internal Audit Statement
                </p>
              </div>
            </div>

            {/* Bottom Modal Control Bar (no-print) */}
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadElementAsPDF('printable-full-financial-report', 'Full_Financial_Report')}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>
                <button
                  onClick={() => printElementDirectly('printable-full-financial-report', 'Full_Financial_Report')}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন (Print Now)</span>
                </button>
              </div>
              <button
                onClick={() => setShowFullReportModal(false)}
                className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
              >
                <X className="w-4 h-4" />
                <span>বন্ধ করুন (Close)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPERATING EXPENSES REPORT PRINT & PDF MODAL */}
      {showExpenseReportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExpenseReportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 no-print-modal-container">
            {/* Control Bar */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  পরিচালন ব্যয় খতিয়ান রিপোর্ট (Operating Expenses Report)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadElementAsPDF('printable-operating-expenses-report', 'Operating_Expenses_Report')}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                  title="Download PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>
                <button
                  onClick={() => printElementDirectly('printable-operating-expenses-report', 'Operating_Expenses_Report')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন (Print Now)</span>
                </button>
                <button
                  onClick={() => setShowExpenseReportModal(false)}
                  className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
                  title="Close Modal (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>বন্ধ করুন (Close)</span>
                </button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div id="printable-operating-expenses-report" className="p-8 bg-white text-slate-900 font-sans printable-financial-report space-y-6 text-xs">
              {/* Header */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">
                  {storeInfo?.name || activeStoreName || 'GLASS HOUSE DHAKA'}
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  {storeInfo?.address ? `ঠিকানা: ${storeInfo.address}` : '12/A, Dhanmondi, Dhaka'} | মোবাইল: {storeInfo?.phone || '01711223344'}
                </p>
                <div className="border-b-2 border-slate-900 pt-2" />
              </div>

              {/* Title Header */}
              <div className="border border-slate-900 rounded-lg p-3 text-center space-y-1 bg-slate-900 text-white">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  OPERATING EXPENSES REPORT (পরিচালন ও রক্ষণাবেক্ষণ খরচ খতিয়ান)
                </h2>
                <p className="text-xs font-bold text-slate-300">
                  Timeframe / সময়কাল:{' '}
                  {timeframe === 'today'
                    ? 'আজকের হিসাব (Today)'
                    : timeframe === 'week'
                    ? 'গত ৭ দিনের হিসাব (Last 7 Days)'
                    : timeframe === 'month'
                    ? 'চলতি মাসের হিসাব (This Month)'
                    : timeframe === 'last_month'
                    ? 'গত মাসের হিসাব (Last Month)'
                    : timeframe === 'custom'
                    ? `নির্দিষ্ট সময়কালের হিসাব (${customStartDate || '-'} থেকে ${customEndDate || '-'})`
                    : 'সকল সময়ের সামগ্রিক হিসাব (All Time)'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Generated: {new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })} | Total Expenses Count: {filteredExpenses.length}
                </p>
              </div>

              {/* Category Breakdown Summary Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                  I. CATEGORY BREAKDOWN SUMMARY (খাতভিত্তিক খরচের সারসংক্ষেপ)
                </h3>
                <div className="grid grid-cols-6 gap-2 text-center pt-1">
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">⚡ ELECTRICITY</span>
                    <span className="text-xs font-black text-amber-400 block mt-1 font-mono">৳{fmtNum(electricityTotal)}</span>
                  </div>
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">🏢 RENT</span>
                    <span className="text-xs font-black text-sky-400 block mt-1 font-mono">৳{fmtNum(rentTotal)}</span>
                  </div>
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">👨‍💼 SALARY</span>
                    <span className="text-xs font-black text-emerald-400 block mt-1 font-mono">৳{fmtNum(salaryTotal)}</span>
                  </div>
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">🚚 TRANSPORT</span>
                    <span className="text-xs font-black text-purple-400 block mt-1 font-mono">৳{fmtNum(transportTotal)}</span>
                  </div>
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">📦 OTHER</span>
                    <span className="text-xs font-black text-slate-300 block mt-1 font-mono">৳{fmtNum(otherTotal)}</span>
                  </div>
                  <div className="border border-slate-900 rounded-lg p-2 bg-slate-900 text-white">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">💰 TOTAL</span>
                    <span className="text-xs font-black text-rose-400 block mt-1 font-mono">৳{fmtNum(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Expenses Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-slate-900 pb-1 text-slate-900">
                  II. ITEMIZED EXPENSE ENTRIES (বিস্তারিত খরচের তালিকা)
                </h3>

                {filteredExpenses.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center italic text-slate-500 font-medium text-[11px]">
                    No operating expenses recorded for this timeframe!
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-slate-900 text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-900 font-bold text-slate-900" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="p-1.5 border-r border-slate-900">Expense Category</th>
                        <th className="p-1.5 border-r border-slate-900">Description</th>
                        <th className="p-1.5 border-r border-slate-900">Date</th>
                        <th className="p-1.5 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-slate-300">
                          <td className="p-1.5 border-r border-slate-300 font-bold uppercase">
                            {exp.type === 'electricity' ? 'ELECTRICITY (বিদ্যুৎ)' : exp.type === 'rent' ? 'RENT (ভাড়া)' : exp.type === 'salary' ? 'SALARY (বেতন)' : exp.type === 'transport' ? 'TRANSPORT (যাতায়াত)' : 'OTHER (অন্যান্য)'}
                          </td>
                          <td className="p-1.5 border-r border-slate-300">{exp.description}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono">
                            {exp.date ? new Date(exp.date).toLocaleDateString('en-US') : '-'}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-rose-700">
                            ৳{fmtNum(exp.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-dashed border-slate-400 text-center space-y-0.5">
                <p className="font-bold text-[11px] text-slate-800">Operating Expenses Audit Report</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Internal Store Expense Documentation
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadElementAsPDF('printable-operating-expenses-report', 'Operating_Expenses_Report')}
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>ডাউনলোড পিডিএফ (Download PDF)</span>
                </button>
                <button
                  onClick={() => printElementDirectly('printable-operating-expenses-report', 'Operating_Expenses_Report')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন (Print Now)</span>
                </button>
              </div>
              <button
                onClick={() => setShowExpenseReportModal(false)}
                className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
              >
                <X className="w-4 h-4" />
                <span>বন্ধ করুন (Close)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12-Hour Auto Reports Archive Modal */}
      {showAutoSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>১২-ঘণ্টা অটো-ব্যাকআপ রিপোর্ট আর্কাইভ (Auto Report Snapshots)</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ১০০% ফ্রি
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    প্রতি ১২ ঘণ্টা পর পর নতুন মেমো, বিক্রি, খরচ ও লাভের হিসাব স্বয়ংক্রিয়ভাবে সেভ হয়ে থাকে
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualAutoSnapshot}
                  disabled={autoRunning}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoRunning ? 'animate-spin' : ''}`} />
                  <span>এখনই স্ন্যাপশট নিন</span>
                </button>

                <button
                  onClick={() => setShowAutoSnapshotModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification message */}
            {autoMsg && (
              <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{autoMsg}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {autoSnapshots.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-slate-300">এখনো কোনো ১২-ঘণ্টার সেভড স্ন্যাপশট নেই!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      প্রতি ১২ ঘণ্টা পর পর অটোমেটিক সেভ হবে অথবা উপরের кнопка চাপুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualAutoSnapshot}
                    className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>প্রথম স্ন্যাপশট তৈরি করুন</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {autoSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <h4 className="text-xs font-bold text-slate-200">{snap.periodLabel}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({new Date(snap.timestamp).toLocaleTimeString()})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => autoReportService.exportToCSV(snap)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ডাউনলোড Excel/CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Snapshot Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">নতুন মেমো:</span>
                          <span className="font-bold text-slate-200">{snap.newInvoicesCount} টি</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">ক্যাশ কালেকশন:</span>
                          <span className="font-bold text-emerald-400 font-mono">৳{fmtNum(snap.totalRevenue)}</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">মোট খরচ:</span>
                          <span className="font-bold text-rose-400 font-mono">৳{fmtNum(snap.totalExpenses)}</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 block">নিট আনুমানিক লাভ:</span>
                          <span className="font-bold text-amber-300 font-mono">৳{fmtNum(snap.netProfit)}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded-lg border border-slate-900">
                        📌 {snap.summaryText}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                মোট সেভকৃত স্ন্যাপশট: {autoSnapshots.length} টি
              </span>
              <button
                type="button"
                onClick={() => setShowAutoSnapshotModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

