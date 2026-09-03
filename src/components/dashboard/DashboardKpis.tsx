import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  User,
} from 'lucide-react';
import { fmtNum } from '../../lib/formatters';

interface DashboardKpisProps {
  todaySales: number;
  salesGrowthVsYesterday: number;
  todayInvoiceCount: number;
  avgSaleAmount: number;
  salesPaidToday: number;
  dueCollectionToday: number;
  totalAvailableCash: number;
  totalOutstandingDue: number;
  dueCustomerCount: number;
  highestDueCustomer: { name: string; due: number } | null;
  grossProfitToday: number;
  profitMarginToday: number;
  productCostToday: number;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  todaySales,
  salesGrowthVsYesterday,
  todayInvoiceCount,
  avgSaleAmount,
  salesPaidToday,
  dueCollectionToday,
  totalAvailableCash,
  totalOutstandingDue,
  dueCustomerCount,
  highestDueCustomer,
  grossProfitToday,
  profitMarginToday,
  productCostToday,
}) => {
  const isGrowthPositive = salesGrowthVsYesterday >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
      {/* Card 1: TODAY'S SALES */}
      <div className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/30 rounded-2xl p-5 shadow-lg shadow-slate-950/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              TODAY'S SALES (আজকের বিক্রি)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              ৳ {fmtNum(todaySales)}
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 border ${
                isGrowthPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}
            >
              {isGrowthPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(salesGrowthVsYesterday)}% vs গতকাল</span>
            </span>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] text-slate-500">মোট মেমো (Invoices)</p>
            <p className="font-bold text-slate-300 font-mono">{fmtNum(todayInvoiceCount)} টি</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">গড় বিক্রয় (Average)</p>
            <p className="font-bold text-emerald-400 font-mono">৳ {fmtNum(avgSaleAmount)}</p>
          </div>
        </div>
      </div>

      {/* Card 2: CASH POSITION */}
      <div className="bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/30 rounded-2xl p-5 shadow-lg shadow-slate-950/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              CASH POSITION (ক্যাশ অবস্থান)
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-sky-300 font-mono tracking-tight">
              ৳ {fmtNum(totalAvailableCash)}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/80">
              মোট নগদ জমা
            </span>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] text-slate-500">বিক্রি জমা (Cash Received)</p>
            <p className="font-bold text-slate-300 font-mono">৳ {fmtNum(salesPaidToday)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">বকেয়া আদায় (Due Collection)</p>
            <p className="font-bold text-sky-400 font-mono">৳ {fmtNum(dueCollectionToday)}</p>
          </div>
        </div>
      </div>

      {/* Card 3: CUSTOMER DUE */}
      <div className="bg-slate-900/90 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-5 shadow-lg shadow-slate-950/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              CUSTOMER DUE (গ্রাহক বাকি)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-rose-400 font-mono tracking-tight">
              ৳ {fmtNum(totalOutstandingDue)}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25">
              {fmtNum(dueCustomerCount)} জন বাকিদার
            </span>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/80 text-xs">
          <p className="text-[10px] text-slate-500">সর্বোচ্চ বাকিদার (Highest Due Customer)</p>
          <p className="font-bold text-slate-200 truncate flex items-center gap-1.5 mt-0.5">
            <User className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">{highestDueCustomer ? highestDueCustomer.name : 'কোনো বাকিদার নেই'}</span>
            {highestDueCustomer && (
              <span className="text-rose-400 font-mono shrink-0 font-bold">
                (৳{fmtNum(highestDueCustomer.due)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Card 4: PROFIT TODAY */}
      <div className="bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-slate-950/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PROFIT TODAY (আজকের মুনাফা)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-amber-300 font-mono tracking-tight">
              ৳ {fmtNum(grossProfitToday)}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
              মার্জিন: {profitMarginToday}%
            </span>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] text-slate-500">পণ্যের ক্রয়মূল্য (COGS)</p>
            <p className="font-bold text-slate-300 font-mono">৳ {fmtNum(productCostToday)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">গ্রস মার্জিন অনুপাত</p>
            <p className="font-bold text-amber-400 font-mono">{profitMarginToday > 0 ? `${profitMarginToday}% লাভ` : '০%'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
