import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  Check,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';

export const BackupResetScreen: React.FC = () => {
  const { activeStoreId, activeStoreName } = usePermissions();
  const { t } = useLanguage();

  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [restoreConfirmModal, setRestoreConfirmModal] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleDownloadBackup = async () => {
    try {
      const backupData = await api.exportFullBackup(activeStoreId);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `thai_glass_pos_backup_${activeStoreId}_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMsg({
        type: 'success',
        text: 'সম্পূর্ণ ডাটাবেস ব্যাকআপ JSON ফাইল হিসেবে ডাউনলোড হয়েছে!',
      });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedBackupFile(e.target.files[0]);
      setRestoreConfirmModal(true);
    }
  };

  const executeRestore = async () => {
    if (!selectedBackupFile) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await api.restoreFullBackup(json, activeStoreId);
          setStatusMsg({
            type: 'success',
            text: 'ব্যাকআপ ফাইল থেকে সকল তথ্য সফলভাবে রিস্টোর করা হয়েছে!',
          });
          setRestoreConfirmModal(false);
          setSelectedBackupFile(null);
        } catch (e) {
          setStatusMsg({ type: 'error', text: 'ভুল JSON ফরম্যাট ফাইল!' });
        }
      };
      reader.readAsText(selectedBackupFile);
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'রিস্টোর করতে ব্যর্থ হয়েছে' });
    }
  };

  const handleResetAllData = async () => {
    if (resetConfirmInput.trim() !== 'RESET-ALL') return;
    try {
      await api.resetAllStoreData(activeStoreId);
      setStatusMsg({
        type: 'success',
        text: 'দোকানের সকল ডেটা সফলভাবে রিসেট করা হয়েছে!',
      });
      setResetConfirmInput('');
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'ডেটা রিসেট করতে সমস্যা হয়েছে' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Database className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{t('backupSectionTitle')}</h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t('adminBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t('backupSectionSubtitle')}</p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Backup Download */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">{t('cardBackupDownloadTitle')}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {t('cardBackupDownloadDesc')}
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t('btnDownloadBackup')}</span>
          </button>
        </div>

        {/* Card 2: Backup Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">{t('cardBackupRestoreTitle')}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {t('cardBackupRestoreDesc')}
            </p>
          </div>

          <label className="w-full mt-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{t('btnRestoreBackup')}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Card 3: Delete / Reset All */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-5 shadow-lg shadow-slate-950/40 flex flex-col justify-between hover:border-rose-500/60 transition bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/20">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-rose-300">{t('cardResetAllTitle')}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {t('cardResetAllDesc')}
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold text-rose-400 mb-1">
                {t('confirmResetPrompt')}
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESET-ALL"
                className="w-full font-mono text-center tracking-widest bg-slate-950 border border-rose-500/40 text-rose-300 rounded-xl py-2 text-xs focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          <button
            onClick={handleResetAllData}
            disabled={resetConfirmInput.trim() !== 'RESET-ALL'}
            className="w-full mt-6 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('btnResetAll')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {restoreConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-100">ব্যাকআপ রিস্টোর নিশ্চিতকরণ</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনার সিলেক্ট করা ফাইল (<strong>{selectedBackupFile?.name}</strong>) থেকে ডাটা রিস্টোর করতে চান? এটি বর্তমান ইনভেন্টরি ও মেমো হিস্ট্রি প্রতিস্থাপন করবে।
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRestoreConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={executeRestore}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
              >
                রিস্টোর নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
