import React, { useState, useMemo } from 'react';
import {
  Activity,
  Receipt,
  HandCoins,
  PackagePlus,
  ReceiptText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Invoice, Transaction, StockArrival, Expense } from '../../types';
import { fmtNum, fmtDate } from '../../lib/formatters';

interface ActivityItem {
  id: string;
  type: 'invoice' | 'due' | 'stock' | 'expense';
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  badgeColor: string;
}

interface RecentActivityWidgetProps {
  invoices: Invoice[];
  transactions: Transaction[];
  stockArrivals: StockArrival[];
  expenses: Expense[];
  onSelectInvoice?: (inv: Invoice) => void;
  onViewAllInvoices?: () => void;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  invoices,
  transactions,
  stockArrivals,
  expenses,
  onSelectInvoice,
  onViewAllInvoices,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Build unified chronological timeline
  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    // Invoices
    invoices.forEach((inv) => {
      list.push({
        id: `act_inv_${inv.id}`,
        type: 'invoice',
        title: `Invoice ${inv.invoiceNo} Created`,
        subtitle: `গ্রাহক: ${inv.customerName} (${inv.customerType === 'dealer' ? 'ডিলার' : 'খুচরা'})`,
        amount: inv.grandTotal,
        date: inv.createdAt,
        badgeColor: 'emerald',
      });
    });

    // Due collections
    transactions
      .filter((t) => t.type === 'due_collection')
      .forEach((t) => {
        list.push({
          id: `act_due_${t.id}`,
          type: 'due',
          title: `Due Payment Received`,
          subtitle: `গ্রাহক: ${t.customerName} | মাধ্যমে: ${(t.paymentMethod || 'cash').toUpperCase()}`,
          amount: t.amount,
          date: t.date,
          badgeColor: 'amber',
        });
      });

    // Stock arrivals
    stockArrivals.forEach((arr) => {
      list.push({
        id: `act_stock_${arr.id}`,
        type: 'stock',
        title: `Stock Added`,
        subtitle: `পণ্য: ${arr.productName} (${arr.receivedQty} পিস/স্কয়ারফিট)`,
        amount: arr.totalCost,
        date: arr.date,
        badgeColor: 'sky',
      });
    });

    // Expenses
    expenses.forEach((exp) => {
      list.push({
        id: `act_exp_${exp.id}`,
        type: 'expense',
        title: `Expense Logged`,
        subtitle: `খাত: ${(exp.type || 'সাধারণ').toUpperCase()} — ${exp.description || 'পরিচালন ব্যয়'}`,
        amount: exp.amount,
        date: exp.date || exp.createdAt,
        badgeColor: 'purple',
      });
    });

    // Sort by date desc
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [invoices, transactions, stockArrivals, expenses]);

  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize));
  const currentActivities = activities.slice((page - 1) * pageSize, page * pageSize);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'due':
        return <HandCoins className="w-4 h-4 text-amber-400" />;
      case 'stock':
        return <PackagePlus className="w-4 h-4 text-sky-400" />;
      case 'expense':
        return <ReceiptText className="w-4 h-4 text-purple-400" />;
    }
  };

  const getDotClass = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice':
        return 'bg-emerald-400';
      case 'due':
        return 'bg-amber-400';
      case 'stock':
        return 'bg-sky-400';
      case 'expense':
        return 'bg-purple-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              সাম্প্রতিক কার্যক্রম (Recent Business Activity)
            </h3>
            <p className="text-[11px] text-slate-400">
              ইনভয়েস, বকেয়া আদায়, স্টক এন্ট্রি ও ব্যয়ের রিয়েল-টাইম টাইমলাইন
            </p>
          </div>
        </div>

        {onViewAllInvoices && (
          <button
            onClick={onViewAllInvoices}
            className="text-xs text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity List */}
      {currentActivities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          দোকানে এখনো কোনো সাম্প্রতিক কার্যক্রমের রেকর্ড নেই।
        </div>
      ) : (
        <div className="space-y-3">
          {currentActivities.map((act) => {
            const isInvoice = act.type === 'invoice';
            const invoiceObj = isInvoice
              ? invoices.find((inv) => `act_inv_${inv.id}` === act.id)
              : null;

            return (
              <div
                key={act.id}
                onClick={() => {
                  if (invoiceObj && onSelectInvoice) {
                    onSelectInvoice(invoiceObj);
                  }
                }}
                className={`p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 transition flex items-center justify-between gap-3 ${
                  invoiceObj
                    ? 'hover:border-emerald-500/40 hover:bg-slate-900/80 cursor-pointer'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(act.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getDotClass(act.type)}`} />
                      <h5 className="text-xs font-bold text-slate-200">{act.title}</h5>
                      {invoiceObj && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          ক্লিক করে দেখুন
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{act.subtitle}</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{fmtDate(act.date)}</span>
                    </p>
                  </div>
                </div>

                {act.amount !== undefined && (
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-mono text-slate-100">
                      ৳ {fmtNum(act.amount)}
                    </p>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                      {act.type === 'expense' ? 'ব্যয়' : 'পরিমাণ'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/60">
          <span>
            পৃষ্ঠা {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200"
            >
              আগের
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200"
            >
              পরের
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
