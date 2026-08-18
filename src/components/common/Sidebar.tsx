import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  Package,
  TrendingUp,
  UserCheck,
  Database,
  Shield,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isSuperAdmin, isStoreAdmin, permissions, logout, currentUser } = usePermissions();
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: t('navDashboard'),
      subLabel: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'billing' as ScreenId,
      label: t('navBilling'),
      subLabel: 'POS & Billing',
      icon: Receipt,
      visible: true,
    },
    {
      id: 'due_ledger' as ScreenId,
      label: t('navDueLedger'),
      subLabel: 'Due Ledger',
      icon: BookOpen,
      visible: permissions.canAccessDueLedger || isStoreAdmin || isSuperAdmin,
    },
    {
      id: 'inventory' as ScreenId,
      label: t('navInventory'),
      subLabel: 'Stock Inventory',
      icon: Package,
      visible: true,
    },
    {
      id: 'accounting' as ScreenId,
      label: t('navAccounting'),
      subLabel: 'Accounting & Reports',
      icon: TrendingUp,
      visible: permissions.canViewReportsAndFinance || isStoreAdmin || isSuperAdmin,
    },
    {
      id: 'staff_permissions' as ScreenId,
      label: t('navStaffPermissions'),
      subLabel: 'Staff & Attendance',
      icon: UserCheck,
      visible: isStoreAdmin || isSuperAdmin,
    },
    {
      id: 'backup_reset' as ScreenId,
      label: t('navBackupReset'),
      subLabel: 'Backup & Reset',
      icon: Database,
      visible: isStoreAdmin || isSuperAdmin,
    },
    {
      id: 'super_admin_stores' as ScreenId,
      label: t('navSuperAdminStores'),
      subLabel: 'Super Admin',
      icon: Shield,
      visible: isSuperAdmin, // super_admin only
      highlight: true,
    },
  ];

  const handleNavClick = (id: ScreenId) => {
    onSelectScreen(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 w-64 h-screen bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header inside mobile sidebar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              TG
            </div>
            <span className="font-bold text-slate-100 text-sm">{t('appName')}</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            মেনু নেভিগেশন (MENU)
          </div>

          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group ${
                    isActive
                      ? item.highlight
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-950/30 font-semibold'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive
                          ? item.highlight
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.subLabel}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
        </div>

        {/* Footer Pinned Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className="px-3 py-1.5 mb-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <p className="text-[11px] font-semibold text-slate-300 truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">@{currentUser?.username}</p>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-semibold text-xs transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
