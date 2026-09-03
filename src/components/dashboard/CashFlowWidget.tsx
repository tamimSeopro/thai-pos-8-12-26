import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { fmtNum } from '../../lib/formatters';

interface CashFlowWidgetProps {
  salesPaymentIn: number;
  dueCollectionIn: number;
  advancePaymentIn: number;
  purchaseOut: number;
  expenseOut: number;
  supplierPaymentOut: number;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({
  salesPaymentIn,
  dueCollectionIn,
  advancePaymentIn,
  purchaseOut,
  expenseOut,
  supplierPaymentOut,
}) => {
  const totalMoneyIn = salesPaymentIn + dueCollectionIn + advancePaymentIn;
  const totalMoneyOut = purchaseOut + expenseOut + supplierPaymentOut;
  const netCashBalance = totalMoneyIn - totalMoneyOut;
  const isNetPositive = netCashBalance >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                আজকের ক্যাশ ফ্লো (Today's Cash Flow)
              </h3>
              <p className="text-[11px] text-slate-400">
                দৈনিক নগদ জমা, পরিচালন খরচ ও নিট নগদ অবস্থান
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
              isNetPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}
          >
            {isNetPositive ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>{isNetPositive ? 'ইতিবাচক উদ্বৃত্ত' : 'ক্যাশ ঘাটতি'}</span>
          </span>
        </div>

        {/* Two Columns: Money In & Money Out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Money In */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4" />
                <span>টাকা জমা (Money In)</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                + ৳ {fmtNum(totalMoneyIn)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">বিক্রয় প্রাপ্তি (Sales Payment):</span>
                <span className="font-mono font-medium">৳ {fmtNum(salesPaymentIn)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">বকেয়া আদায় (Due Collection):</span>
                <span className="font-mono font-medium text-emerald-400">৳ {fmtNum(dueCollectionIn)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">অগ্রিম জমা (Advance Payment):</span>
                <span className="font-mono font-medium">৳ {fmtNum(advancePaymentIn)}</span>
              </div>
            </div>
          </div>

          {/* Money Out */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>টাকা খরচ (Money Out)</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">
                - ৳ {fmtNum(totalMoneyOut)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">মালামাল ক্রয় (Purchase):</span>
                <span className="font-mono font-medium">৳ {fmtNum(purchaseOut)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">পরিচালন ব্যয় (Expense):</span>
                <span className="font-mono font-medium text-rose-400">৳ {fmtNum(expenseOut)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">মহাজন পরিশোধ (Supplier Payment):</span>
                <span className="font-mono font-medium">৳ {fmtNum(supplierPaymentOut)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Net Cash Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between ${
          isNetPositive
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}
      >
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            NET CASH BALANCE (আজকের নিট ক্যাশ উদ্বৃত্ত)
          </p>
          <p className="text-xs text-slate-300 mt-0.5">মোট নগদ জমা ও খরচের অবশিষ্ট স্থিতি</p>
        </div>
        <div className="text-right">
          <p
            className={`text-lg font-extrabold font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}৳ {fmtNum(netCashBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};
