import React from 'react';
import {
  PlusCircle,
  HandCoins,
  PackagePlus,
  ReceiptText,
  UserPlus,
  Sliders,
  Calendar,
  Users,
} from 'lucide-react';
import { fmtDate } from '../../lib/formatters';

interface DashboardHeaderProps {
  activeStoreName?: string;
  activeStaffCount: number;
  onNewInvoice: () => void;
  onReceiveDue: () => void;
  onAddStock: () => void;
  onAddExpense: () => void;
  onAddCustomer: () => void;
  onOpenSettings: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeStaffCount,
  onNewInvoice,
  onReceiveDue,
  onAddStock,
  onAddExpense,
  onAddCustomer,
  onOpenSettings,
}) => {
  const todayFormatted = fmtDate(new Date().toISOString(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Top Row: Info & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              ব্যবসায়িক ইন্টেলিজেন্স ড্যাশবোর্ড
            </h1>
            {/* Shop Status: Open */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>দোকান খোলা (Open)</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            দৈনিক বিক্রয়, ক্যাশ ফ্লো, গ্রাহক বাকি, ইনভেন্টরি অবস্থা ও ব্যবসায়িক ইনসাইট
          </p>
        </div>

        {/* Date & Staff Counters */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">ব্যবসায়িক তারিখ (Business Date)</p>
              <p className="font-semibold text-slate-200">{todayFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-slate-300">
            <Users className="w-4 h-4 text-sky-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">আজকের স্টাফ (Active Staff)</p>
              <p className="font-semibold text-sky-300">
                {activeStaffCount > 0 ? `${activeStaffCount.toLocaleString('bn-BD')} জন সক্রিয়` : '০ জন সক্রিয়'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            title="ড্যাশবোর্ড সাজান (Dashboard Settings)"
            className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition shadow-sm"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNewInvoice}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-950/40"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Invoice (নতুন মেমো)</span>
          </button>

          <button
            onClick={onReceiveDue}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <HandCoins className="w-4 h-4 text-rose-400" />
            <span>+ Receive Due (বকেয়া আদায়)</span>
          </button>

          <button
            onClick={onAddStock}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <PackagePlus className="w-4 h-4 text-amber-400" />
            <span>+ Add Stock (স্টক যোগ)</span>
          </button>

          <button
            onClick={onAddExpense}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <ReceiptText className="w-4 h-4 text-sky-400" />
            <span>+ Add Expense (খরচ যোগ)</span>
          </button>

          <button
            onClick={onAddCustomer}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition"
          >
            <UserPlus className="w-4 h-4 text-teal-400" />
            <span>+ Add Customer (নতুন কাস্টমার)</span>
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-medium px-2 py-1 rounded-lg hover:bg-slate-800/60 transition ml-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>ড্যাশবোর্ড সাজান (Settings)</span>
        </button>
      </div>
    </div>
  );
};
