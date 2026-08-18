import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Edit2,
  CalendarDays,
  FileSpreadsheet,
  Activity,
  ArrowUpDown,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Laptop,
  CheckCircle,
  XCircle,
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { StaffAttendanceLog, AttendanceStatusType } from '../../types';
import { StoredUser } from '../../lib/authService';
import {
  getAllAttendanceLogs,
  getTodayAttendanceSummary,
  formatMinutesToBangla,
  getStaffPerformanceStats,
  StaffMonthlyStats,
  resetAndSeedAttendanceLogs,
} from '../../lib/attendanceService';
import { useLanguage } from '../../context/LanguageContext';
import { usePermissions } from '../../context/PermissionsContext';
import { ManualAttendanceModal } from './ManualAttendanceModal';
import { EditAttendanceModal } from './EditAttendanceModal';
import { downloadElementAsPDF } from '../../lib/pdfHelper';

interface AttendanceLogsTabProps {
  activeStoreId: string;
  activeStoreName: string;
  staffList: StoredUser[];
}

export const AttendanceLogsTab: React.FC<AttendanceLogsTabProps> = ({
  activeStoreId,
  activeStoreName,
  staffList,
}) => {
  const { t } = useLanguage();
  const { isSuperAdmin, isStoreAdmin, currentUser } = usePermissions();
  const canEditAttendance = isSuperAdmin || isStoreAdmin;

  const [logs, setLogs] = useState<StaffAttendanceLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPerformanceSummary, setShowPerformanceSummary] = useState<boolean>(true);

  // Filter out super_admin from staff list (super admins do not have attendance tracked)
  const displayStaffList = useMemo(() => {
    return staffList.filter(
      (s) => s.role !== 'super_admin' && s.username !== 'superadmin' && s.id !== 'usr_super_admin'
    );
  }, [staffList]);

  // Live timer tick for accurate dynamic duration calculations
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffAttendanceLog | null>(null);
  const [viewingDetailLog, setViewingDetailLog] = useState<StaffAttendanceLog | null>(null);

  const loadLogs = () => {
    const all = getAllAttendanceLogs();
    // Filter for store and guarantee no super_admin entries exist
    const storeLogs = all.filter(
      (l) =>
        (l.storeId === activeStoreId || !l.storeId) &&
        l.role !== 'super_admin' &&
        l.username !== 'superadmin'
    );
    setLogs(storeLogs);
  };

  useEffect(() => {
    loadLogs();
  }, [activeStoreId]);

  // Live timer update every 15 seconds to ensure live durations stay 100% accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Today summary stats (live recomputed on timer tick)
  const todaySummary = useMemo(() => {
    return getTodayAttendanceSummary(activeStoreId);
  }, [logs, activeStoreId, currentTime]);

  // Monthly performance per staff
  const staffPerformance = useMemo(() => {
    return getStaffPerformanceStats(activeStoreId, displayStaffList);
  }, [logs, activeStoreId, displayStaffList, currentTime]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return logs.filter((log) => {
      // Exclude any accidental super_admin logs
      if (log.role === 'super_admin' || log.username === 'superadmin') return false;

      // Store check
      if (log.storeId && log.storeId !== activeStoreId) return false;

      // Staff filter
      if (selectedStaffId !== 'all' && log.userId !== selectedStaffId) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today' && log.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && log.date !== yesterdayStr) return false;
      if (dateFilter === '7days') {
        const logDate = new Date(log.date);
        if (logDate < sevenDaysAgo) return false;
      }
      if (dateFilter === 'custom' && customDate && log.date !== customDate) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && log.status !== 'active') return false;
      if (statusFilter === 'present' && log.attendanceType !== 'present') return false;
      if (statusFilter === 'late' && log.attendanceType !== 'late') return false;
      if (statusFilter === 'leave' && log.attendanceType !== 'leave') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = log.userName.toLowerCase().includes(term);
        const matchUser = log.username.toLowerCase().includes(term);
        const matchNote = log.note?.toLowerCase().includes(term);
        if (!matchName && !matchUser && !matchNote) return false;
      }

      return true;
    });
  }, [logs, activeStoreId, selectedStaffId, dateFilter, customDate, statusFilter, searchTerm, currentTime]);

  const handleExportPDF = async () => {
    try {
      await downloadElementAsPDF(
        'printable-attendance-sheet',
        `Staff_Attendance_Report_${dateFilter}_${Date.now()}`
      );
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  const handleResetDemoData = () => {
    if (!canEditAttendance) {
      alert('শুধুমাত্র এডমিন উপস্থিতি ডাটা সিঙ্ক করতে পারবেন।');
      return;
    }
    if (window.confirm('আপনি কি উপস্থিতি ইতিহাস পুনরায় সঠিক ডেমো ডাটায় রিসেট ও সিঙ্ক করতে চান?')) {
      resetAndSeedAttendanceLogs();
      loadLogs();
    }
  };

  const formatDateTimeBangla = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      
      let period = '';
      if (hours >= 5 && hours < 12) period = 'সকাল ';
      else if (hours >= 12 && hours < 16) period = 'দুপুর ';
      else if (hours >= 16 && hours < 19) period = 'বিকাল ';
      else period = 'রাত ';

      const minsFormatted = Number(mins).toLocaleString('bn-BD', { minimumIntegerDigits: 2 });
      return `${period}${hours12.toLocaleString('bn-BD')}:${minsFormatted} ${ampm}`;
    } catch (e) {
      return isoString;
    }
  };

  const formatDateBangla = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'short',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Now */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {t('activeStaffTitle')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {todaySummary.activeCount.toLocaleString('bn-BD')}
              </span>
              <span className="text-xs text-slate-400">জন কর্মরত</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 relative">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {t('todayPresentTitle')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-sky-400 font-mono">
                {todaySummary.presentCount.toLocaleString('bn-BD')}
              </span>
              <span className="text-xs text-slate-400">জন উপস্থিত</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Late Arrivals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {t('todayLateTitle')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 font-mono">
                {todaySummary.lateCount.toLocaleString('bn-BD')}
              </span>
              <span className="text-xs text-slate-400">জন দেরিতে</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Working Hours */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {t('todayTotalHours')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-400 font-mono">
                {Number(todaySummary.totalHours).toLocaleString('bn-BD')}
              </span>
              <span className="text-xs text-slate-400">ঘণ্টা (মোট)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Staff Monthly Attendance & Performance Overview (Collapsible) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">
                চলতি মাসের স্টাফ উপস্থিতি ও পারফরম্যান্স মেট্রিক্স
              </h3>
              <p className="text-[11px] text-slate-400">
                স্টাফদের দৈনিক হাজিরা, সময়মতো উপস্থিতি হার ও মোট কাজের ঘণ্টার সঠিক পরিসংখ্যান
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPerformanceSummary(!showPerformanceSummary)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition text-xs flex items-center gap-1"
          >
            <span>{showPerformanceSummary ? 'লুকান' : 'দেখুন'}</span>
            {showPerformanceSummary ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showPerformanceSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {staffPerformance.map((perf) => (
              <div
                key={perf.userId}
                className={`p-4 rounded-xl border space-y-3 transition ${
                  perf.isCurrentlyActive
                    ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
                      {perf.userName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{perf.userName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">@{perf.username}</p>
                    </div>
                  </div>

                  <div>
                    {perf.isCurrentlyActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>সক্রিয়</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                        অফলাইন
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-slate-400">উপস্থিতি দিন</p>
                    <p className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                      {perf.totalDaysWorked.toLocaleString('bn-BD')} দিন
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-slate-400">অন-টাইম</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {perf.onTimeDays.toLocaleString('bn-BD')} দিন
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <p className="text-[10px] text-slate-400">দেরি / ছুটি</p>
                    <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                      {perf.lateDays.toLocaleString('bn-BD')} / {perf.leaveDays.toLocaleString('bn-BD')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>মোট সম্পন্ন সময়:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {perf.totalHours.toLocaleString('bn-BD')} ঘণ্টা
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="স্টাফের নাম, ইউজারনেম বা নোট দিয়ে খুঁজুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canEditAttendance ? (
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btnManualAttendance')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>শুধুমাত্র এডমিন এডিট করতে পারেন</span>
              </div>
            )}

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition"
              title="রিপোর্ট ডাউনলোড / প্রিন্ট"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('btnExportAttendance')}</span>
            </button>

            <button
              onClick={loadLogs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition"
              title="রিফ্রেশ"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {canEditAttendance && (
              <button
                onClick={handleResetDemoData}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl transition"
                title="সঠিক ডেমো হিস্টোরি সিঙ্ক করুন"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Date Filter Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'today'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('filterDateToday')}
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'yesterday'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('filterDateYesterday')}
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === '7days'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('filterDate7Days')}
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('filterDateAll')}
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                dateFilter === 'custom'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              নির্দিষ্ট তারিখ
            </button>
          </div>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          )}

          {/* Staff Filter Dropdown */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সকল স্টাফ ({displayStaffList.length} জন)</option>
            {displayStaffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (@{s.username})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="active">বর্তমানে সক্রিয় (Active Now)</option>
            <option value="present">উপস্থিত (Present)</option>
            <option value="late">দেরিতে আগমন (Late)</option>
            <option value="leave">ছুটি (Leave)</option>
          </select>

          <span className="text-[11px] text-slate-400 ml-auto">
            মোট রেকর্ড: <span className="font-mono text-slate-200 font-bold">{filteredLogs.length}</span> টি
          </span>
        </div>
      </div>

      {/* Printable Report Section & Main Table */}
      <div
        id="printable-attendance-sheet"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Printable Header (Visible when printed or standard table header) */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{t('staffAttendanceHistory')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              দোকান: {activeStoreName} | ফিল্টার: {dateFilter === 'today' ? 'আজকের দিন' : dateFilter === 'yesterday' ? 'গতকাল' : dateFilter === '7days' ? 'গত ৭ দিন' : 'সকল তারিখ'}
            </p>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">কোনো লগইন বা উপস্থিতির রেকর্ড পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-500">
              স্টাফরা সিস্টেমে লগইন করলে স্বয়ংক্রিয়ভাবে তাদের লগইন ও লগআউট সময় এই তালিকায় নির্ভুলভাবে যুক্ত হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">স্টাফের বিবরণ</th>
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">{t('loginTimeCol')}</th>
                  <th className="py-3 px-4">{t('logoutTimeCol')}</th>
                  <th className="py-3 px-4">{t('durationCol')}</th>
                  <th className="py-3 px-4">{t('statusCol')}</th>
                  <th className="py-3 px-4">{t('deviceCol')}</th>
                  <th className="py-3 px-4">মন্তব্য / নোট</th>
                  <th className="py-3 px-4 text-right">
                    {canEditAttendance ? 'অ্যাকশন' : 'বিবরণ'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isActive = log.status === 'active';
                  const currentDuration = isActive
                    ? Math.max(1, Math.round((currentTime - new Date(log.loginTime).getTime()) / 60000))
                    : log.durationMinutes;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isActive ? 'bg-emerald-500/[0.03]' : ''
                      }`}
                      onClick={() => setViewingDetailLog(log)}
                    >
                      {/* Staff Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
                            {log.userName ? log.userName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{log.userName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{log.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {formatDateBangla(log.date)}
                      </td>

                      {/* Login Time */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-100">
                            {formatDateTimeBangla(log.loginTime)}
                          </span>
                          <div>
                            {log.attendanceType === 'late' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{t('lateBadge')}</span>
                              </span>
                            ) : log.attendanceType === 'leave' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">
                                <span>{t('leaveBadge')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('onTimeBadge')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Logout Time */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>{t('activeNowBadge')}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-slate-300">
                            {formatDateTimeBangla(log.logoutTime)}
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200 font-mono">
                          {formatMinutesToBangla(currentDuration)}
                        </span>
                        {isActive && (
                          <p className="text-[10px] text-emerald-400/80 mt-0.5 font-sans">সেশন চলমান...</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {log.status === 'manual' ? (
                          <span className="text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-md font-semibold">
                            {t('manualEntryBadge')}
                          </span>
                        ) : isActive ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                            কর্মরত
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            লগআউট সম্পন্ন
                          </span>
                        )}
                      </td>

                      {/* Device / Browser */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3 text-slate-500" />
                          <span>{log.deviceOrBrowser || 'Web POS'}</span>
                        </span>
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                        {log.note || '-'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {canEditAttendance ? (
                          <button
                            onClick={() => setEditingRecord(log)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewingDetailLog(log)}
                            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {canEditAttendance && (
        <ManualAttendanceModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSuccess={loadLogs}
          staffList={displayStaffList}
          activeStoreId={activeStoreId}
          activeStoreName={activeStoreName}
        />
      )}

      {/* Edit Record Modal */}
      {canEditAttendance && (
        <EditAttendanceModal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          onSuccess={loadLogs}
          record={editingRecord}
        />
      )}

      {/* Detail Record Modal */}
      {viewingDetailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {viewingDetailLog.userName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{viewingDetailLog.userName}</h3>
                  <p className="text-xs text-slate-400 font-mono">@{viewingDetailLog.username}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailLog(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">তারিখ:</span>
                <span className="font-semibold text-slate-200">{formatDateBangla(viewingDetailLog.date)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">লগইন সময়:</span>
                <span className="font-mono font-bold text-emerald-400">{formatDateTimeBangla(viewingDetailLog.loginTime)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">লগআউট সময়:</span>
                <span className="font-mono font-bold text-slate-200">
                  {viewingDetailLog.status === 'active' ? '🟢 সেশন চলমান...' : formatDateTimeBangla(viewingDetailLog.logoutTime)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">মোট কাজের সময়:</span>
                <span className="font-semibold text-slate-100">
                  {formatMinutesToBangla(
                    viewingDetailLog.status === 'active'
                      ? Math.max(1, Math.round((currentTime - new Date(viewingDetailLog.loginTime).getTime()) / 60000))
                      : viewingDetailLog.durationMinutes
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">উপস্থিতির মূল্যায়ন:</span>
                <span className="font-semibold text-slate-200">
                  {viewingDetailLog.attendanceType === 'late'
                    ? '⚠️ দেরিতে আগমন (Late)'
                    : viewingDetailLog.attendanceType === 'leave'
                    ? '🏖️ অনুমোদিত ছুটি (Leave)'
                    : '✅ যথাসময়ে উপস্থিতি (On-Time)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">লগইন ডিভাইস ও ব্রাউজার:</span>
                <span className="font-semibold text-slate-200">{viewingDetailLog.deviceOrBrowser || 'Web POS'}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-400 block mb-1">মন্তব্য / নোট:</span>
                <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                  {viewingDetailLog.note || 'কোনো মন্তব্য নেই'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {canEditAttendance && (
                <button
                  onClick={() => {
                    setEditingRecord(viewingDetailLog);
                    setViewingDetailLog(null);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  রেকর্ড এডিট করুন
                </button>
              )}
              <button
                onClick={() => setViewingDetailLog(null)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
