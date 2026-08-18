/**
 * Staff Attendance & Login/Logout Tracking Service
 * Tracks staff logins, logouts, shift working hours, and automated daily attendance
 */

import { StaffAttendanceLog, AttendanceSettings, User, AttendanceStatusType } from '../types';

const ATTENDANCE_STORAGE_KEY = 'thai_pos_staff_attendance_logs_v1';
const SETTINGS_STORAGE_KEY = 'thai_pos_attendance_settings_v1';

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  storeId: 'store_1',
  shiftStartTime: '09:00', // 9:00 AM
  lateGraceMinutes: 15,    // Up to 9:15 AM considered on time
  shiftEndTime: '19:00',   // 7:00 PM
  minHoursForFullDay: 8,
  autoAttendanceOnLogin: true,
};

function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web POS Client';
  const ua = navigator.userAgent;
  let browser = 'Web Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Windows';
  if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} (${os})`;
}

/**
 * Generate initial mock attendance records for demonstration
 */
function generateSeedAttendanceLogs(): StaffAttendanceLog[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 2 Days ago
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  return [
    // Today: Active session for Rahim Mia
    {
      id: 'att_seed_1',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: todayStr,
      loginTime: new Date(new Date().setHours(9, 10, 0, 0)).toISOString(),
      logoutTime: null,
      durationMinutes: 180, // active
      status: 'active',
      attendanceType: 'present',
      deviceOrBrowser: 'Chrome (Windows)',
      note: 'সকাল ৯:১০ এ লগইন সম্পন্ন',
      createdAt: new Date().toISOString(),
    },
    // Yesterday: Completed session for Rahim Mia
    {
      id: 'att_seed_2',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: yesterdayStr,
      loginTime: new Date(new Date(yesterday).setHours(9, 5, 0, 0)).toISOString(),
      logoutTime: new Date(new Date(yesterday).setHours(18, 30, 0, 0)).toISOString(),
      durationMinutes: 565, // ~9.4 hours
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Chrome (Windows)',
      note: 'সারাদিনের ডিউটি সম্পন্ন',
      createdAt: yesterday.toISOString(),
    },
    // 2 Days ago: Late login for Rahim Mia
    {
      id: 'att_seed_3',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: twoDaysAgoStr,
      loginTime: new Date(new Date(twoDaysAgo).setHours(9, 45, 0, 0)).toISOString(),
      logoutTime: new Date(new Date(twoDaysAgo).setHours(19, 0, 0, 0)).toISOString(),
      durationMinutes: 555,
      status: 'completed',
      attendanceType: 'late',
      deviceOrBrowser: 'Chrome (Windows)',
      note: 'রাস্তায় জ্যামের কারণে দেরিতে আগমন',
      createdAt: twoDaysAgo.toISOString(),
    },
    // Store Admin yesterday session
    {
      id: 'att_seed_4',
      userId: 'usr_store_admin',
      username: 'storeadmin',
      userName: 'করিম গ্লাস এডমিন (Store Admin)',
      role: 'store_admin',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: yesterdayStr,
      loginTime: new Date(new Date(yesterday).setHours(8, 50, 0, 0)).toISOString(),
      logoutTime: new Date(new Date(yesterday).setHours(19, 15, 0, 0)).toISOString(),
      durationMinutes: 625,
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Edge (Windows)',
      note: 'এডমিন ইনভেন্টরি ও হিসাব ক্লোজিং',
      createdAt: yesterday.toISOString(),
    },
  ];
}

/**
 * Get all attendance logs from storage
 */
export function getAllAttendanceLogs(): StaffAttendanceLog[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse attendance logs:', e);
    }
  }

  const seeds = generateSeedAttendanceLogs();
  saveAllAttendanceLogs(seeds);
  return seeds;
}

/**
 * Save attendance logs to storage
 */
export function saveAllAttendanceLogs(logs: StaffAttendanceLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(logs));
}

/**
 * Get attendance settings for a store
 */
export function getAttendanceSettings(storeId: string): AttendanceSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_ATTENDANCE_SETTINGS, storeId };
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (saved) {
    try {
      const allSettings: Record<string, AttendanceSettings> = JSON.parse(saved);
      if (allSettings[storeId]) {
        return allSettings[storeId];
      }
    } catch (e) {
      console.error('Failed to parse attendance settings:', e);
    }
  }
  return { ...DEFAULT_ATTENDANCE_SETTINGS, storeId };
}

/**
 * Save attendance settings for a store
 */
export function saveAttendanceSettings(settings: AttendanceSettings): void {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  let allSettings: Record<string, AttendanceSettings> = {};
  if (saved) {
    try {
      allSettings = JSON.parse(saved) || {};
    } catch (e) {
      allSettings = {};
    }
  }
  allSettings[settings.storeId] = settings;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
}

/**
 * Check if a login time is late based on settings
 */
export function evaluateAttendanceType(
  loginDate: Date,
  settings: AttendanceSettings
): AttendanceStatusType {
  const [shiftHour, shiftMin] = settings.shiftStartTime.split(':').map(Number);
  const cutoffMinutes = shiftHour * 60 + shiftMin + (settings.lateGraceMinutes || 0);

  const loginMinutes = loginDate.getHours() * 60 + loginDate.getMinutes();

  if (loginMinutes <= cutoffMinutes) {
    return 'present';
  } else {
    return 'late';
  }
}

/**
 * Record a staff login event
 */
export function recordStaffLogin(user: User): StaffAttendanceLog {
  const logs = getAllAttendanceLogs();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const storeId = user.storeId || 'store_1';
  const settings = getAttendanceSettings(storeId);

  // Close any orphaned previous active session for this user
  logs.forEach((log) => {
    if (log.userId === user.id && log.status === 'active') {
      log.logoutTime = now.toISOString();
      const diffMs = now.getTime() - new Date(log.loginTime).getTime();
      log.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
      log.status = 'completed';
    }
  });

  const attendanceType = evaluateAttendanceType(now, settings);

  const newLog: StaffAttendanceLog = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    username: user.username,
    userName: user.name,
    role: user.role,
    storeId: storeId,
    storeName: user.storeName || 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
    date: todayStr,
    loginTime: now.toISOString(),
    logoutTime: null,
    durationMinutes: 0,
    status: 'active',
    attendanceType,
    deviceOrBrowser: getDeviceName(),
    note: attendanceType === 'late' ? 'দেরিতে লগইন (Late check-in)' : 'যথাসময়ে লগইন (On-time check-in)',
    createdAt: now.toISOString(),
  };

  logs.unshift(newLog);
  saveAllAttendanceLogs(logs);

  if (typeof window !== 'undefined') {
    localStorage.setItem(`thai_pos_active_session_${user.id}`, newLog.id);
  }

  return newLog;
}

/**
 * Record a staff logout event
 */
export function recordStaffLogout(userId?: string): StaffAttendanceLog | null {
  if (!userId) return null;
  const logs = getAllAttendanceLogs();
  const now = new Date();

  // Find active session for user
  const activeIndex = logs.findIndex((l) => l.userId === userId && l.status === 'active');
  if (activeIndex !== -1) {
    const log = logs[activeIndex];
    log.logoutTime = now.toISOString();
    const loginDate = new Date(log.loginTime);
    const diffMs = now.getTime() - loginDate.getTime();
    log.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
    log.status = 'completed';

    saveAllAttendanceLogs(logs);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`thai_pos_active_session_${userId}`);
    }
    return log;
  }

  return null;
}

/**
 * Add manual attendance entry by Admin
 */
export function addManualAttendance(
  entry: Omit<StaffAttendanceLog, 'id' | 'createdAt'>
): StaffAttendanceLog {
  const logs = getAllAttendanceLogs();
  const now = new Date();

  const newLog: StaffAttendanceLog = {
    ...entry,
    id: `att_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.toISOString(),
  };

  logs.unshift(newLog);
  saveAllAttendanceLogs(logs);
  return newLog;
}

