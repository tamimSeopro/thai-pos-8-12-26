import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { StaffAttendanceLog, AttendanceStatusType } from '../../types';
import { updateAttendanceRecord, deleteAttendanceRecord } from '../../lib/attendanceService';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: StaffAttendanceLog | null;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  if (!isOpen || !record) return null;

  const [date, setDate] = useState<string>(record.date || '');
  const [loginTimeStr, setLoginTimeStr] = useState<string>('09:00');
  const [logoutTimeStr, setLogoutTimeStr] = useState<string>('18:00');
  const [isCurrentlyActive, setIsCurrentlyActive] = useState<boolean>(record.status === 'active');
  const [attendanceType, setAttendanceType] = useState<AttendanceStatusType>(record.attendanceType || 'present');
  const [note, setNote] = useState<string>(record.note || '');

  useEffect(() => {
    if (record) {
      setDate(record.date || '');
      setIsCurrentlyActive(record.status === 'active');
      setAttendanceType(record.attendanceType || 'present');
      setNote(record.note || '');

      if (record.loginTime) {
        const lDate = new Date(record.loginTime);
        const hh = String(lDate.getHours()).padStart(2, '0');
        const mm = String(lDate.getMinutes()).padStart(2, '0');
        setLoginTimeStr(`${hh}:${mm}`);
      }

      if (record.logoutTime) {
        const loDate = new Date(record.logoutTime);
        const hh = String(loDate.getHours()).padStart(2, '0');
        const mm = String(loDate.getMinutes()).padStart(2, '0');
        setLogoutTimeStr(`${hh}:${mm}`);
      } else {
        setLogoutTimeStr('');
      }
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

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

    updateAttendanceRecord(record.id, {
      date,
      loginTime: loginDate.toISOString(),
      logoutTime: isCurrentlyActive ? null : logoutDate ? logoutDate.toISOString() : null,
      durationMinutes,
      status: isCurrentlyActive ? 'active' : 'completed',
      attendanceType,
      note: note.trim(),
    });

    onSuccess();
    onClose();
  };

  const handleDelete = () => {
    if (confirm('আপনি কি এই উপস্থিতির রেকর্ডটি মুছে ফেলতে চান?')) {
      deleteAttendanceRecord(record.id);
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100">উপস্থিতি রেকর্ড সম্পাদনা (Edit Log)</h3>
            <p className="text-xs text-slate-400">
              {record.userName} (@{record.username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>তারিখ (Date)</span>
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
              <label className="block font-medium text-slate-300 mb-1">উপস্থিতি স্ট্যাটাস</label>
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value as AttendanceStatusType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="present">উপস্থিত (Present)</option>
                <option value="late">দেরিতে আগমন (Late)</option>
                <option value="half_day">অর্ধ দিবস (Half Day)</option>
                <option value="leave">ছুটি (Approved Leave)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>সময় ও সক্রিয়তা</span>
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
                <label className="block text-[11px] text-slate-400 mb-1">লগইন সময়</label>
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
                  লগআউট সময় {isCurrentlyActive && '(সক্রিয়)'}
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

          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>মন্তব্য / কারণ (Remarks)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="নোট বা মন্তব্য লিখুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition flex items-center gap-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
