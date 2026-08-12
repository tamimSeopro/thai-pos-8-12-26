/**
 * Central Notification Service for Thai Glass POS & Inventory
 * Records all Input/Output activities with exact date, time, and details.
 */

export interface AppNotification {
  id: string;
  storeId: string;
  title: string;
  message: string;
  type: 'sale' | 'due' | 'stock' | 'expense' | 'product';
  timestamp: string; // ISO string with full date and time
  read: boolean;
  details?: {
    amount?: number;
    customerName?: string;
    invoiceNo?: string;
    productName?: string;
    qty?: number;
    paymentMethod?: string;
    category?: string;
  };
}

const NOTIFICATIONS_STORAGE_KEY = 'thai_pos_notifications_v1';

// Seed initial notifications if empty
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    storeId: 'store_1',
    title: 'নতুন বিক্রি ইনভয়েস তৈরি',
    message: 'ইনভয়েস #TG-2025-003 তৈরি করা হয়েছে (গ্রাহক: মো: জসিম উদ্দিন)। মোট মূল্য: ৳১,৭০০ (নগদ পরিশোধিত)।',
    type: 'sale',
    timestamp: new Date().toISOString(),
    read: false,
    details: {
      amount: 1700,
      customerName: 'মো: জসিম উদ্দিন',
      invoiceNo: 'TG-2025-003',
      paymentMethod: 'bkash',
    },
  },
  {
    id: 'notif_2',
    storeId: 'store_1',
    title: 'বকেয়া কালেকশন জমাকৃত',
    message: 'গ্রাহক ইঞ্জিনিয়ার শাহজাহান কবির এর থেকে ৳২,০০০ বকেয়া টাকা ক্যাশে আদায় হয়েছে।',
    type: 'due',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    details: {
      amount: 2000,
      customerName: 'ইঞ্জিনিয়ার শাহজাহান কবির',
      paymentMethod: 'cash',
    },
  },
  {
    id: 'notif_3',
    storeId: 'store_1',
    title: 'নতুন স্টক আগমন (Input)',
    message: '৫ মিমি ক্লিয়ার গ্লাস ১,০০০ sqft স্টক ইনপুট হয়েছে। সোর্স: পিএইচপি গ্লাস ইন্ডাস্ট্রিজ।',
    type: 'stock',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    details: {
      productName: '৫ মিমি ক্লিয়ার গ্লাস (Clear Glass)',
      qty: 1000,
      amount: 42000,
    },
  },
  {
    id: 'notif_4',
    storeId: 'store_1',
    title: 'পরিচালন ব্যয় পরিশোধ (Output)',
    message: 'বিদ্যুৎ বিল বাবদ ৳৪,৫০০ খরচ রেকর্ড করা হয়েছে।',
    type: 'expense',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    read: true,
    details: {
      amount: 4500,
      category: 'electricity',
    },
  },
];

export function getNotifications(storeId: string): AppNotification[] {
  const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS.filter((n) => n.storeId === storeId);
  }
  try {
    const parsed: AppNotification[] = JSON.parse(data);
    return parsed.filter((n) => n.storeId === storeId);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function addNotification(
  storeId: string,
  title: string,
  message: string,
  type: AppNotification['type'],
  details?: AppNotification['details']
): AppNotification {
  const all = getNotifications(storeId);
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}`,
    storeId,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
    details,
  };

  const updated = [newNotif, ...all];
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

  // Dispatch custom event for real-time header update
  window.dispatchEvent(new CustomEvent('app-notification-updated', { detail: { storeId } }));

  return newNotif;
}

export function markAllNotificationsAsRead(storeId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!data) return;
  try {
    const parsed: AppNotification[] = JSON.parse(data);
    const updated = parsed.map((n) => (n.storeId === storeId ? { ...n, read: true } : n));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('app-notification-updated', { detail: { storeId } }));
  } catch (e) {
    console.error(e);
  }
}

export function clearNotifications(storeId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!data) return;
  try {
    const parsed: AppNotification[] = JSON.parse(data);
    const updated = parsed.filter((n) => n.storeId !== storeId);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('app-notification-updated', { detail: { storeId } }));
  } catch (e) {
    console.error(e);
  }
}
