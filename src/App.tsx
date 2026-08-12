/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId } from './types';
import { LanguageProvider } from './context/LanguageContext';
import { PermissionsProvider, usePermissions } from './context/PermissionsContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginModal } from './components/auth/LoginModal';

// Screens
import { DashboardScreen } from './components/screens/DashboardScreen';
import { PosBillingScreen } from './components/screens/PosBillingScreen';
import { DueLedgerScreen } from './components/screens/DueLedgerScreen';
import { InventoryScreen } from './components/screens/InventoryScreen';
import { AccountingReportsScreen } from './components/screens/AccountingReportsScreen';
import { StaffPermissionsScreen } from './components/screens/StaffPermissionsScreen';
import { BackupResetScreen } from './components/screens/BackupResetScreen';
import { SuperAdminStoresScreen } from './components/screens/SuperAdminStoresScreen';

const MainLayout: React.FC = () => {
  const { currentUser, isSuperAdmin, isStoreAdmin, permissions } = usePermissions();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectScreen = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={handleSelectScreen} />;
      case 'billing':
        return <PosBillingScreen />;
      case 'due_ledger':
        return <DueLedgerScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'accounting':
        return <AccountingReportsScreen />;
      case 'staff_permissions':
        return <StaffPermissionsScreen />;
      case 'backup_reset':
        return <BackupResetScreen />;
      case 'super_admin_stores':
        return <SuperAdminStoresScreen />;
      default:
        return <DashboardScreen onNavigate={handleSelectScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* If not logged in, render LoginModal over dark backdrop */}
      {!currentUser && <LoginModal />}

      {/* Main Shell */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onSelectScreen={handleSelectScreen}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Header */}
          <Header onMobileMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />

          {/* Main Viewport Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderScreen()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <PermissionsProvider>
        <MainLayout />
      </PermissionsProvider>
    </LanguageProvider>
  );
}

