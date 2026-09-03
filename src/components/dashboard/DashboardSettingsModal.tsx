import React from 'react';
import { X, Sliders, ChevronUp, ChevronDown, RotateCcw, Check, Eye, EyeOff } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  nameBn: string;
  nameEn: string;
  visible: boolean;
}

export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  { id: 'ai_insights', nameBn: 'AI বিজনেস সহকারী', nameEn: 'AI Business Assistant', visible: true },
  { id: 'kpi_cards', nameBn: 'স্মার্ট কেপিআই কার্ড (KPIs)', nameEn: 'Smart KPI Cards', visible: true },
  { id: 'sales_trend', nameBn: 'বিক্রয় ট্রেন্ড অ্যানালিটিক্স', nameEn: 'Sales Trend Analysis', visible: true },
  { id: 'cash_flow', nameBn: 'আজকের ক্যাশ ফ্লো', nameEn: "Today's Cash Flow", visible: true },
  { id: 'profit_overview', nameBn: 'মুনাফা বিশ্লেষণ ও ওভারভিউ', nameEn: 'Profit Overview', visible: true },
  { id: 'due_customers', nameBn: 'সর্বোচ্চ বাকিদার গ্রাহক', nameEn: 'Customers With Highest Due', visible: true },
  { id: 'inventory', nameBn: 'ইনভেন্টরি ইন্টেলিজেন্স', nameEn: 'Inventory Overview & Alerts', visible: true },
  { id: 'recent_activity', nameBn: 'সাম্প্রতিক কার্যক্রম টাইমলাইন', nameEn: 'Recent Business Activity', visible: true },
  { id: 'customer_insight', nameBn: 'গ্রাহক বিশ্লেষণ', nameEn: 'Customer Overview', visible: true },
  { id: 'supplier', nameBn: 'মহাজন ও ক্রয় ব্যবস্থাপনা', nameEn: 'Supplier Summary', visible: true },
  { id: 'staff_attendance', nameBn: 'স্টাফ উপস্থিতি ও লাইভ সেশন', nameEn: 'Staff Attendance', visible: true },
];

interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onSave: (updated: WidgetConfig[]) => void;
  onReset: () => void;
}

export const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSave,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    onSave(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">ড্যাশবোর্ড সাজান (Dashboard Settings)</h3>
              <p className="text-[11px] text-slate-400">
                উইজেট অন/অফ করুন এবং উপরে-নিচে ড্র্যাগ বা মুভ করে সাজিয়ে নিন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Widgets List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {widgets.map((w, idx) => (
            <div
              key={w.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                w.visible
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(w.id)}
                  className={`p-1.5 rounded-lg border transition ${
                    w.visible
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={w.visible ? 'লুকান (Hide)' : 'দেখান (Show)'}
                >
                  {w.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <div>
                  <h4 className="text-xs font-bold text-slate-200">{w.nameBn}</h4>
                  <p className="text-[10px] text-slate-400">{w.nameEn}</p>
                </div>
              </div>

              {/* Order Controls */}
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                  title="উপরে নিন"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === widgets.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                  title="নিচে নিন"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট সাজসজ্জা (Reset)</span>
          </button>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <Check className="w-4 h-4" />
            <span>সম্পন্ন হয়েছে (Done)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
