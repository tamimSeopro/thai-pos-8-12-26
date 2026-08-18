import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { StaffAttendanceLog, AttendanceStatusType, Role } from '../../types';
import { StoredUser } from '../../lib/authService';
import { addManualAttendance } from '../../lib/attendanceService';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffList: StoredUser[];
  activeStoreId: string;
  activeStoreName: string;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  activeStoreId,
  activeStoreName,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedUserId, setSelectedUserId] = useState<string>(
    staffList[0]?.id || ''
  );
  const [date, setDate] = useState<string>(todayStr);
  const [loginTimeStr, setLoginTimeStr] = useState<string>('09:00');
  const [logoutTimeStr, setLogoutTimeStr] = useState<string>('18:00');
  const [isCurrentlyActive, setIsCurrentlyActive] = useState<boolean>(false);
  const [attendanceType, setAttendanceType] = useState<AttendanceStatusType>('present');
  const [note, setNote] = useState<string>('এডমিন কর্তৃক ম্যানুয়াল উপস্থিতি এন্ট্রি');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === selectedUserId);
    if (!staff) return;

    setIsSubmitting(true);

    // Build login and logout ISO timestamps
    const [loginH, loginM] = loginTimeStr.split(':').map(Number);
    const loginDate = new Date(`${date}T00:00:00`);
    loginDate.setHours(loginH || 9, loginM || 0, 0, 0);

    let logoutDate: Date | null = null;
    let durationMinutes = 0;

    if (!isCurrentlyActive && logoutTimeStr) {
      const [logoutH, logoutM] = logoutTimeStr.split(':').map(Number);
      logoutDate = new Date(`${date}T00:00:00`);
      logoutDate.setHours(logoutH || 18, logoutM || 0, 0, 0);

      const diffMs = logoutDate.getTime() - loginDate.getTime();
      durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    const newRecord: Omit<StaffAttendanceLog, 'id' | 'createdAt'> = {
      userId: staff.id,
      username: staff.username,
      userName: staff.name,
      role: staff.role as Role,
      storeId: activeStoreId,
      storeName: activeStoreName,
      date,
      loginTime: loginDate.toISOString(),
      logoutTime: logoutDate ? logoutDate.toISOString() : null,
      durationMinutes,
      status: isCurrentlyActive ? 'active' : 'manual',
      attendanceType,
      deviceOrBrowser: 'এডমিন প্যানেল (Manual Entry)',
      note: note.trim(),
    };

    addManualAttendance(newRecord);
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">হস্তচালিত / ম্যানুয়াল উপস্থিতি এন্ট্রি</h3>
              <p className="text-xs text-slate-400">স্টাফের পূর্বের বা বিশেষ উপস্থিতি ও সময় রেকর্ড করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Staff Selection */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>স্টাফ নির্বাচন করুন *</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username}) - {s.role === 'moderator' ? 'বিক্রয়কর্মী' : s.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Attendance Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>তারিখ (Date) *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">উপস্থিতির ধরন (Status) *</label>
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value as AttendanceStatusType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="present">উপস্থিত (Present)</option>
                <option value="late">দেরিতে আগমন (Late)</option>
                <option value="half_day">অর্ধ দিবস (Half Day)</option>
                <option value="leave">ছুটি (Approved Leave)</option>
              </select>
            </div>
          </div>

          {/* Timings */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>লগইন ও লগআউট সময়</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={isCurrentlyActive}
                  onChange={(e) => setIsCurrentlyActive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
                <span>বর্তমানে সক্রিয় / কর্মরত</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">লগইন সময় (Login Time)</label>
                <input
                  type="time"
                  value={loginTimeStr}
                  onChange={(e) => setLoginTimeStr(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  লগআউট সময় (Logout Time) {isCurrentlyActive && '(সক্রিয় বিধায় প্রযোজ্য নয়)'}
                </label>
                <input
                  type="time"
                  value={logoutTimeStr}
                  onChange={(e) => setLogoutTimeStr(e.target.value)}
                  disabled={isCurrentlyActive}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Note / Remarks */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>মন্তব্য বা কারণ (Remarks / Note)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: বিশেষ ডিউটি / ছুটির আবেদন অনুমোদিত"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting || staffList.length === 0}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>উপস্থিতি যুক্ত করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
