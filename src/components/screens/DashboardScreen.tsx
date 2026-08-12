import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Wallet,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  Package,
  TrendingUp,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { fmtNum, fmtDate } from '../../lib/formatters';
import { ScreenId, Invoice, Product } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { activeStoreId } = usePermissions();
  const { t } = useLanguage();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [invs, prods] = await Promise.all([
          api.getInvoices(activeStoreId),
          api.getProducts(activeStoreId),
        ]);
        setInvoices(invs);
        setProducts(prods);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeStoreId]);

  // Calculations for Today's Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(
    (inv) => inv.createdAt && inv.createdAt.split('T')[0] === todayStr
  );

  const todaySales = todayInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const todayCash = todayInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const todayDue = todayInvoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

  const lowStockItems = products.filter((p) => p.stockQty <= p.lowStockThreshold);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{t('navDashboard')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            দোকানের আজকের বিক্রি, নগদ জমা, বকেয়া ও স্টকের সামগ্রিক অবস্থা
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('billing')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-950/40"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('btnNewInvoice')}</span>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>{t('btnCheckStock')}</span>
          </button>

          <button
            onClick={() => onNavigate('accounting')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>{t('btnViewReports')}</span>
          </button>
        </div>
      </div>

      {/* Top Row: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashTodaySales')}
          value={`৳ ${fmtNum(todaySales)}`}
          subtitle="আজকের মোট মেমো বিক্রয়"
          icon={TrendingUp}
          variant="emerald"
          trend={{ value: '+১২%', isUp: true }}
        />

        <StatCard
          title={t('dashTodayCash')}
          value={`৳ ${fmtNum(todayCash)}`}
          subtitle="আজকে ক্যাশে প্রাপ্ত অর্থ"
          icon={Wallet}
          variant="sky"
        />

        <StatCard
          title={t('dashTodayDue')}
          value={`৳ ${fmtNum(todayDue)}`}
          subtitle="আজকের বাকি পাওনা"
          icon={Receipt}
          variant="rose"
        />

        <StatCard
          title={t('dashStockAlerts')}
          value={`${lowStockItems.length} টি পণ্য`}
          subtitle="কম স্টকের আইটেম সংখ্যা"
          icon={AlertTriangle}
          variant="amber"
        />
      </div>

      {/* Two-Column Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">{t('recentSales')}</h3>
            </div>
            <button
              onClick={() => onNavigate('accounting')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{t('viewAllInvoices')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              title={t('noRecentSales')}
              description="নতুন ক্যাশ মেমো বা বিল তৈরি করতে উপরের 'নতুন মেমো তৈরি' বাটনে ক্লিক করুন।"
              actionButton={
                <button
                  onClick={() => onNavigate('billing')}
                  className="bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg"
                >
                  {t('btnNewInvoice')}
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {inv.invoiceNo}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {inv.customerType === 'dealer' ? 'ডিলার' : 'খুচরা'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 mt-1">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400">{fmtDate(inv.createdAt)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">৳ {fmtNum(inv.grandTotal)}</p>
                    {inv.dueAmount > 0 ? (
                      <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                        বাকি: ৳ {fmtNum(inv.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        পরিশোধিত
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">{t('dashStockAlerts')}</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{t('viewInventory')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <EmptyState
              title={t('noStockAlerts')}
              description="দোকানের সকল পণ্যের পর্যাপ্ত স্টক মজুদ রয়েছে।"
            />
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 hover:border-amber-500/40 transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{prod.nameBn}</h4>
                    <p className="text-[11px] text-slate-400">{prod.nameEn}</p>
                    <span className="text-[10px] text-amber-400 font-medium">
                      লিমিট: {prod.lowStockThreshold} {prod.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      {prod.stockQty} {prod.unit} বাকি
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
