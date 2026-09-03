import React, { useState, useMemo } from 'react';
import { HandCoins, Search, Phone, ArrowRight, UserCheck, Clock } from 'lucide-react';
import { Customer, Transaction } from '../../types';
import { fmtNum, fmtDate } from '../../lib/formatters';

interface TopDueCustomersWidgetProps {
  customers: Customer[];
  transactions: Transaction[];
  onCollectDue: (customer: Customer) => void;
  onViewAllDues: () => void;
}

export const TopDueCustomersWidget: React.FC<TopDueCustomersWidgetProps> = ({
  customers,
  transactions,
  onCollectDue,
  onViewAllDues,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Filter customers with due > 0 and sort descending
  const dueCustomers = useMemo(() => {
    const list = customers.filter((c) => (c.totalDue || 0) > 0);
    list.sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(dueCustomers.length / pageSize));
  const displayedCustomers = dueCustomers.slice((page - 1) * pageSize, page * pageSize);

  // Helper to find last payment date for a customer
  const getLastPaymentInfo = (customerId: string) => {
    const custTxs = transactions
      .filter((t) => t.customerId === customerId && (t.type === 'due_collection' || t.type === 'payment'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (custTxs.length === 0) return 'কোনো পূর্ববর্তী জমা নেই';

    const lastDate = new Date(custTxs[0].date);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'আজকে জমা হয়েছে';
    if (diffDays === 1) return 'গতকাল জমা হয়েছে';
    return `${diffDays} দিন আগে (${fmtDate(custTxs[0].date)})`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HandCoins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              সর্বোচ্চ বাকিদার গ্রাহক (Customers With Highest Due)
            </h3>
            <p className="text-[11px] text-slate-400">
              বকেয়া আদায়, লাস্ট পেমেন্ট ট্র্যাকিং ও সরাসরি রিসিভ অপশন
            </p>
          </div>
        </div>

        <button
          onClick={onViewAllDues}
          className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold"
        >
          <span>বকেয়া খাতা দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="গ্রাহকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
        />
      </div>

      {/* Table / List */}
      {displayedCustomers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          {search ? 'অনুসন্ধানে কোনো গ্রাহক পাওয়া যায়নি।' : 'বর্তমানে কোনো গ্রাহকের বকেয়া নেই।'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedCustomers.map((cust) => (
            <div
              key={cust.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-100">{cust.name}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {cust.type === 'dealer' ? 'ডিলার' : 'খুচরা'}
                  </span>
                  {cust.mobile && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{cust.mobile}</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>সর্বশেষ জমা: {getLastPaymentInfo(cust.id)}</span>
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-extrabold font-mono text-rose-400">
                    ৳ {fmtNum(cust.totalDue)}
                  </p>
                  <span className="text-[10px] text-slate-500">বকেয়া পরিমাণ</span>
                </div>

                <button
                  onClick={() => onCollectDue(cust)}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <HandCoins className="w-3.5 h-3.5" />
                  <span>Collect Due</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            পৃষ্ঠা {page} / {totalPages} (মোট {dueCustomers.length} জন)
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
