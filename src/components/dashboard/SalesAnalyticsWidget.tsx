import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Calendar, AlertCircle } from 'lucide-react';
import { fmtNum } from '../../lib/formatters';
import { Invoice } from '../../types';

interface SalesAnalyticsWidgetProps {
  invoices: Invoice[];
}

type Period = 'today' | '7days' | '30days' | 'custom';

export const SalesAnalyticsWidget: React.FC<SalesAnalyticsWidgetProps> = ({ invoices }) => {
  const [period, setPeriod] = useState<Period>('7days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Aggregate sales by date based on selected period
  const trendData = useMemo(() => {
    const now = new Date();
    let daysCount = 7;
    let startDate: Date;
    let endDate = new Date(now);

    if (period === 'today') {
      daysCount = 1;
      startDate = new Date(now);
    } else if (period === '7days') {
      daysCount = 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
    } else if (period === '30days') {
      daysCount = 30;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
    } else {
      // custom
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const diffMs = endDate.getTime() - startDate.getTime();
      daysCount = Math.max(1, Math.min(60, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1));
    }

    const dailyPoints: {
      dateStr: string;
      label: string;
      fullDate: string;
      totalSales: number;
      invoiceCount: number;
    }[] = [];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });

      // Match invoices
      const dayInvoices = invoices.filter(
        (inv) => inv.createdAt && inv.createdAt.split('T')[0] === iso
      );
      const dayTotal = dayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

      dailyPoints.push({
        dateStr: iso,
        label: daysCount <= 10 ? dayName : dayNum,
        fullDate: `${dayNum} (${dayName})`,
        totalSales: dayTotal,
        invoiceCount: dayInvoices.length,
      });
    }

    return dailyPoints;
  }, [invoices, period, customStart, customEnd]);

  const totalSales = useMemo(
    () => trendData.reduce((sum, d) => sum + d.totalSales, 0),
    [trendData]
  );

  const highestDay = useMemo(() => {
    let max = { dateStr: '', label: '', totalSales: 0, fullDate: '' };
    trendData.forEach((d) => {
      if (d.totalSales > max.totalSales) {
        max = { dateStr: d.dateStr, label: d.label, totalSales: d.totalSales, fullDate: d.fullDate };
      }
    });
    return max;
  }, [trendData]);

  const avgDailySale = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.round(totalSales / trendData.length);
  }, [totalSales, trendData.length]);

  const maxVal = Math.max(...trendData.map((d) => d.totalSales), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-950/40 flex flex-col justify-between">
      <div>
        {/* Header & Period Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                বিক্রয় বিশ্লেষণ (Sales Trend Analysis)
              </h3>
              <p className="text-[11px] text-slate-400">
                দৈনিক বিক্রয় গ্রাফ, শীর্ষ বিক্রয় দিন ও গড় বিক্রয়
              </p>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                period === 'today'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              আজকে (Today)
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                period === '7days'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ৭ দিন (7 Days)
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                period === '30days'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ৩০ দিন (30 Days)
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                period === 'custom'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              কাস্টম
            </button>
          </div>
        </div>

        {/* Custom Range Picker */}
        {period === 'custom' && (
          <div className="flex items-center gap-3 mb-4 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex-wrap">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>সময়সীমা নির্বাচন:</span>
            </span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs"
            />
            <span className="text-slate-500">থেকে</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs"
            />
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-500">সময়সীমার মোট বিক্রয় (Total Sales)</p>
            <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
              ৳ {fmtNum(totalSales)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-500">সর্বোচ্চ বিক্রয়ের দিন (Highest Sales Day)</p>
            <p className="text-xs font-bold text-slate-200 truncate mt-1">
              {highestDay.totalSales > 0 ? (
                <>
                  <span className="text-amber-400 font-mono font-bold">৳{fmtNum(highestDay.totalSales)}</span>{' '}
                  <span className="text-slate-400 text-[11px]">({highestDay.fullDate})</span>
                </>
              ) : (
                'তথ্য নেই'
              )}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-500">দৈনিক গড় বিক্রয় (Average Daily Sale)</p>
            <p className="text-base font-extrabold text-sky-400 font-mono mt-0.5">
              ৳ {fmtNum(avgDailySale)}
            </p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        {totalSales === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30 p-4 text-center">
            <AlertCircle className="w-6 h-6 text-slate-500 mb-1.5" />
            <p className="text-xs font-semibold text-slate-400">No sales data available</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              নির্বাচিত সময়সীমার মধ্যে কোনো বিক্রয়ের রেকর্ড পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-1.5 pt-6 px-1 pb-2 border-b border-slate-800/80">
            {trendData.map((d, idx) => {
              const heightPercent =
                maxVal > 0 && d.totalSales > 0
                  ? Math.max(10, Math.round((d.totalSales / maxVal) * 100))
                  : 4;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 z-20 bg-slate-950 border border-slate-700 text-[10px] text-slate-100 px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                    <span className="font-bold text-emerald-400">৳{fmtNum(d.totalSales)}</span>
                    <span className="text-slate-400"> ({d.invoiceCount} মেমো)</span>
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.totalSales > 0
                        ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-teal-400 group-hover:brightness-125'
                        : 'bg-slate-800/60'
                    }`}
                  />
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-300 transition truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>দৈনিক বিক্রয় অনুপাত</span>
        </span>
        <span className="font-mono text-slate-400">
          সর্বোচ্চ দিন: ৳ {fmtNum(highestDay.totalSales)}
        </span>
      </div>
    </div>
  );
};
