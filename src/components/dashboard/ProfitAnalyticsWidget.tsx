import React, { useState, useMemo } from 'react';
import { DollarSign, Minus, Equal, ArrowRight, PieChart } from 'lucide-react';
import { Invoice, Product, Expense } from '../../types';
import { fmtNum } from '../../lib/formatters';

interface ProfitAnalyticsWidgetProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  onViewAccounting?: () => void;
}

type Period = 'today' | 'week' | 'month';

export const ProfitAnalyticsWidget: React.FC<ProfitAnalyticsWidgetProps> = ({
  invoices,
  products,
  expenses,
  onViewAccounting,
}) => {
  const [period, setPeriod] = useState<Period>('today');

  // Map product buying prices for fast lookup
  const productPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = p.buyingPrice || 0;
    });
    return map;
  }, [products]);

  // Filter items by period
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // compute cutoff for week / month
    let cutoff = new Date(now);
    if (period === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      // month
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredInvoices = invoices.filter((inv) => {
      if (!inv.createdAt) return false;
      const invDate = new Date(inv.createdAt);
      return invDate >= cutoff;
    });

    const filteredExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date || exp.createdAt);
      return expDate >= cutoff;
    });

    // 1. Sales Revenue
    const revenue = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // 2. Product Cost (COGS)
    let productCost = 0;
    filteredInvoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const cost = productPriceMap[item.productId] || 0;
          const qty = item.sqft || item.qty || 1;
          productCost += cost * qty;
        });
      }
    });

    // Fallback if productCost is 0 but revenue > 0 (estimate average 70% COGS for glass/thai)
    if (productCost === 0 && revenue > 0) {
      productCost = Math.round(revenue * 0.72);
    }

    // 3. Operating Expenses
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 4. Net Profit
    const netProfit = revenue - productCost - totalExpenses;
    const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

    return {
      revenue,
      productCost,
      totalExpenses,
      netProfit,
      margin,
    };
  }, [invoices, expenses, period, productPriceMap]);

  const isProfitable = stats.netProfit >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              মুনাফা ওভারভিউ (Profit Overview)
            </h3>
            <p className="text-[11px] text-slate-400">
              বিক্রয় আয় - পণ্যের ক্রয়মূল্য - পরিচালন খরচ = নিট মুনাফা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setPeriod('today')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              period === 'today'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today (আজকে)
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              period === 'week'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Week (সপ্তাহ)
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              period === 'month'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month (চলতি মাস)
          </button>
        </div>
      </div>

      {/* Formula Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
        {/* Sales Revenue */}
        <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Sales Revenue (বিক্রয়)</p>
          <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
            ৳ {fmtNum(stats.revenue)}
          </p>
        </div>

        {/* Minus Sign */}
        <div className="md:col-span-1 flex justify-center text-slate-500">
          <Minus className="w-4 h-4" />
        </div>

        {/* Product Cost */}
        <div className="md:col-span-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Product Cost</p>
          <p className="text-sm font-extrabold text-slate-300 font-mono mt-0.5">
            ৳ {fmtNum(stats.productCost)}
          </p>
        </div>

        {/* Minus Sign */}
        <div className="md:col-span-1 flex justify-center text-slate-500">
          <Minus className="w-4 h-4" />
        </div>

        {/* Expenses */}
        <div className="md:col-span-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Expenses</p>
          <p className="text-sm font-extrabold text-rose-400 font-mono mt-0.5">
            ৳ {fmtNum(stats.totalExpenses)}
          </p>
        </div>

        {/* Equal Sign */}
        <div className="md:col-span-1 flex justify-center text-slate-500">
          <Equal className="w-4 h-4" />
        </div>
      </div>

      {/* Net Profit Summary Card */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
          isProfitable
            ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-500/30'
        }`}
      >
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            NET PROFIT (নিট মুনাফা স্থিতি)
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h4
              className={`text-xl font-black font-mono ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProfitable ? '+' : ''}৳ {fmtNum(stats.netProfit)}
            </h4>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                isProfitable
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              মুনাফা মার্জিন: {stats.margin}%
            </span>
          </div>
        </div>

        {onViewAccounting && (
          <button
            onClick={onViewAccounting}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition shrink-0"
          >
            <span>বিস্তারিত লেজার</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
