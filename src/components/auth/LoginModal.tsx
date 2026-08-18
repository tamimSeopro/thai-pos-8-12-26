import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Globe,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  LockKeyhole,
  Smartphone,
  RefreshCw,
  Info,
  QrCode,
  CheckCircle,
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { get2FASetupDetails } from '../../lib/authService';

export const LoginModal: React.FC = () => {
  const { loginWithCredentials, verify2FA } = usePermissions();
  const { language, toggleLanguage, t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa' | 'recovery'>('credentials');
  
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Google Authenticator QR setup
  const [showQrSetup, setShowQrSetup] = useState(false);
  const [qrDetails, setQrDetails] = useState<{
    secret: string;
    qrCodeUrl: string;
    username: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);

  // Lockout Countdown Effect
  useEffect(() => {
    if (!lockoutTimer || lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (!prev || prev <= 1) {
          setLockoutMsg(null);
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Load Google Authenticator QR Details when entering 2FA step
  useEffect(() => {
    if (step === '2fa' && tempUserId) {
      get2FASetupDetails(tempUserId).then((details) => {
        if (details) {
          setQrDetails(details);
        }
      });
    }
  }, [step, tempUserId]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginWithCredentials(username, password);

      if (result.success) {
        setIsLoading(false);
      } else if (result.requires2FA && result.tempUserId) {
        setTempUserId(result.tempUserId);
        setStep('2fa');
        setIsLoading(false);
      } else if (result.isLocked) {
        setLockoutTimer(result.remainingSeconds || 300);
        setLockoutMsg(result.message || 'পরপর ভুল পাসওয়ার্ড দেওয়ায় অ্যাকাউন্টটি লক করা হয়েছে!');
        setError(result.message || null);
        setIsLoading(false);
      } else {
        setError(result.message || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়!');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError('লগইন প্রক্রিয়ায় ত্রুটি দেখা দিয়েছে: ' + (err?.message || 'অজানা ত্রুটি'));
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId) return;
    if (twoFactorCode.length < 6) {
      setError('Google Authenticator থেকে সঠিক ৬-ডিজিটের নিরাপত্তা কোড দিন');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await verify2FA(tempUserId, twoFactorCode);
      if (!res.success) {
        setError(res.message || 'ভেরিফিকেশন কোড সঠিক নয়!');
      }
    } catch (err: any) {
      setError('২-ফ্যাক্টর ভেরিফিকেশনে ত্রুটি ঘটেছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId) return;
    if (recoveryCode.length < 8) {
      setError('সঠিক ৮-ডিজিটের রিকভারি কোড দিন (যেমন: REC-99887766)');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await verify2FA(tempUserId, recoveryCode);
      if (!res.success) {
        setError(res.message || 'রিকভারি কোড সঠিক নয়!');
      }
    } catch (err: any) {
      setError('রিকভারি কোড ভেরিফিকেশনে ত্রুটি ঘটেছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950 overflow-hidden relative my-8">
        {/* Top Header Glow */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

        {/* Card Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/50">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{t('appName')}</h2>
              <p className="text-xs text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Language Toggle Pill top-right */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>

        {/* Card Content Body */}
        <div className="p-6">
          <div className="mb-5 text-center">
            <h3 className="text-lg font-bold text-slate-100">{t('loginTitle')}</h3>
            <p className="text-xs text-slate-400 mt-1">
              ইউজারনেম ও এনক্রিপ্টেড পাসওয়ার্ড দিয়ে নিরাপদ লগইন করুন
            </p>
          </div>

          {/* Lockout Alert Banner */}
          {lockoutTimer && lockoutTimer > 0 ? (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <LockKeyhole className="w-5 h-5 text-rose-400 shrink-0" />
                <span>একাউন্ট সাময়িকভাবে লকড (Account Locked)</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                পরপর ৫ বার ভুল পাসওয়ার্ড দেওয়ায় নিরাপত্তা স্বার্থে একাউন্টটি ৫ মিনিটের জন্য সাময়িকভাবে লক করা হয়েছে।
              </p>
              <div className="pt-1 flex items-center justify-between text-xs font-mono font-bold bg-rose-900/40 px-2.5 py-1.5 rounded-lg border border-rose-800/40">
                <span>লক খোলার বাকি সময়:</span>
                <span className="text-rose-400 text-sm">
                  {Math.floor(lockoutTimer / 60)}:
                  {(lockoutTimer % 60).toString().padStart(2, '0')} মিনিট
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : null}

          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t('usernameOrEmail')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={Boolean(lockoutTimer && lockoutTimer > 0)}
                    placeholder="e.g. storeadmin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={Boolean(lockoutTimer && lockoutTimer > 0)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  পাসওয়ার্ড সরাসরি SHA-256 সল্টেড হ্যাশিং দ্বারা এনক্রিপ্ট হয়। কোন ব্যাকডোর বা মাস্টার পাসওয়ার্ড গ্রহণযোগ্য নয়।
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || Boolean(lockoutTimer && lockoutTimer > 0)}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>{t('loginButton')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-100">Google Authenticator ২FA নিরাপত্তা</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  আপনার মোবাইল থেকে Google Authenticator / Authy অ্যাপ খুলে ৬-ডিজিটের নিরাপত্তা কোড লিখুন।
                </p>

                {/* 2FA Status & Optional QR Code toggle (Hidden by default for connected users) */}
                <div className="pt-2 flex flex-col items-center gap-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Google Authenticator কানেক্টেড ও সক্রিয় (Active)</span>
                  </div>
                  
                  {qrDetails && (
                    <button
                      type="button"
                      onClick={() => setShowQrSetup(!showQrSetup)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition underline mt-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>{showQrSetup ? 'QR কোড লুকান (Hide QR)' : 'নতুন ডিভাইসে সেটআপ করতে QR কোড দেখুন (Show QR)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* QR Code Setup Modal / Card view (Hidden by default) */}
              {showQrSetup && qrDetails && (
                <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl text-center space-y-3 animate-fadeIn">
                  <p className="text-[11px] font-bold text-emerald-400">
                    Google Authenticator অ্যাপ দিয়ে নিচের QR Code স্ক্যান করুন:
                  </p>

                  {qrDetails.qrCodeUrl ? (
                    <div className="p-2 bg-white rounded-xl inline-block shadow-lg mx-auto">
                      <img
                        src={qrDetails.qrCodeUrl}
                        alt="Google Authenticator QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-slate-900 rounded-xl flex items-center justify-center mx-auto text-xs text-slate-500">
                      QR কোড লোড হচ্ছে...
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">
                      ম্যানুয়াল সিক্রেট কী (Secret Key)
                    </span>
                    <span className="font-mono font-bold text-amber-300 tracking-wider text-xs selection:bg-amber-500 selection:text-slate-950">
                      {qrDetails.secret}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ভেরিফিকেশন কোড (৬-ডিজিট)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="1 2 3 4 5 6"
                  className="w-full text-center text-lg font-mono tracking-widest bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('verifyButton')}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('recovery')}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  {t('useRecoveryCode')}
                </button>
              </div>
            </form>
          )}

          {step === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-200">{t('useRecoveryCode')}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{t('enterRecoveryCode')}</p>
              </div>

              <div>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="REC-XXXXXX"
                  className="w-full text-center text-sm font-mono tracking-widest bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 uppercase font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('verifyButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

