import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Save, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { AttendanceSettings } from '../../types';
import { getAttendanceSettings, saveAttendanceSettings, DEFAULT_ATTENDANCE_SETTINGS } from '../../lib/attendanceService';
import { useLanguage } from '../../context/LanguageContext';

interface AttendanceSettingsTabProps {
  activeStoreId: string;
}

export const AttendanceSettingsTab: React.FC<AttendanceSettingsTabProps> = ({ activeStoreId }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AttendanceSettings>({
    ...DEFAULT_ATTENDANCE_SETTINGS,
    storeId: activeStoreId,
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getAttendanceSettings(activeStoreId);
    setSettings(loaded);
  }, [activeStoreId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAttendanceSettings(settings);
    setSavedMsg('দোকানের শিফট ও উপস্থিতি সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setSavedMsg(null), 3500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{t('shiftTimingTitle')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              স্টাফদের লগইন করার সময় অনুযায়ী স্বয়ংক্রিয়ভাবে অন-টাইম ও লেট উপস্থিতি নির্ধারণের নিয়ম
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                {t('shiftStartTimeLabel')} *
              </label>
              <input
                type="time"
                value={settings.shiftStartTime}
                onChange={(e) => setSettings({ ...settings, shiftStartTime: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                যেমন: সকাল ০৯:০০ ঘটিকা। এর পরবর্তী লগইন দেরিতে গণ্য হবে।
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                {t('lateGraceLabel')} *
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={settings.lateGraceMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, lateGraceMinutes: Number(e.target.value) || 0 })
                }
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                গ্রেস পিরিয়ড (মিনিট): ০৯:০০ + ১৫ মিনিট = ০৯:১৫ পর্যন্ত অন-টাইম।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                {t('shiftEndTimeLabel')}
              </label>
              <input
                type="time"
                value={settings.shiftEndTime}
                onChange={(e) => setSettings({ ...settings, shiftEndTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                দোকান বন্ধ বা স্বাভাবিক শিফট সমাপ্তির সময় (যেমন: সন্ধ্যা ০৭:০০)।
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                {t('minHoursFullDayLabel')}
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={settings.minHoursForFullDay}
                onChange={(e) =>
                  setSettings({ ...settings, minHoursForFullDay: Number(e.target.value) || 8 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                পূর্ণ দিবস হিসেবে গণ্য ন্যূনতম কর্মঘণ্টা (সাধারণত ৮ ঘণ্টা)।
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="autoAtt"
              checked={settings.autoAttendanceOnLogin}
              onChange={(e) =>
                setSettings({ ...settings, autoAttendanceOnLogin: e.target.checked })
              }
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 mt-0.5"
            />
            <label htmlFor="autoAtt" className="cursor-pointer space-y-0.5">
              <span className="font-bold text-slate-200 block">
                লগইনের সাথে স্বয়ংক্রিয় উপস্থিতি ও সেশন ট্র্যাকিং সচল রাখুন
              </span>
              <span className="text-slate-400 text-[11px] block leading-relaxed">
                স্টাফ ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করলেই সিস্টেমে উপস্থিতি সময় এবং লগআউটের সময় স্বয়ংক্রিয়ভাবে হিসাবভুক্ত হবে।
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-sky-950/40 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{t('btnSaveAttendanceSettings')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
