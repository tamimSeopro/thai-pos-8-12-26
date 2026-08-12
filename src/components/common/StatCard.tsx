import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'sky' | 'slate';
  trend?: {
    value: string;
    isUp?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  trend,
}) => {
  const badgeColors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    slate: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  };

  const cardBorder = {
    emerald: 'hover:border-emerald-500/30',
    rose: 'border-rose-500/20 hover:border-rose-500/40 bg-slate-900/90',
    amber: 'border-amber-500/20 hover:border-amber-500/40',
    sky: 'hover:border-sky-500/30',
    slate: 'hover:border-slate-600',
  };

  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-xl p-4.5 transition-all duration-200 shadow-lg shadow-slate-950/40 ${cardBorder[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg border ${badgeColors[variant]} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isUp
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
