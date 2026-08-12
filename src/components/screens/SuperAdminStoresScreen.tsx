import React, { useEffect, useState } from 'react';
import {
  Shield,
  Store as StoreIcon,
  PlusCircle,
  Eye,
  RefreshCw,
  Trash2,
  Lock,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  Ban,
  Database,
  KeyRound,
  Code2,
  Copy,
  Check,
  Unlock,
  LockKeyhole,
  Users,
} from 'lucide-react';
import { Store } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../common/EmptyState';
import {
  createStoreAndAdminAccount,
  getStoredUsers,
  StoredUser,
} from '../../lib/authService';
import { generateSupabaseRLSSQL, getSupabaseConfig } from '../../lib/supabaseClient';

export const SuperAdminStoresScreen: React.FC = () => {
  const { enterSupportMode, currentUser, resetPassword, unlockAccount } = usePermissions();
  const { t } = useLanguage();

  const [stores, setStores] = useState<Store[]>([]);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stores' | 'users' | 'supabase'>('stores');

  // New store form state
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<StoredUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getStores();
      setStores(data);
      const users = await getStoredUsers();
      setAllUsers(users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !adminUsername || !adminPassword || !currentUser) return;
    setErrorMsg(null);

    const res = await createStoreAndAdminAccount(
      {
        storeName,
        ownerName,
        phone,
        address,
        adminUsername,
      },
      adminPassword,
      currentUser
    );

    if (res.success && res.newStore) {
      setStores([res.newStore, ...stores]);
      setStoreName('');
      setOwnerName('');
      setPhone('');
      setAddress('');
      setAdminUsername('');
      setAdminPassword('');

      setSuccessMsg(`"${res.newStore.name}" ও শপ এডমিন একাউন্ট এনক্রিপ্ট করা পাসওয়ার্ড সহ সফলভাবে তৈরি হয়েছে!`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'শপ তৈরিতে সমস্যা হয়েছে');
    }
  };

  const handleToggleSuspend = async (storeId: string) => {
    try {
      const updated = await api.toggleStoreStatus(storeId);
      setStores((prev) => prev.map((s) => (s.id === storeId ? updated : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই স্টোরটি মুছে ফেলতে চান?')) return;
    try {
      await api.deleteStore(storeId);
      setStores((prev) => prev.filter((s) => s.id !== storeId));
    } catch (e) {
      console.error(e);
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
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    const res = await unlockAccount(userId);
    if (res.success) {
      setSuccessMsg(res.message);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCopySql = () => {
    const sql = generateSupabaseRLSSQL();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{t('superAdminTitle')}</h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t('superAdminPill')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t('superAdminRoleSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'stores'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>শপসমূহ ({stores.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>সকল ইউজার ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'supabase'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase RLS Schema</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Create Store (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 mb-2 pb-2 border-b border-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('createNewStore')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              {t('storeCreationNotice')}
            </p>

            <form onSubmit={handleCreateStore} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('storeName')}*
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  placeholder="যেমন: ঢাকা থাই গ্লাস ট্রাডার্স"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('ownerName')}
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="মালিকের নাম"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711XXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('address')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ঠিকানা"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('storeAdminUsername')}*
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="storeadmin_username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('storeAdminPassword')}*
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="•••••••• (অন্তত ৬ অক্ষর)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/40"
              >
                {t('btnCreateStore')}
              </button>
            </form>
          </div>

          {/* Right Panel: Registered Stores List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-amber-400" />
                <span>{t('registeredStoresList')}</span>
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                {stores.length} টি স্টোর
              </span>
            </h3>

            {stores.length === 0 ? (
              <EmptyState
                title={t('noStoresFound')}
                description="বামপাশের ফরম থেকে নতুন স্টোর তৈরি করুন।"
              />
            ) : (
              <div className="space-y-4">
                {stores.map((store) => {
                  const adminUser = allUsers.find(
                    (u) => u.username.toLowerCase() === store.adminUsername?.toLowerCase()
                  );

                  return (
                    <div
                      key={store.id}
                      className={`p-4 rounded-xl bg-slate-950 border transition ${
                        store.isSuspended
                          ? 'border-rose-500/30 bg-slate-950/80'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-100">{store.name}</h4>
                            {store.isSuspended ? (
                              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                                {t('storeSuspended')}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                {t('storeActive')}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                            <p className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>এডমিন: <strong>@{store.adminUsername}</strong></span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{store.phone || 'N/A'}</span>
                            </p>
                            <p className="flex items-center gap-1.5 col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{store.address || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 4 Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                        {/* 1. Support Mode (View) */}
                        <button
                          onClick={() => enterSupportMode(store)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('btnSupportMode')}</span>
                        </button>

                        {/* 2. Suspend / Activate toggle */}
                        <button
                          onClick={() => handleToggleSuspend(store.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            store.isSuspended
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{store.isSuspended ? t('btnActivate') : t('btnSuspend')}</span>
                        </button>

                        {/* 3. Reset Password */}
                        <button
                          onClick={() => {
                            if (adminUser) {
                              setResetModalUser(adminUser);
                            } else {
                              alert(`এডমিন ইউজার @${store.adminUsername} খুঁজে পাওয়া যায়নি`);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{t('btnResetPassword')}</span>
                        </button>

                        {/* 4. Delete Icon */}
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title={t('btnDeleteStore')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">সকল প্ল্যাটফর্ম ইউজার অ্যাকাউন্টস</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                সকল স্টোর এডমিন ও স্টাফ ইউজারদের নিয়ন্ত্রণ, পাসওয়ার্ড রিসেট ও আনলকিং প্যানেল
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allUsers.map((usr) => {
              const isLocked = Boolean(usr.lockoutUntil && Date.now() < usr.lockoutUntil);

              return (
                <div key={usr.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{usr.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">@{usr.username}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-amber-400">
                      {usr.role}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    শপ: <strong>{usr.storeName || 'Global'}</strong>
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    {isLocked ? (
                      <button
                        onClick={() => handleUnlockUser(usr.id)}
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>লকড - আনলক করুন</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold">সক্রিয়</span>
                    )}

                    <button
                      onClick={() => setResetModalUser(usr)}
                      className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/20"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>পাসওয়ার্ড রিসেট</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supabase RLS Schema Tab */}
      {activeTab === 'supabase' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Supabase Free Tier PostgreSQL & RLS Security Script
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supabase-এর ফ্রী ডাটাবেসে ডাটা আইসোলেশন (Row Level Security) কার্যকর করার সম্পূর্ণ SQL কোড
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'কপি সম্পূর্ণ হয়েছে!' : 'SQL কোড কপি করুন'}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                কানেক্টেড প্রজেক্ট URL:
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                {getSupabaseConfig().isConnected ? 'Active Connection' : 'Configured'}
              </span>
            </div>
            <p className="font-mono text-slate-200 text-[11px] bg-slate-900 p-2 rounded border border-slate-800 break-all">
              {getSupabaseConfig().supabaseUrl || 'https://yowcmycyukdvboohtqgq.supabase.co'}
            </p>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Supabase Auth সিকিউরিটি সেটিংস কনফিগারেশন:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90">
              <li><strong>Allow new users to sign up:</strong> ডিজেবলড (পাবলিক রেজিস্ট্রেশন বন্ধ)</li>
              <li><strong>Confirm email:</strong> ডিজেবলড (সরাসরি এডমিন প্রোভিশনিং)</li>
              <li><strong>এডমিন অ্যাকাউন্ট তৈরি:</strong> সার্ভার-সাইড সার্ভিস রোল কী (Service Role Key) দ্বারা সরাসরি প্রোভিশন করা হবে (`/api/admin/create-user`)</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-emerald-400">কীভাবে Supabase-এ সেটআপ করবেন:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>আপনার ফ্রী Supabase Dashboard-এ যান (supabase.com)</li>
              <li>বামপাশের মেনু থেকে <strong>SQL Editor</strong> সিলেক্ট করুন</li>
              <li>উপরের <strong>"SQL কোড কপি করুন"</strong> বাটনে ক্লিক করে কোডটি পেস্ট করে <strong>Run</strong> করুন</li>
              <li>আপনার ডাটাবেসে স্বয়ংক্রিয়ভাবে RLS সিকিউরিটি ও শপ ডাটা আইসোলেশন চালু হয়ে যাবে!</li>
            </ol>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400/90 max-h-[400px] overflow-y-auto whitespace-pre">
            {generateSupabaseRLSSQL()}
          </div>
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
                  পাসওয়ার্ড রিসেট নিশ্চিত
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
