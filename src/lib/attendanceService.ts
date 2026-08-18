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

export function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web POS Client';
  const ua = navigator.userAgent;
  let browser = 'Web Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari')) browser = 'Apple Safari';

  let os = 'Windows 11';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android Mobile';
  else if (ua.includes('iPhone')) os = 'iOS iPhone';
  else if (ua.includes('iPad')) os = 'iPadOS Tablet';
  else if (ua.includes('Linux')) os = 'Linux OS';

  return `${browser} (${os})`;
}

/**
 * Generate accurate and realistic attendance records across recent days
 */
export function generateSeedAttendanceLogs(): StaffAttendanceLog[] {
  const now = new Date();
  
  const getDateStr = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const getIsoTime = (daysAgo: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const todayStr = getDateStr(0);
  const yesterdayStr = getDateStr(1);
  const twoDaysAgoStr = getDateStr(2);
  const threeDaysAgoStr = getDateStr(3);
  const fourDaysAgoStr = getDateStr(4);
  const fiveDaysAgoStr = getDateStr(5);
  const sixDaysAgoStr = getDateStr(6);
  const sevenDaysAgoStr = getDateStr(7);

  return [
    // --- TODAY (Day 0) ---
    // Rahim Mia (Sales Staff) - Currently Active Morning Shift
    {
      id: 'att_seed_today_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: todayStr,
      loginTime: getIsoTime(0, 9, 5), // 9:05 AM (On time)
      logoutTime: null,
      durationMinutes: Math.max(1, Math.round((now.getTime() - new Date(getIsoTime(0, 9, 5)).getTime()) / 60000)),
      status: 'active',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'সকাল ৯:০৫ এ বিক্রয় কাউন্টারে লগইন সম্পন্ন (অন-টাইম)',
      createdAt: getIsoTime(0, 9, 5),
    },
    // Store Admin - Currently Active Management Session
    {
      id: 'att_seed_today_admin',
      userId: 'usr_store_admin',
      username: 'storeadmin',
      userName: 'করিম গ্লাস এডমিন (Store Admin)',
      role: 'store_admin',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: todayStr,
      loginTime: getIsoTime(0, 8, 48), // 8:48 AM
      logoutTime: null,
      durationMinutes: Math.max(1, Math.round((now.getTime() - new Date(getIsoTime(0, 8, 48)).getTime()) / 60000)),
      status: 'active',
      attendanceType: 'present',
      deviceOrBrowser: 'Microsoft Edge (Windows 11)',
      note: 'সকাল ৮:৪৮ এ দোকান ওপেনিং ও ক্যাশ চেক',
      createdAt: getIsoTime(0, 8, 48),
    },

    // --- YESTERDAY (Day 1) ---
    {
      id: 'att_seed_yest_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: yesterdayStr,
      loginTime: getIsoTime(1, 9, 8),
      logoutTime: getIsoTime(1, 18, 40),
      durationMinutes: 572, // 9h 32m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'সারাদিনের বিক্রয় ও মেমো প্রিন্ট ডিউটি সম্পন্ন',
      createdAt: getIsoTime(1, 9, 8),
    },
    {
      id: 'att_seed_yest_admin',
      userId: 'usr_store_admin',
      username: 'storeadmin',
      userName: 'করিম গ্লাস এডমিন (Store Admin)',
      role: 'store_admin',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: yesterdayStr,
      loginTime: getIsoTime(1, 8, 55),
      logoutTime: getIsoTime(1, 19, 15),
      durationMinutes: 620, // 10h 20m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Microsoft Edge (Windows 11)',
      note: 'দৈনিক বিক্রয় খাতা ও ক্যাশ ক্লোজিং সম্পন্ন',
      createdAt: getIsoTime(1, 8, 55),
    },

    // --- 2 DAYS AGO (Day 2) ---
    {
      id: 'att_seed_2d_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: twoDaysAgoStr,
      loginTime: getIsoTime(2, 9, 42), // Late (after 9:15 AM)
      logoutTime: getIsoTime(2, 19, 0),
      durationMinutes: 558, // 9h 18m
      status: 'completed',
      attendanceType: 'late',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'রাস্তায় তীব্র যানজটের কারণে ২৭ মিনিট দেরিতে আগমন',
      createdAt: getIsoTime(2, 9, 42),
    },
    {
      id: 'att_seed_2d_admin',
      userId: 'usr_store_admin',
      username: 'storeadmin',
      userName: 'করিম গ্লাস এডমিন (Store Admin)',
      role: 'store_admin',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: twoDaysAgoStr,
      loginTime: getIsoTime(2, 9, 0),
      logoutTime: getIsoTime(2, 18, 50),
      durationMinutes: 590, // 9h 50m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Microsoft Edge (Windows 11)',
      note: 'স্টক মাল আগমন তদারকি ও ইনভেন্টরি এন্ট্রি',
      createdAt: getIsoTime(2, 9, 0),
    },

    // --- 3 DAYS AGO (Day 3) ---
    {
      id: 'att_seed_3d_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: threeDaysAgoStr,
      loginTime: getIsoTime(3, 9, 2),
      logoutTime: getIsoTime(3, 18, 30),
      durationMinutes: 568, // 9h 28m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'যথাসময়ে উপস্থিতি ও ডিউটি সম্পন্ন',
      createdAt: getIsoTime(3, 9, 2),
    },

    // --- 4 DAYS AGO (Day 4) ---
    {
      id: 'att_seed_4d_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: fourDaysAgoStr,
      loginTime: getIsoTime(4, 8, 58),
      logoutTime: getIsoTime(4, 18, 45),
      durationMinutes: 587, // 9h 47m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'সকাল ৮:৫৮ এ ডিউটি শুরু',
      createdAt: getIsoTime(4, 8, 58),
    },

    // --- 5 DAYS AGO (Day 5) ---
    {
      id: 'att_seed_5d_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: fiveDaysAgoStr,
      loginTime: getIsoTime(5, 9, 35), // Late
      logoutTime: getIsoTime(5, 18, 30),
      durationMinutes: 535, // 8h 55m
      status: 'completed',
      attendanceType: 'late',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'বৃষ্টির কারণে ২০ মিনিট দেরিতে উপস্থিতি',
      createdAt: getIsoTime(5, 9, 35),
    },

    // --- 6 DAYS AGO (Day 6 - Approved Leave) ---
    {
      id: 'att_seed_6d_rahim_leave',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: sixDaysAgoStr,
      loginTime: getIsoTime(6, 9, 0),
      logoutTime: getIsoTime(6, 9, 0),
      durationMinutes: 0,
      status: 'manual',
      attendanceType: 'leave',
      deviceOrBrowser: 'Admin Portal Entry',
      note: 'অনুমোদিত পারিবারিক নৈমিত্তিক ছুটি (Casual Leave)',
      createdAt: getIsoTime(6, 9, 0),
    },

    // --- 7 DAYS AGO (Day 7) ---
    {
      id: 'att_seed_7d_rahim',
      userId: 'usr_staff_1',
      username: 'rahim_staff',
      userName: 'মো: রহিম মিয়া (বিক্রয়কর্মী)',
      role: 'moderator',
      storeId: 'store_1',
      storeName: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
      date: sevenDaysAgoStr,
      loginTime: getIsoTime(7, 9, 10),
      logoutTime: getIsoTime(7, 18, 40),
      durationMinutes: 570, // 9h 30m
      status: 'completed',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (Windows 11)',
      note: 'সাপ্তাহিক স্টক মিলানো ও বিক্রয় ডিউটি',
      createdAt: getIsoTime(7, 9, 10),
    },

    // --- Chittagong Branch Staff Seed ---
    {
      id: 'att_seed_ctg_admin',
      userId: 'usr_ctg_admin',
      username: 'ctgadmin',
      userName: 'চট্টগ্রাম শাখা এডমিন',
      role: 'store_admin',
      storeId: 'store_2',
      storeName: 'চট্টগ্রাম থাই গ্লাস সেন্টার',
      date: todayStr,
      loginTime: getIsoTime(0, 9, 0),
      logoutTime: null,
      durationMinutes: Math.max(1, Math.round((now.getTime() - new Date(getIsoTime(0, 9, 0)).getTime()) / 60000)),
      status: 'active',
      attendanceType: 'present',
      deviceOrBrowser: 'Google Chrome (macOS)',
      note: 'চট্টগ্রাম ব্রাঞ্চ ওপেনিং',
      createdAt: getIsoTime(0, 9, 0),
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
        // Strict exclusion: Super Admin attendance is not tracked or recorded
        const sanitized = parsed.filter(
          (l: StaffAttendanceLog) =>
            l.role !== 'super_admin' &&
            l.userId !== 'usr_super_admin' &&
            l.username !== 'superadmin'
        );
        if (sanitized.length !== parsed.length) {
          saveAllAttendanceLogs(sanitized);
        }
        return sanitized;
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
 * Reset and regenerate accurate demo attendance history
 */
export function resetAndSeedAttendanceLogs(): StaffAttendanceLog[] {
  const seeds = generateSeedAttendanceLogs();
  saveAllAttendanceLogs(seeds);
  return seeds;
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
 * Check if a login time is late based on settings and calculate delay minutes
 */
export function evaluateAttendanceType(
  loginDate: Date,
  settings: AttendanceSettings
): { type: AttendanceStatusType; delayMinutes: number } {
  const [shiftHour, shiftMin] = settings.shiftStartTime.split(':').map(Number);
  const shiftStartMinutes = shiftHour * 60 + shiftMin;
  const cutoffMinutes = shiftStartMinutes + (settings.lateGraceMinutes || 0);

  const loginMinutes = loginDate.getHours() * 60 + loginDate.getMinutes();

  if (loginMinutes <= cutoffMinutes) {
    return { type: 'present', delayMinutes: 0 };
  } else {
    const delay = loginMinutes - shiftStartMinutes;
    return { type: 'late', delayMinutes: Math.max(1, delay) };
  }
}

/**
 * Record a staff login event
 */
export function recordStaffLogin(user: User): StaffAttendanceLog | null {
  // Super admin does NOT need attendance tracking
  if (
    user.role === 'super_admin' ||
    user.username === 'superadmin' ||
    user.id === 'usr_super_admin'
  ) {
    return null;
  }

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

  const { type: attendanceType, delayMinutes } = evaluateAttendanceType(now, settings);

  const note =
    attendanceType === 'late'
      ? `দেরিতে উপস্থিতি (${delayMinutes} মিনিট বিলম্ব)`
      : 'সময়মতো উপস্থিতি (On-Time)';

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
    note,
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
 * Get monthly statistics aggregated per staff member
 */
export interface StaffMonthlyStats {
  userId: string;
  userName: string;
  username: string;
  role: string;
  totalDaysWorked: number;
  onTimeDays: number;
  lateDays: number;
  leaveDays: number;
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number; // percentage
  isCurrentlyActive: boolean;
}

export function getStaffPerformanceStats(
  storeId: string,
  staffList: { id: string; name: string; username: string; role: string }[]
): StaffMonthlyStats[] {
  const nonSuperStaff = staffList.filter(
    (s) => s.role !== 'super_admin' && s.username !== 'superadmin' && s.id !== 'usr_super_admin'
  );
  const logs = getAllAttendanceLogs().filter((l) => l.storeId === storeId || !l.storeId);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter logs for this month
  const monthlyLogs = logs.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return nonSuperStaff.map((staff) => {
    const userLogs = monthlyLogs.filter((l) => l.userId === staff.id);
    const uniqueWorkDates = new Set(
      userLogs.filter((l) => l.attendanceType !== 'leave').map((l) => l.date)
    );
    const totalDaysWorked = uniqueWorkDates.size;

    const onTimeDays = new Set(
      userLogs.filter((l) => l.attendanceType === 'present').map((l) => l.date)
    ).size;

    const lateDays = new Set(
      userLogs.filter((l) => l.attendanceType === 'late').map((l) => l.date)
    ).size;

    const leaveDays = new Set(
      userLogs.filter((l) => l.attendanceType === 'leave').map((l) => l.date)
    ).size;

    const totalMinutes = userLogs.reduce((sum, l) => {
      if (l.status === 'active') {
        const start = new Date(l.loginTime).getTime();
        return sum + Math.max(0, Math.round((Date.now() - start) / 60000));
      }
      return sum + (l.durationMinutes || 0);
    }, 0);

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgHoursPerDay = totalDaysWorked > 0 ? Math.round((totalHours / totalDaysWorked) * 10) / 10 : 0;
    
    // Attendance rate based on days elapsed so far this month (e.g. out of working days)
    const dayOfMonth = now.getDate();
    const attendanceRate = dayOfMonth > 0 ? Math.min(100, Math.round((totalDaysWorked / dayOfMonth) * 100)) : 100;

    const isCurrentlyActive = userLogs.some((l) => l.status === 'active');

    return {
      userId: staff.id,
      userName: staff.name,
      username: staff.username,
      role: staff.role,
      totalDaysWorked,
      onTimeDays,
      lateDays,
      leaveDays,
      totalHours,
      avgHoursPerDay,
      attendanceRate,
      isCurrentlyActive,
    };
  });
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
