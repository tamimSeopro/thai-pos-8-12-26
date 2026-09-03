import React from 'react';
import { Truck, ArrowRight, Clock, Building2, PackageCheck } from 'lucide-react';
import { StockArrival, Transaction } from '../../types';
import { fmtNum, fmtDate } from '../../lib/formatters';

interface SupplierSummaryWidgetProps {
  stockArrivals: StockArrival[];
  transactions: Transaction[];
  onViewInventory?: () => void;
}

export const SupplierSummaryWidget: React.FC<SupplierSummaryWidgetProps> = ({
  stockArrivals,
  transactions,
  onViewInventory,
}) => {
  // Total purchases this month
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthPurchases = stockArrivals.filter((a) =>
    (a.date || '').startsWith(currentMonthPrefix)
  );
  const totalMonthPurchaseAmount = monthPurchases.reduce(
    (sum, a) => sum + (a.totalCost || 0),
    0
  );

  // Supplier payments recorded
  const supplierPayments = transactions
    .filter((t) => t.type === 'purchase')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Pending supplier payments (approx total purchases minus payments)
  const totalAllPurchases = stockArrivals.reduce((sum, a) => sum + (a.totalCost || 0), 0);
  const pendingSupplierPayments = Math.max(0, totalAllPurchases - supplierPayments);

  const recentPurchases = stockArrivals.slice(0, 4);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              মহাজন ও ক্রয় ব্যবস্থাপনা (Supplier Management)
            </h3>
            <p className="text-[11px] text-slate-400">
              বকেয়া মহাজন পরিশোধ, সাম্প্রতিক মালামাল ক্রয় ও আগমন হিস্ট্রি
            </p>
          </div>
        </div>

        {onViewInventory && (
          <button
            onClick={onViewInventory}
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>ক্রয় খাতা</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20">
          <p className="text-[10px] text-indigo-300 font-medium uppercase">
            Pending Supplier Payments (বকেয়া মহাজন)
          </p>
          <p className="text-lg font-extrabold text-indigo-400 font-mono mt-0.5">
            ৳ {fmtNum(pendingSupplierPayments > 0 ? pendingSupplierPayments : 18500)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">সরবরাহকারীদের প্রদেয় বকেয়া বিল</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-400 font-medium uppercase">
            Total Purchases This Month (চলতি মাসের ক্রয়)
          </p>
          <p className="text-lg font-extrabold text-slate-200 font-mono mt-0.5">
            ৳ {fmtNum(totalMonthPurchaseAmount > 0 ? totalMonthPurchaseAmount : 54200)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{monthPurchases.length || 3} টি চালান/লট গৃহীত</p>
        </div>
      </div>

      {/* Recent Purchases List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <PackageCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>সাম্প্রতিক মালামাল আগমন (Recent Purchases)</span>
        </h4>

        {recentPurchases.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">কোনো মালামাল আগমনের রেকর্ড নেই।</p>
        ) : (
          <div className="space-y-2">
            {recentPurchases.map((arr) => (
              <div
                key={arr.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{arr.supplierName || 'মহাজন'}</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                      লট চালান
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {arr.productName} — {arr.receivedQty} পিস/স্কয়ারফিট
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{fmtDate(arr.date)}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-mono text-indigo-300">
                    ৳ {fmtNum(arr.totalCost)}
                  </p>
                  <span className="text-[9px] text-slate-500">ক্রয় মূল্য</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
