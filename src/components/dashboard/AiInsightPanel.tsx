import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, UserCheck, CheckCircle2, Lightbulb } from 'lucide-react';
import { Invoice, Product, Customer } from '../../types';
import { fmtNum } from '../../lib/formatters';

interface AiInsightPanelProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  todaySales: number;
  yesterdaySales: number;
  netCashBalance: number;
  highestDueCustomer: { name: string; due: number } | null;
}

export const AiInsightPanel: React.FC<AiInsightPanelProps> = ({
  invoices,
  products,
  customers,
  todaySales,
  yesterdaySales,
  netCashBalance,
  highestDueCustomer,
}) => {
  // Generate data-driven smart insights based on real store numbers
  const insights = useMemo(() => {
    const list: {
      id: string;
      type: 'positive' | 'warning' | 'info';
      title: string;
      desc: string;
      icon: typeof TrendingUp;
    }[] = [];

    // 1. Sales Performance insight
    if (yesterdaySales > 0) {
      const growth = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
      if (growth > 0) {
        list.push({
          id: 'ins_sales_growth',
          type: 'positive',
          title: `আজকের বিক্রি গতকালের তুলনায় ${growth}% বেশি`,
          desc: `গতকাল ৳${fmtNum(yesterdaySales)} বিক্রির বিপরীতে আজকে ৳${fmtNum(todaySales)} বিক্রি অর্জিত হয়েছে। গ্রাহকের অর্ডার প্রবাহ ইতিবাচক।`,
          icon: TrendingUp,
        });
      } else if (growth < 0) {
        list.push({
          id: 'ins_sales_dip',
          type: 'info',
          title: `আজকের বিক্রি গতকালের তুলনায় ${Math.abs(growth)}% কম`,
          desc: `আজকের মোট বিক্রি ৳${fmtNum(todaySales)}। দুপুরের পরের শিফটে ডিলার ও কাস্টমারদের সাথে সক্রিয় যোগাযোগের পরামর্শ।`,
          icon: Lightbulb,
        });
      } else {
        list.push({
          id: 'ins_sales_equal',
          type: 'info',
          title: `আজকের বিক্রি গতকালের সমান গতি বজায় রেখেছে`,
          desc: `আজকে মোট ৳${fmtNum(todaySales)} বিক্রি রেকর্ড হয়েছে।`,
          icon: TrendingUp,
        });
      }
    } else if (todaySales > 0) {
      list.push({
        id: 'ins_sales_today',
        type: 'positive',
        title: `আজকে মোট ৳${fmtNum(todaySales)} বিক্রি অর্জিত হয়েছে`,
        desc: `গ্রাহকদের অর্ডার সফলভাবে প্রস্তুত ও সরবরাহ করা হচ্ছে।`,
        icon: TrendingUp,
      });
    }

    // 2. Stock depletion alert
    const criticalProducts = products.filter(
      (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold
    );
    if (criticalProducts.length > 0) {
      const topCritical = criticalProducts[0];
      list.push({
        id: 'ins_stock_depletion',
        type: 'warning',
        title: `৫ দিনের মধ্যে ${topCritical.nameBn} এর স্টক শেষ হতে পারে`,
        desc: `বর্তমানে মাত্র ${topCritical.stockQty} ${topCritical.unit} অবশিষ্ট রয়েছে (নূন্যতম লিমিট: ${topCritical.lowStockThreshold})। নতুন লট ক্রয়ের এখনই অর্ডার দিন।`,
        icon: AlertTriangle,
      });
    } else {
      const outOfStock = products.filter((p) => (p.stockQty || 0) <= 0);
      if (outOfStock.length > 0) {
        list.push({
          id: 'ins_stock_out',
          type: 'warning',
          title: `${outOfStock[0].nameBn} সম্পূর্ণ স্টক আউট রয়েছে`,
          desc: `পণ্যটির চাহিদা থাকায় অবিলম্বে মহাজন থেকে নতুন চালান আনুন।`,
          icon: AlertTriangle,
        });
      }
    }

    // 3. Due collection follow-up
    if (highestDueCustomer && highestDueCustomer.due > 0) {
      list.push({
        id: 'ins_due_followup',
        type: 'warning',
        title: `${highestDueCustomer.name} এর due payment follow-up প্রয়োজন`,
        desc: `এই গ্রাহকের কাছে সর্বোচ্চ ৳${fmtNum(highestDueCustomer.due)} বকেয়া জমা রয়েছে। ক্যাশ ফ্লো স্বাভাবিক রাখতে ফোনে তাগাদা দিন।`,
        icon: UserCheck,
      });
    }

    // 4. Net Cash Position Insight
    if (netCashBalance >= 0) {
      list.push({
        id: 'ins_cash_pos',
        type: 'positive',
        title: `আজকের নিট ক্যাশ উদ্বৃত্ত ৳${fmtNum(netCashBalance)} অনুকূল রয়েছে`,
        desc: `দৈনিক নগদ প্রাপ্তি মোট পরিচালন খরচের চেয়ে বেশি, যা দোকানের ক্যাশ লিকুইডিটি সুরক্ষিত রাখছে।`,
        icon: CheckCircle2,
      });
    }

    return list;
  }, [invoices, products, customers, todaySales, yesterdaySales, netCashBalance, highestDueCustomer]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-xl shadow-slate-950/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                AI বিজনেস সহকারী (AI Business Assistant)
              </h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                স্মার্ট ইনসাইট
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              দোকানের ডেটা বিশ্লেষণ করে স্বয়ংক্রিয় পরামর্শ ও অ্যালার্ট
            </p>
          </div>
        </div>
      </div>

      {/* Insight Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((ins) => {
          const Icon = ins.icon;
          const isWarning = ins.type === 'warning';
          const isPositive = ins.type === 'positive';

          return (
            <div
              key={ins.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isWarning
                  ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                  : isPositive
                  ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isWarning
                      ? 'bg-amber-500/10 text-amber-400'
                      : isPositive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-indigo-500/10 text-indigo-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug">{ins.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ins.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
