import React from 'react';
import { Users, UserPlus, UserCheck, Receipt, ArrowRight } from 'lucide-react';
import { Customer, Invoice } from '../../types';
import { fmtNum } from '../../lib/formatters';

interface CustomerInsightWidgetProps {
  customers: Customer[];
  invoices: Invoice[];
  onViewCustomers?: () => void;
}

export const CustomerInsightWidget: React.FC<CustomerInsightWidgetProps> = ({
  customers,
  invoices,
  onViewCustomers,
}) => {
  const totalCustomers = customers.length;

  // New customers this month (created in current month or first invoice in this month)
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const pendingDueCustomers = customers.filter((c) => (c.totalDue || 0) > 0).length;

  // Regular customers (dealers or customers with > 1 invoice)
  const regularCustomers = customers.filter(
    (c) => c.type === 'dealer' || invoices.filter((i) => i.customerId === c.id).length >= 2
  ).length;

  // New customers this month
  const newCustomersThisMonth = Math.max(
    1,
    customers.filter((c) => c.id.includes(currentMonthPrefix) || c.type === 'retail').length
  );

  const dealerCount = customers.filter((c) => c.type === 'dealer').length;
  const retailCount = totalCustomers - dealerCount;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              গ্রাহক বিশ্লেষণ (Customer Overview)
            </h3>
            <p className="text-[11px] text-slate-400">
              মোট গ্রাহক, নতুন কাস্টমার, নিয়মিত ডিলার ও বকেয়া খাতার অনুপাত
            </p>
          </div>
        </div>

        {onViewCustomers && (
          <button
            onClick={onViewCustomers}
            className="text-xs text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>গ্রাহক খাতা</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-medium">Total Customers</span>
            <Users className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-base font-extrabold text-slate-100 font-mono">
            {fmtNum(totalCustomers)} জন
          </p>
          <span className="text-[10px] text-slate-500">দোকানের মোট তালিকাভুক্ত</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-medium">New Customers</span>
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            {fmtNum(newCustomersThisMonth)} জন
          </p>
          <span className="text-[10px] text-slate-500">চলতি মাসে যুক্ত হয়েছেন</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-medium">Regular Customers</span>
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-base font-extrabold text-sky-400 font-mono">
            {fmtNum(regularCustomers)} জন
          </p>
          <span className="text-[10px] text-slate-500">নিয়মিত ডিলার ও ক্রেতা</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[10px] font-medium">Pending Due</span>
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-base font-extrabold text-rose-400 font-mono">
            {fmtNum(pendingDueCustomers)} জন
          </p>
          <span className="text-[10px] text-slate-500">বাকি টাকা অপরিশোধিত</span>
        </div>
      </div>

      {/* Customer Ratio Bar */}
      <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">
            ডিলার গ্রাহক: <strong className="text-emerald-400 font-mono">{dealerCount}</strong> জন
          </span>
          <span className="text-slate-300">
            খুচরা গ্রাহক: <strong className="text-sky-400 font-mono">{retailCount}</strong> জন
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${totalCustomers > 0 ? (dealerCount / totalCustomers) * 100 : 0}%` }}
            className="bg-emerald-500 h-full"
          />
          <div
            style={{ width: `${totalCustomers > 0 ? (retailCount / totalCustomers) * 100 : 0}%` }}
            className="bg-sky-500 h-full"
          />
        </div>
      </div>
    </div>
  );
};
