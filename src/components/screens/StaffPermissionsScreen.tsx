import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  User,
  Lock,
  CheckSquare,
  Square,
  Shield,
  Trash2,
  UserX,
  UserPlus,
  ShieldCheck,
  KeyRound,
  LockKeyhole,
  Unlock,
  ShieldAlert,
  Smartphone,
  CalendarCheck,
  Clock,
  Settings,
} from 'lucide-react';
import { PermissionFlags, User as UserType } from '../../types';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../common/EmptyState';
import {
  createStaffAccount,
  getStoredUsers,
  StoredUser,
} from '../../lib/authService';
import { AttendanceLogsTab } from '../staff/AttendanceLogsTab';
import { AttendanceSettingsTab } from '../staff/AttendanceSettingsTab';

export const StaffPermissionsScreen: React.FC = () => {
  const { activeStoreId, activeStoreName, currentUser, resetPassword, unlockAccount, toggle2FA } =
    usePermissions();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'staff_list' | 'attendance_logs' | 'attendance_settings'>('attendance_logs');
  const [staffList, setStaffList] = useState<StoredUser[]>([]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<StoredUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // 9 exact permission flags
  const [permissions, setPermissions] = useState<PermissionFlags>({
    canViewCostPrice: false,
    canAddProduct: true,
    canEditProduct: true,
    canDeleteProduct: false,
    canManageStockArrivals: true,
    canViewReportsAndFinance: false,
    canAccessDueLedger: true,
    canApplyDiscount: true,
    canDeleteInvoice: false,
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStaffData = async () => {
    const allUsers = await getStoredUsers();
    // Filter staff belonging to active store
    const filtered = allUsers.filter(
      (u) => u.role === 'moderator' && (u.storeId === activeStoreId || !u.storeId)
    );
    setStaffList(filtered);
  };

  useEffect(() => {
    loadStaffData();
  }, [activeStoreId]);

  const permissionDefinitions = [
    { key: 'canViewCostPrice', title: t('perm1Title'), desc: t('perm1Desc') },
    { key: 'canAddProduct', title: t('perm2Title'), desc: t('perm2Desc') },
    { key: 'canEditProduct', title: t('perm3Title'), desc: t('perm3Desc') },
    { key: 'canDeleteProduct', title: t('perm4Title'), desc: t('perm4Desc') },
    { key: 'canManageStockArrivals', title: t('perm5Title'), desc: t('perm5Desc') },
    { key: 'canViewReportsAndFinance', title: t('perm6Title'), desc: t('perm6Desc') },
    { key: 'canAccessDueLedger', title: t('perm7Title'), desc: t('perm7Desc') },
    { key: 'canApplyDiscount', title: t('perm8Title'), desc: t('perm8Desc') },
    { key: 'canDeleteInvoice', title: t('perm9Title'), desc: t('perm9Desc') },
  ];

  const togglePermission = (key: keyof PermissionFlags) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !currentUser) return;
    setErrorMsg(null);

    const res = await createStaffAccount(
      {
        username,
        fullName: fullName || username,
        permissions,
        twoFactorEnabled: enable2FA,
      },
      password,
      currentUser
    );

    if (res.success) {
      setUsername('');
      setFullName('');
      setPassword('');
      setSuccessMsg(res.message || 'নতুন বিক্রয়কর্মী একাউন্ট তৈরি ও পাসওয়ার্ড সল্ট-হ্যাশ করা হয়েছে!');
      await loadStaffData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'বিক্রয়কর্মী তৈরিতে সমস্যা হয়েছে');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    const res = await resetPassword(resetModalUser.id, newPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setResetModalUser(null);
      setNewPassword('');
      await loadStaffData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleUnlock = async (userId: string) => {
    const res = await unlockAccount(userId);
    if (res.success) {
      setSuccessMsg(res.message);
      await loadStaffData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggle2FA = async (userId: string, currentVal: boolean) => {
    const res = await toggle2FA(userId, !currentVal);
    if (res.success) {
      setSuccessMsg(res.message);
      await loadStaffData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{t('staffSectionTitle')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('staffSectionSubtitle')}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('attendance_logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'attendance_logs'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t('tabAttendanceLogs')}</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'staff_list'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('tabStaffList')}</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance_settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'attendance_settings'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('tabAttendanceSettings')}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Attendance Logs */}
      {activeTab === 'attendance_logs' && (
        <AttendanceLogsTab
          activeStoreId={activeStoreId}
          activeStoreName={activeStoreName}
          staffList={staffList}
        />
      )}

      {/* Tab 2: Staff List & Permissions Management */}
      {activeTab === 'staff_list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Left Panel: Add New Staff (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>{t('addNewStaff')}</span>
            </h3>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  স্টাফের নাম (Full Name)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: মো: রফিকুল ইসলাম"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ইউজারনেম (Username)*
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="rafiq_staff"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  পাসওয়ার্ড (Password)*
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="•••••••• (অন্তত ৬ অক্ষর)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="staff2fa"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <label htmlFor="staff2fa" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>২-ফ্যাক্টর সিকিউরিটি (2FA) চালু রাখুন</span>
                </label>
              </div>

              {/* Checklist Section */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  {t('permissionsChecklistTitle')}
                </label>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {permissionDefinitions.map((perm) => {
                    const key = perm.key as keyof PermissionFlags;
                    const isChecked = permissions[key];
                    return (
                      <div
                        key={key}
                        onClick={() => togglePermission(key)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{perm.title}</p>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            {perm.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/40"
              >
                {t('btnConfirmStaff')}
              </button>
            </form>
          </div>

          {/* Right Panel: Staff List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>{t('staffListTitle')}</span>
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-lg">
                {staffList.length} জন
              </span>
            </h3>

            {staffList.length === 0 ? (
              <EmptyState
                title={t('noStaffFound')}
                description="বামপাশের ফরমের মাধ্যমে নতুন বিক্রয়কর্মী যোগ করুন।"
              />
            ) : (
              <div className="space-y-3">
                {staffList.map((staff) => {
                  const isLocked = Boolean(staff.lockoutUntil && Date.now() < staff.lockoutUntil);

                  return (
                    <div
                      key={staff.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-100">{staff.name}</h4>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                              @{staff.username}
                            </span>
                            {isLocked ? (
                              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                                <LockKeyhole className="w-3 h-3" />
                                <span>লকড (Locked)</span>
                              </span>
                            ) : staff.isActive ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                                সক্রিয়
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                                নিষ্ক্রিয়
                              </span>
                            )}

                            {staff.twoFactorEnabled && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                                2FA Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            নিবন্ধনের তারিখ: {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('bn-BD') : '-'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlock(staff.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-500/30"
                              title="একাউন্ট আনলক করুন"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>আনলক</span>
                            </button>
                          )}

                          <button
                            onClick={() => setResetModalUser(staff)}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-500/20"
                            title="পাসওয়ার্ড রিসেট করুন"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>পাসওয়ার্ড রিসেট</span>
                          </button>

                          <button
                            onClick={() => handleToggle2FA(staff.id, Boolean(staff.twoFactorEnabled))}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                            title="2FA টগল করুন"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Permission Badges */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <p className="text-[10px] text-slate-400 mb-1.5 font-medium">অনুমোদিত সুবিধাসমূহ:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {permissionDefinitions.map((perm) => {
                            const key = perm.key as keyof PermissionFlags;
                            const hasPerm = staff.permissions[key];
                            return (
                              <span
                                key={key}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                  hasPerm
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                    : 'bg-slate-900 text-slate-600 border-slate-800 line-through opacity-60'
                                }`}
                              >
                                {perm.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Settings */}
      {activeTab === 'attendance_settings' && (
        <div className="animate-in fade-in duration-150">
          <AttendanceSettingsTab activeStoreId={activeStoreId} />
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">পাসওয়ার্ড রিসেট</h3>
                <p className="text-xs text-slate-400">{resetModalUser.name} (@{resetModalUser.username})</p>
              </div>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (অন্তত ৬ অক্ষর)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
                >
                  পাসওয়ার্ড নিশ্চিত রিসেট
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
