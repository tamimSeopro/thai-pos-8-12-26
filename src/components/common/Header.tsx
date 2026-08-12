import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  User,
  Wifi,
  Menu,
  Eye,
  LogOut,
  KeyRound,
  Lock,
  ShoppingBag,
  DollarSign,
  Boxes,
  FileText,
  Clock,
  Bell,
  CheckCheck,
  X,
  Activity,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getNotifications,
  markAllNotificationsAsRead,
  AppNotification,
} from '../../lib/notificationService';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const {
    currentUser,
    activeStoreId,
    activeStoreName,
    role,
    supportMode,
    exitSupportMode,
    logout,
    resetPassword,
  } = usePermissions();
  const { language, toggleLanguage, t } = useLanguage();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const [myNewPassword, setMyNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifs = () => {
    const list = getNotifications(activeStoreId);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifs();
    const handleUpdate = () => loadNotifs();
    window.addEventListener('app-notification-updated', handleUpdate);
    return () => window.removeEventListener('app-notification-updated', handleUpdate);
  }, [activeStoreId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(activeStoreId);
    loadNotifs();
  };

  const formatExactTime = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      const timeStr = dt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = dt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${timeStr} • ${dateStr}`;
    } catch {
      return isoString;
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            Super Admin
          </span>
        );
      case 'store_admin':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            Store Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            Staff
          </span>
        );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !myNewPassword) return;

    const res = await resetPassword(currentUser.id, myNewPassword);
    setPwdMsg(res.message);
    if (res.success) {
      setMyNewPassword('');
      setTimeout(() => {
        setPwdMsg(null);
        setShowPasswordModal(false);
      }, 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {supportMode && (
        <div className="bg-sky-950 border-b border-sky-800 text-sky-200 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Eye className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>
              {t('supportModeActive')}: <strong>{activeStoreName}</strong>
            </span>
          </div>
          <button
            onClick={exitSupportMode}
            className="bg-sky-800 hover:bg-sky-700 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition"
          >
            {t('exitSupportMode')}
          </button>
        </div>
      )}

      {/* Main Header Controls */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Hamburger + App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/50">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
                  {t('appName')}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                {activeStoreName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* PWA / Offline Status */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">{t('pwaReady')}</span>
          </div>

          {/* Language Toggle Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition active:scale-95"
            title="Switch Language / ভাষা পরিবর্তন"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">
              {language === 'bn' ? 'বাংলা' : 'English'}
            </span>
            <span className="text-slate-400 text-[10px]">
              ({language === 'bn' ? 'EN' : 'বাংলা'})
            </span>
          </button>

          {/* NOTIFICATION BELL ICON BUTTON */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 transition shadow-sm active:scale-95"
              title="নোটিফিকেশন ও লেনদেন হিস্ট্রি"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION POPUP / DROPDOWN PANEL */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-100">
                      নোটিফিকেশন ও অ্যাক্টিভিটি ফিড
                    </h3>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/30 transition flex items-center gap-1"
                        title="সবগুলো পড়া হয়েছে হিসেবে চিহ্নিত করুন"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>সব পড়া হয়েছে</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDrawer(false)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-slate-950/80 px-3.5 py-2 border-b border-slate-800/80 text-[11px] text-slate-400 font-medium">
                  সকল ইনপুট/আউটপুট ডাটা এবং লেনদেন ক্রমানুসারে নিখুঁত সময়সহ সংরক্ষিত:
                </div>

                {/* Notifications List (UNIFIED - NO CATEGORY TABS, NO DELETE BUTTON) */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-medium space-y-1">
                      <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                      <p>কোনো নোটিফিকেশন বা লেনদেন রেকর্ড পাওয়া যায়নি!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl transition flex gap-3 text-xs ${
                          notif.read ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'bg-slate-800/60 border-l-2 border-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        {/* Type Icon */}
                        <div className="shrink-0 pt-0.5">
                          {notif.type === 'sale' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {notif.type === 'due' && (
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {notif.type === 'expense' && (
                            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {(notif.type === 'stock' || notif.type === 'product') && (
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                              <Boxes className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Text & Time Content */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-100 text-xs truncate">
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-slate-300 text-[11px] leading-relaxed break-words">
                            {notif.message}
                          </p>

                          {/* Explicit Time Display */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-0.5">
                            <Clock className="w-3 h-3 text-amber-400/80" />
                            <span>{formatExactTime(notif.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1 text-left transition"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs border border-slate-600">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1">{getRoleBadge()}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="p-2 border-b border-slate-800/80">
                    <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg transition text-left"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">আমার পাসওয়ার্ড পরিবর্তন</h3>
                <p className="text-xs text-slate-400">{currentUser?.name}</p>
              </div>
            </div>

            {pwdMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium">
                {pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={myNewPassword}
                  onChange={(e) => setMyNewPassword(e.target.value)}
                  placeholder="•••••••• (অন্তত ৬ অক্ষর)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
                >
                  পাসওয়ার্ড পরিবর্তন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
