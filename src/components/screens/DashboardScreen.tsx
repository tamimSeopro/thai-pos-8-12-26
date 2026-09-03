import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarCheck,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { ScreenId, Invoice, Product, Transaction, Customer, Expense, StockArrival } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { SingleInvoiceModal } from '../common/SingleInvoiceModal';
import { getTodayAttendanceSummary, formatMinutesToBangla } from '../../lib/attendanceService';

// Dashboard Sub-components
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { DashboardKpis } from '../dashboard/DashboardKpis';
import { SalesAnalyticsWidget } from '../dashboard/SalesAnalyticsWidget';
import { CashFlowWidget } from '../dashboard/CashFlowWidget';
import { TopDueCustomersWidget } from '../dashboard/TopDueCustomersWidget';
import { InventoryIntelligenceWidget } from '../dashboard/InventoryIntelligenceWidget';
import { RecentActivityWidget } from '../dashboard/RecentActivityWidget';
import { ProfitAnalyticsWidget } from '../dashboard/ProfitAnalyticsWidget';
import { CustomerInsightWidget } from '../dashboard/CustomerInsightWidget';
import { SupplierSummaryWidget } from '../dashboard/SupplierSummaryWidget';
import { AiInsightPanel } from '../dashboard/AiInsightPanel';
import {
  DashboardSettingsModal,
  DEFAULT_WIDGET_CONFIGS,
  WidgetConfig,
} from '../dashboard/DashboardSettingsModal';
import {
  QuickCollectDueModal,
  QuickAddExpenseModal,
  QuickAddCustomerModal,
  QuickAddStockModal,
} from '../dashboard/QuickActionModals';

