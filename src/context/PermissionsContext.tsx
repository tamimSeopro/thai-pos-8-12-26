import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, PermissionFlags, Store } from '../types';
import {
  authenticateUser,
  verify2FACode,
  resetUserPassword,
  unlockUserAccount,
  toggleUser2FA,
  updateUserProfileBySuperAdmin,
  getStoredUsers,
  StoredUser,
  AuthResult,
  DEFAULT_FULL_PERMISSIONS,
} from '../lib/authService';

export { DEFAULT_FULL_PERMISSIONS };

interface PermissionsContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  role: Role;
  permissions: PermissionFlags;
  isSuperAdmin: boolean;
  isStoreAdmin: boolean;
  isModerator: boolean;
  activeStoreId: string;
  activeStoreName: string;
  supportMode: boolean; // True when super_admin is impersonating a store
  impersonatedStore: Store | null;
  enterSupportMode: (store: Store) => void;
  exitSupportMode: () => void;
  loginWithCredentials: (username: string, passwordInput: string) => Promise<AuthResult>;
  verify2FA: (userId: string, code: string) => Promise<AuthResult>;
  resetPassword: (targetUserId: string, newPasswordInput: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (
    targetUserId: string,
    params: { name?: string; username?: string; newPassword?: string }
  ) => Promise<{ success: boolean; message: string }>;
  unlockAccount: (targetUserId: string) => Promise<{ success: boolean; message: string }>;
  toggle2FA: (userId: string, enabled: boolean) => Promise<{ success: boolean; message: string }>;
  getAllUsers: () => Promise<StoredUser[]>;
  loginAsPreset: (presetRole: Role) => void;
  logout: () => void;
  DEFAULT_MOCK_USERS: User[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const DEFAULT_MOCK_USERS: User[] = [
  {
    id: 'usr_super',
    username: 'superadmin',
    name: 'সুপার এডমিন (Super Admin)',
    role: 'super_admin',
    permissions: DEFAULT_FULL_PERMISSIONS,
    isActive: true,
    twoFactorEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_store_admin',
    username: 'storeadmin',
    name: 'করিম গ্লাস এডমিন (Store Admin)',
    role: 'store_admin',
    storeId: 'store_1',
    storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
    permissions: DEFAULT_FULL_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_staff_1',
    username: 'rahim_staff',
    name: 'রহিম মিয়া (বিক্রয়কর্মী)',
    role: 'moderator',
    storeId: 'store_1',
    storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
    permissions: {
      canViewCostPrice: false,
      canAddProduct: true,
      canEditProduct: true,
      canDeleteProduct: false,
      canManageStockArrivals: true,
      canViewReportsAndFinance: false,
      canAccessDueLedger: true,
      canApplyDiscount: true,
      canDeleteInvoice: false,
    },
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('thai_pos_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default unauthenticated so user must log in first
    return null;
  });

  const [impersonatedStore, setImpersonatedStore] = useState<Store | null>(() => {
    const saved = localStorage.getItem('thai_pos_support_store');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('thai_pos_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('thai_pos_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (impersonatedStore) {
      localStorage.setItem('thai_pos_support_store', JSON.stringify(impersonatedStore));
    } else {
      localStorage.removeItem('thai_pos_support_store');
    }
  }, [impersonatedStore]);

  const role: Role = currentUser?.role || 'moderator';

  const isSuperAdmin = role === 'super_admin';
  const isStoreAdmin = role === 'store_admin';
  const isModerator = role === 'moderator';

  // Support mode active if super_admin viewing a store
  const supportMode = isSuperAdmin && impersonatedStore !== null;

  // Active store
  const activeStoreId = supportMode
    ? impersonatedStore.id
    : currentUser?.storeId || 'store_1';

  const activeStoreName = supportMode
    ? impersonatedStore.name
    : currentUser?.storeName || 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম';

  // Effective permissions
  const permissions: PermissionFlags = (() => {
    if (isSuperAdmin || isStoreAdmin) {
      return DEFAULT_FULL_PERMISSIONS;
    }
    return (
      currentUser?.permissions || {
        canViewCostPrice: false,
        canAddProduct: false,
        canEditProduct: false,
        canDeleteProduct: false,
        canManageStockArrivals: false,
        canViewReportsAndFinance: false,
        canAccessDueLedger: false,
        canApplyDiscount: false,
        canDeleteInvoice: false,
      }
    );
  })();

  const enterSupportMode = (store: Store) => {
    setImpersonatedStore(store);
  };

  const exitSupportMode = () => {
    setImpersonatedStore(null);
  };

  const loginWithCredentials = async (
    username: string,
    passwordInput: string
  ): Promise<AuthResult> => {
    const res = await authenticateUser(username, passwordInput);
    if (res.success && res.user) {
      setImpersonatedStore(null);
      setCurrentUser(res.user);
    }
    return res;
  };

  const verify2FA = async (userId: string, code: string): Promise<AuthResult> => {
    const res = await verify2FACode(userId, code);
    if (res.success && res.user) {
      setImpersonatedStore(null);
      setCurrentUser(res.user);
    }
    return res;
  };

  const resetPassword = async (
    targetUserId: string,
    newPasswordInput: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'আপনি লগইন করা নেই' };
    }
    return resetUserPassword(targetUserId, newPasswordInput, currentUser);
  };

  const updateUserProfile = async (
    targetUserId: string,
    params: { name?: string; username?: string; newPassword?: string }
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'আপনি লগইন করা নেই' };
    }
    const res = await updateUserProfileBySuperAdmin(targetUserId, params, currentUser);
    if (res.success && res.updatedUser && currentUser.id === targetUserId) {
      setCurrentUser({
        ...currentUser,
        name: res.updatedUser.name,
        username: res.updatedUser.username,
      });
    }
    return res;
  };

  const unlockAccount = async (
    targetUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'আপনি লগইন করা নেই' };
    }
    return unlockUserAccount(targetUserId, currentUser);
  };

  const toggle2FA = async (
    userId: string,
    enabled: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const res = await toggleUser2FA(userId, enabled);
    if (res.success && currentUser && currentUser.id === userId) {
      setCurrentUser({
        ...currentUser,
        twoFactorEnabled: enabled,
      });
    }
    return res;
  };

  const getAllUsers = async (): Promise<StoredUser[]> => {
    return getStoredUsers();
  };

  const loginAsPreset = async (presetRole: Role) => {
    setImpersonatedStore(null);
    let targetUsername = 'storeadmin';
    if (presetRole === 'super_admin') {
      targetUsername = 'superadmin';
    } else if (presetRole === 'moderator') {
      targetUsername = 'rahim_staff';
    }
    const res = await authenticateUser(targetUsername, presetRole === 'moderator' ? 'staff123' : 'admin123');
    if (res.success && res.user) {
      setCurrentUser(res.user);
    } else if (res.requires2FA && res.tempUserId) {
      // If 2FA enabled for preset, verify with generated code or preset
      const verifyRes = await verify2FACode(res.tempUserId, res.generatedOtp || '123456');
      if (verifyRes.success && verifyRes.user) {
        setCurrentUser(verifyRes.user);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setImpersonatedStore(null);
  };

  return (
    <PermissionsContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        role,
        permissions,
        isSuperAdmin,
        isStoreAdmin,
        isModerator,
        activeStoreId,
        activeStoreName,
        supportMode,
        impersonatedStore,
        enterSupportMode,
        exitSupportMode,
        loginWithCredentials,
        verify2FA,
        resetPassword,
        updateUserProfile,
        unlockAccount,
        toggle2FA,
        getAllUsers,
        loginAsPreset,
        logout,
        DEFAULT_MOCK_USERS,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
