/**
 * Core domain types for Thai Glass POS & Inventory
 */

export type Role = 'super_admin' | 'store_admin' | 'moderator';

export type Language = 'bn' | 'en';

export interface PermissionFlags {
  canViewCostPrice: boolean;         // ১. ক্রয়মূল্য দেখতে পারবে
  canAddProduct: boolean;            // ২. নতুন পণ্য যোগ করতে পারবে
  canEditProduct: boolean;           // ৩. পণ্য সম্পাদনা/এডিট করতে পারবে
  canDeleteProduct: boolean;         // ৪. পণ্য ডিলিট করতে পারবে
  canManageStockArrivals: boolean;   // ৫. স্টক আগমনের হিসাব রাখতে পারবে
  canViewReportsAndFinance: boolean; // ৬. রিপোর্ট ও ফাইন্যান্স দেখতে পারবে
  canAccessDueLedger: boolean;       // ৭. বকেয়া খাতা এক্সেস ও আদায় করতে পারবে
  canApplyDiscount: boolean;         // ৮. ছাড় (ডিসকাউন্ট) দিতে পারবে
  canDeleteInvoice: boolean;         // ৯. ইনভয়েস/মেমো ডিলিট করতে পারবে
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  storeId?: string;
  storeName?: string;
  permissions: PermissionFlags;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  adminUsername: string;
  isSuspended: boolean;
  createdAt: string;
}

export type ProductCategory = 'glass' | 'thai' | 'aluminum' | 'accessories';

export interface Product {
  id: string;
  storeId: string;
  nameBn: string;
  nameEn: string;
  category: ProductCategory;
  unit: string; // 'sqft' | 'pcs' | 'kg' | 'feet'
  stockQty: number;
  lowStockThreshold: number;
  buyingPrice: number;
  sellingPrice: number;
  thicknessMm?: number;
  color?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productNameBn: string;
  productNameEn: string;
  category: ProductCategory;
  unit: string;
  rate: number;
  qty: number; // number of pieces or items
  heightInches?: number;
  widthInches?: number;
  sqft?: number;
  total: number;
}

export interface InvoiceItem {
  productId: string;
  productNameBn: string;
  productNameEn: string;
  rate: number;
  qty: number;
  unit: string;
  heightInches?: number;
  widthInches?: number;
  sqft?: number;
  total: number;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  type: 'retail' | 'dealer';
  mobile: string;
  address: string;
  totalDue: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  storeId: string;
  customerId?: string;
  customerName: string;
  customerType: 'retail' | 'dealer';
  customerMobile: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'paid' | 'partial' | 'due';
  createdAt: string; // ISO date string
  createdByName: string;
}

export interface StockArrival {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  supplierName: string;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
  date: string;
  note?: string;
}

export interface Expense {
  id: string;
  storeId: string;
  type: 'electricity' | 'rent' | 'salary' | 'transport' | 'other';
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  invoiceNo?: string;
  amount: number;
  type: 'payment' | 'due_collection';
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank';
  date: string;
  note?: string;
}

export interface AuditLog {
  id: string;
  storeId: string;
  username: string;
  action: string;
  timestamp: string;
}

export type ScreenId =
  | 'dashboard'
  | 'billing'
  | 'due_ledger'
  | 'inventory'
  | 'accounting'
  | 'staff_permissions'
  | 'backup_reset'
  | 'super_admin_stores';