/**
 * Update an existing attendance record
 */
export function updateAttendanceRecord(
  id: string,
  updates: Partial<StaffAttendanceLog>
): boolean {
  const logs = getAllAttendanceLogs();
  const index = logs.findIndex((l) => l.id === id);
  if (index === -1) return false;

  logs[index] = {
    ...logs[index],
    ...updates,
  };

  // Recalculate duration if loginTime and logoutTime both exist
  if (logs[index].loginTime && logs[index].logoutTime) {
    const start = new Date(logs[index].loginTime).getTime();
    const end = new Date(logs[index].logoutTime!).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      logs[index].durationMinutes = Math.round((end - start) / 60000);
    }
  }

  saveAllAttendanceLogs(logs);
  return true;
}

/**
 * Delete an attendance record
 */
export function deleteAttendanceRecord(id: string): boolean {
  const logs = getAllAttendanceLogs();
  const filtered = logs.filter((l) => l.id !== id);
  if (filtered.length !== logs.length) {
    saveAllAttendanceLogs(filtered);
    return true;
  }
  return false;
}

/**
 * Get summary of today's attendance for a store
 */
export function getTodayAttendanceSummary(storeId: string) {
  const logs = getAllAttendanceLogs();
  const todayStr = new Date().toISOString().split('T')[0];

  const storeLogs = logs.filter(
    (l) => (l.storeId === storeId || !l.storeId) && l.date === todayStr
  );

  const activeSessions = storeLogs.filter((l) => l.status === 'active');
  const presentCount = new Set(
    storeLogs.filter((l) => l.attendanceType === 'present').map((l) => l.userId)
  ).size;
  const lateCount = new Set(
    storeLogs.filter((l) => l.attendanceType === 'late').map((l) => l.userId)
  ).size;

  const totalMinutes = storeLogs.reduce((acc, log) => {
    if (log.status === 'active') {
      const now = Date.now();
      const start = new Date(log.loginTime).getTime();
      return acc + Math.max(0, Math.round((now - start) / 60000));
    }
    return acc + (log.durationMinutes || 0);
  }, 0);

  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    todayLogs: storeLogs,
    activeSessions,
    activeCount: activeSessions.length,
    presentCount,
    lateCount,
    totalMinutes,
    totalHours,
  };
}

/**
 * Helper to format duration in Bangla
 */
export function formatMinutesToBangla(minutes: number): string {
  if (!minutes || minutes <= 0) return '০ মিনিট';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours.toLocaleString('bn-BD')} ঘণ্টা ${mins.toLocaleString('bn-BD')} মিনিট`;
  } else if (hours > 0) {
    return `${hours.toLocaleString('bn-BD')} ঘণ্টা`;
  } else {
    return `${mins.toLocaleString('bn-BD')} মিনিট`;
  }
}