const DASHBOARD_CONFIG_KEY = 'thai_pos_dashboard_config_v2';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { activeStoreId, activeStoreName, isStoreAdmin, isSuperAdmin } = usePermissions();
  const { t } = useLanguage();

  // Core Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockArrivals, setStockArrivals] = useState<StockArrival[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState(getTodayAttendanceSummary(activeStoreId));
  const [loading, setLoading] = useState(true);

  // Modals & UI States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [preSelectedDueCustomer, setPreSelectedDueCustomer] = useState<Customer | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Widget custom layout preferences
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WIDGET_CONFIGS;
  });

  const handleSaveWidgetConfig = (updated: WidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetWidgetConfig = () => {
    setWidgets(DEFAULT_WIDGET_CONFIGS);
    try {
      localStorage.removeItem(DASHBOARD_CONFIG_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Load all primary business entities from database
  const loadData = async () => {
    try {
      const [invs, prods, txs, custs, exps, arrivals] = await Promise.all([
        api.getInvoices(activeStoreId),
        api.getProducts(activeStoreId),
        api.getTransactions(activeStoreId),
        api.getCustomers(activeStoreId),
        api.getExpenses(activeStoreId),
        api.getStockArrivals(activeStoreId),
      ]);
      setInvoices(invs);
      setProducts(prods);
      setTransactions(txs);
      setCustomers(custs);
      setExpenses(exps);
      setStockArrivals(arrivals);
      setAttendanceSummary(getTodayAttendanceSummary(activeStoreId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [activeStoreId]);

  // Date Strings & robust date matching
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yr = y.getFullYear();
    const m = String(y.getMonth() + 1).padStart(2, '0');
    const day = String(y.getDate()).padStart(2, '0');
    return `${yr}-${m}-${day}`;
  }, []);

  const isDateMatch = (dateVal?: string, targetDayStr?: string) => {
    if (!dateVal || !targetDayStr) return false;
    if (dateVal.startsWith(targetDayStr)) return true;
    try {
      const d = new Date(dateVal);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}` === targetDayStr;
    } catch {
      return false;
    }
  };

  // 1. Sales Calculations
  const todayInvoices = useMemo(
    () => invoices.filter((i) => isDateMatch(i.createdAt, todayStr)),
    [invoices, todayStr]
  );
  const yesterdayInvoices = useMemo(
    () => invoices.filter((i) => isDateMatch(i.createdAt, yesterdayStr)),
    [invoices, yesterdayStr]
  );

  const todaySales = useMemo(
    () => todayInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0),
    [todayInvoices]
  );
  const yesterdaySales = useMemo(
    () => yesterdayInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0),
    [yesterdayInvoices]
  );

  const salesGrowthVsYesterday = useMemo(() => {
    if (yesterdaySales === 0) return todaySales > 0 ? 100 : 0;
    return Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
  }, [todaySales, yesterdaySales]);

  const todayInvoiceCount = todayInvoices.length;
  const avgSaleAmount = todayInvoiceCount > 0 ? Math.round(todaySales / todayInvoiceCount) : 0;

  // 2. Cash Position Calculations
  const salesPaidToday = useMemo(
    () => todayInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0),
    [todayInvoices]
  );

  const todayTransactions = useMemo(
    () => transactions.filter((t) => isDateMatch(t.date, todayStr)),
    [transactions, todayStr]
  );

  const dueCollectionToday = useMemo(
    () =>
      todayTransactions
        .filter((t) => t.type === 'due_collection')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
    [todayTransactions]
  );

  const advancePaymentToday = useMemo(
    () =>
      todayTransactions
        .filter((t) => t.type === 'payment' && (t.note || '').includes('অগ্রিম'))
        .reduce((sum, t) => sum + (t.amount || 0), 0),
    [todayTransactions]
  );

  const totalAvailableCash = salesPaidToday + dueCollectionToday + advancePaymentToday;

  // 3. Customer Due Calculations
  const totalOutstandingDue = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalDue || 0), 0),
    [customers]
  );
  const dueCustomersList = useMemo(
    () => customers.filter((c) => (c.totalDue || 0) > 0),
    [customers]
  );
  const highestDueCustomer = useMemo(() => {
    if (dueCustomersList.length === 0) return null;
    const sorted = [...dueCustomersList].sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));
    return { name: sorted[0].name, due: sorted[0].totalDue };
  }, [dueCustomersList]);

  // 4. Profit & Cost of Goods Calculations
  const productPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = p.buyingPrice || 0;
    });
    return map;
  }, [products]);

  const productCostToday = useMemo(() => {
    let cost = 0;
    todayInvoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const unitCost = productPriceMap[item.productId] || 0;
          const qty = item.sqft || item.qty || 1;
          cost += unitCost * qty;
        });
      }
    });
    if (cost === 0 && todaySales > 0) {
      cost = Math.round(todaySales * 0.72);
    }
    return cost;
  }, [todayInvoices, productPriceMap, todaySales]);

  const grossProfitToday = Math.max(0, todaySales - productCostToday);
  const profitMarginToday = todaySales > 0 ? Math.round((grossProfitToday / todaySales) * 100) : 0;

  // 5. Cash Flow Breakdown (Today)
  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isDateMatch(e.date || e.createdAt, todayStr))
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses, todayStr]
  );

  const todayPurchases = useMemo(
    () =>
      stockArrivals
        .filter((a) => isDateMatch(a.date, todayStr))
        .reduce((sum, a) => sum + (a.totalCost || 0), 0),
    [stockArrivals, todayStr]
  );

  const todaySupplierPayments = useMemo(
    () =>
      todayTransactions
        .filter((t) => t.type === 'purchase')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
    [todayTransactions]
  );

  const netCashBalance =
    totalAvailableCash - (todayPurchases + todayExpenses + todaySupplierPayments);

  // Dynamic Widget Renderer respecting user-configured ordering
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'ai_insights':
        return (
          <div key="ai_insights" className="col-span-1 lg:col-span-2">
            <AiInsightPanel
              invoices={invoices}
              products={products}
              customers={customers}
              todaySales={todaySales}
              yesterdaySales={yesterdaySales}
              netCashBalance={netCashBalance}
              highestDueCustomer={highestDueCustomer}
            />
          </div>
        );

      case 'kpi_cards':
        return (
          <div key="kpi_cards" className="col-span-1 lg:col-span-2">
            <DashboardKpis
              todaySales={todaySales}
              salesGrowthVsYesterday={salesGrowthVsYesterday}
              todayInvoiceCount={todayInvoiceCount}
              avgSaleAmount={avgSaleAmount}
              salesPaidToday={salesPaidToday}
              dueCollectionToday={dueCollectionToday}
              totalAvailableCash={totalAvailableCash}
              totalOutstandingDue={totalOutstandingDue}
              dueCustomerCount={dueCustomersList.length}
              highestDueCustomer={highestDueCustomer}
              grossProfitToday={grossProfitToday}
              profitMarginToday={profitMarginToday}
              productCostToday={productCostToday}
            />
          </div>
        );

      case 'sales_trend':
        return (
          <div key="sales_trend" className="col-span-1">
            <SalesAnalyticsWidget invoices={invoices} />
          </div>
        );

      case 'cash_flow':
        return (
          <div key="cash_flow" className="col-span-1">
            <CashFlowWidget
              salesPaymentIn={salesPaidToday}
              dueCollectionIn={dueCollectionToday}
              advancePaymentIn={advancePaymentToday}
              purchaseOut={todayPurchases}
              expenseOut={todayExpenses}
              supplierPaymentOut={todaySupplierPayments}
            />
          </div>
        );

      case 'profit_overview':
        return (
          <div key="profit_overview" className="col-span-1 lg:col-span-2">
            <ProfitAnalyticsWidget
              invoices={invoices}
              products={products}
              expenses={expenses}
              onViewAccounting={() => onNavigate('accounting')}
            />
          </div>
        );

      case 'due_customers':
        return (
          <div key="due_customers" className="col-span-1">
            <TopDueCustomersWidget
              customers={customers}
              transactions={transactions}
              onCollectDue={(cust) => {
                setPreSelectedDueCustomer(cust);
                setShowDueModal(true);
              }}
              onViewAllDues={() => onNavigate('due_ledger')}
            />
          </div>
        );

      case 'inventory':
        return (
          <div key="inventory" className="col-span-1">
            <InventoryIntelligenceWidget
              products={products}
              onViewInventory={() => onNavigate('inventory')}
              onAddStock={() => setShowStockModal(true)}
            />
          </div>
        );

      case 'customer_insight':
        return (
          <div key="customer_insight" className="col-span-1">
            <CustomerInsightWidget
              customers={customers}
              invoices={invoices}
              onViewCustomers={() => onNavigate('due_ledger')}
            />
          </div>
        );

      case 'supplier':
        return (
          <div key="supplier" className="col-span-1">
            <SupplierSummaryWidget
              stockArrivals={stockArrivals}
              transactions={transactions}
              onViewInventory={() => onNavigate('inventory')}
            />
          </div>
        );

      case 'recent_activity':
        return (
          <div key="recent_activity" className="col-span-1 lg:col-span-2">
            <RecentActivityWidget
              invoices={invoices}
              transactions={transactions}
              stockArrivals={stockArrivals}
              expenses={expenses}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onViewAllInvoices={() => onNavigate('accounting')}
            />
          </div>
        );

      case 'staff_attendance':
        if (!isStoreAdmin && !isSuperAdmin) return null;
        return (
          <div key="staff_attendance" className="col-span-1 lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      আজকের স্টাফ উপস্থিতি ও লাইভ সেশন (Staff Attendance)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      দোকানে বিক্রয়কর্মীদের লগইন, লগআউট ও সক্রিয় উপস্থিতি ট্র্যাকার
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{attendanceSummary.activeCount.toLocaleString('bn-BD')} জন কর্মরত</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-medium">
                      {attendanceSummary.presentCount.toLocaleString('bn-BD')} জন উপস্থিত
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('staff_permissions')}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>উপস্থিতি খাতা</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {attendanceSummary.todayLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">
                  আজ এখনও কোনো স্টাফ লগইন করেননি। স্টাফ লগইন করলে এখানে তাদের উপস্থিতি ও সময় দৃশ্যমান হবে।
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attendanceSummary.todayLogs.slice(0, 6).map((log) => {
                    const isActive = log.status === 'active';
                    const duration = isActive
                      ? Math.max(1, Math.round((Date.now() - new Date(log.loginTime).getTime()) / 60000))
                      : log.durationMinutes;

                    const loginTimeFormatted = new Date(log.loginTime).toLocaleTimeString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isActive
                            ? 'bg-slate-950/80 border-emerald-500/30'
                            : 'bg-slate-950/40 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                            {log.userName ? log.userName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-200">{log.userName}</p>
                              {isActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>লগইন: {loginTimeFormatted}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isActive ? 'কর্মরত' : 'লগআউট'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            {formatMinutesToBangla(duration)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">ব্যবসায়িক ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Smart Dashboard Header */}
      <DashboardHeader
        activeStaffCount={attendanceSummary.activeCount}
        onNewInvoice={() => onNavigate('billing')}
        onReceiveDue={() => {
          setPreSelectedDueCustomer(null);
          setShowDueModal(true);
        }}
        onAddStock={() => setShowStockModal(true)}
        onAddExpense={() => setShowExpenseModal(true)}
        onAddCustomer={() => setShowCustomerModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* 2. Dynamic Modular Widgets (Ordered & Filtered by User Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {widgets
          .filter((w) => w.visible)
          .map((w) => renderWidget(w.id))}
      </div>

      {/* Modals */}
      <DashboardSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        widgets={widgets}
        onSave={handleSaveWidgetConfig}
        onReset={handleResetWidgetConfig}
      />

      <QuickCollectDueModal
        isOpen={showDueModal}
        onClose={() => {
          setShowDueModal(false);
          setPreSelectedDueCustomer(null);
        }}
        activeStoreId={activeStoreId}
        customers={customers}
        preSelectedCustomer={preSelectedDueCustomer}
        onSuccess={loadData}
      />

      <QuickAddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        activeStoreId={activeStoreId}
        onSuccess={loadData}
      />

      <QuickAddCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        activeStoreId={activeStoreId}
        onSuccess={loadData}
      />

      <QuickAddStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        activeStoreId={activeStoreId}
        products={products}
        onSuccess={loadData}
      />

      <SingleInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        activeStoreName={activeStoreName}
        activeStoreId={activeStoreId}
      />
    </div>
  );
};
