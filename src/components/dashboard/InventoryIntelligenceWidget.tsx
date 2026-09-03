import React from 'react';
import { Package, AlertTriangle, XCircle, ArrowRight, Layers, ShieldAlert, Plus } from 'lucide-react';
import { Product } from '../../types';
import { fmtNum } from '../../lib/formatters';

interface InventoryIntelligenceWidgetProps {
  products: Product[];
  onViewInventory: () => void;
  onAddStock: () => void;
}

export const InventoryIntelligenceWidget: React.FC<InventoryIntelligenceWidgetProps> = ({
  products,
  onViewInventory,
  onAddStock,
}) => {
  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + (p.stockQty || 0) * (p.buyingPrice || 0),
    0
  );
  const lowStockItems = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold
  );
  const outOfStockItems = products.filter((p) => (p.stockQty || 0) <= 0);

  // Critical stock alerts (combining out of stock and low stock)
  const criticalAlerts = [...outOfStockItems, ...lowStockItems];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              ইনভেন্টরি ইন্টেলিজেন্স (Inventory Overview)
            </h3>
            <p className="text-[11px] text-slate-400">
              মজুদ পণ্যের মোট মূল্য, ঘাটতি ও পুনঃক্রয় সতর্কবার্তা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddStock}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>স্টক যোগ</span>
          </button>
          <button
            onClick={onViewInventory}
            className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>ইনভেন্টরি দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-medium">মোট পণ্য (Total Products)</p>
          <p className="text-base font-extrabold text-slate-100 font-mono mt-0.5">
            {fmtNum(totalProducts)} টি
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-medium">স্টকের ক্রয়মূল্য (Total Value)</p>
          <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
            ৳ {fmtNum(totalStockValue)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 font-medium">কম স্টক (Low Stock Items)</p>
          <p className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
            {fmtNum(lowStockItems.length)} টি
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20">
          <p className="text-[10px] text-rose-400 font-medium">স্টক শেষ (Out Of Stock)</p>
          <p className="text-base font-extrabold text-rose-400 font-mono mt-0.5">
            {fmtNum(outOfStockItems.length)} টি
          </p>
        </div>
      </div>

      {/* Critical Stock Alerts List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>জরুরি স্টক অ্যালার্ট (Critical Alerts)</span>
        </h4>

        {criticalAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
            দোকানের সকল পণ্যের পর্যাপ্ত স্টক মজুদ রয়েছে। কোনো সংকট নেই।
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {criticalAlerts.slice(0, 5).map((prod) => {
              const isOut = (prod.stockQty || 0) <= 0;
              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isOut
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-amber-500/5 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isOut ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <h5 className="text-xs font-bold text-slate-100">
                        {prod.nameBn}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({prod.nameEn})</span>
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isOut
                          ? '⚠ পণ্যটি স্টকে নেই — Need purchase (তাৎক্ষণিক ক্রয় প্রয়োজন)'
                          : `⚠ Only ${prod.stockQty} ${prod.unit} remaining (লিমিট: ${prod.lowStockThreshold} ${prod.unit})`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                        isOut
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {prod.stockQty} {prod.unit} বাকি
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
