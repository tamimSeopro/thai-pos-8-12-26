import {
  Product,
  Invoice,
  Customer,
  StockArrival,
  Expense,
  Transaction,
  Store,
  User,
  AuditLog,
} from '../types';
import { addNotification, addPaymentNotification } from './notificationService';

/**
 * Single typed API client for Thai Glass POS REST endpoints
 */

const STORAGE_KEYS = {
  STORES: 'thai_pos_stores_v1',
  PRODUCTS: 'thai_pos_products_v1',
  INVOICES: 'thai_pos_invoices_v1',
  CUSTOMERS: 'thai_pos_customers_v1',
  STOCK_ARRIVALS: 'thai_pos_stock_arrivals_v1',
  EXPENSES: 'thai_pos_expenses_v1',
  TRANSACTIONS: 'thai_pos_transactions_v1',
  AUDIT_LOGS: 'thai_pos_audit_logs_v1',
};

// Initial Seed Data
const INITIAL_STORES: Store[] = [
  {
    id: 'store_1',
    name: 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম',
    ownerName: 'মো: আব্দুল করিম',
    phone: '01711223344',
    address: 'নয়া বাজার, গুলশান, ঢাকা',
    adminUsername: 'storeadmin',
    isSuspended: false,
    createdAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'store_2',
    name: 'চট্টগ্রাম রাজ থাই গ্লাস হাউজ',
    ownerName: 'হাজী রফিকুল ইসলাম',
    phone: '01819887766',
    address: 'জিইসি মোড়, চট্টগ্রাম',
    adminUsername: 'ctg_admin',
    isSuspended: false,
    createdAt: '2025-02-01T10:30:00.000Z',
  },
  {
    id: 'store_3',
    name: 'সিলেট বিসমিল্লাহ অ্যালুমিনিয়াম শপ',
    ownerName: 'শাহেদ আহমেদ',
    phone: '01677112233',
    address: 'জিন্দাবাজার, সিলেট',
    adminUsername: 'syl_admin',
    isSuspended: true,
    createdAt: '2025-03-10T14:15:00.000Z',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    storeId: 'store_1',
    nameBn: '৫ মিমি ক্লিয়ার গ্লাস (Clear Glass)',
    nameEn: '5mm Clear Glass',
    category: 'glass',
    unit: 'sqft',
    stockQty: 1850,
    lowStockThreshold: 300,
    buyingPrice: 42,
    sellingPrice: 58,
    thicknessMm: 5,
    color: 'Clear',
    createdAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'prod_2',
    storeId: 'store_1',
    nameBn: '১০ মিমি টেম্পার্ড গ্লাস (Tempered Glass)',
    nameEn: '10mm Tempered Glass',
    category: 'glass',
    unit: 'sqft',
    stockQty: 420,
    lowStockThreshold: 200,
    buyingPrice: 110,
    sellingPrice: 155,
    thicknessMm: 10,
    color: 'Clear',
    createdAt: '2025-01-20T10:30:00.000Z',
  },
  {
    id: 'prod_3',
    storeId: 'store_1',
    nameBn: '৫ মিমি ডার্ক ব্লু গ্লাস (Dark Blue Tinted)',
    nameEn: '5mm Dark Blue Glass',
    category: 'glass',
    unit: 'sqft',
    stockQty: 85, // Low stock!
    lowStockThreshold: 150,
    buyingPrice: 52,
    sellingPrice: 72,
    thicknessMm: 5,
    color: 'Blue',
    createdAt: '2025-01-21T11:00:00.000Z',
  },
  {
    id: 'prod_4',
    storeId: 'store_1',
    nameBn: 'থাই ৪" স্লাইডিং সেকশন প্রফাইল (Silver Anodized)',
    nameEn: 'Thai 4" Sliding Section Silver',
    category: 'thai',
    unit: 'feet',
    stockQty: 640,
    lowStockThreshold: 100,
    buyingPrice: 180,
    sellingPrice: 240,
    color: 'Silver',
    createdAt: '2025-01-22T09:15:00.000Z',
  },
  {
    id: 'prod_5',
    storeId: 'store_1',
    nameBn: 'অ্যালুমিনিয়াম ডোর প্রফাইল (Black Powder Coated)',
    nameEn: 'Aluminum Door Profile Black',
    category: 'aluminum',
    unit: 'feet',
    stockQty: 48, // Low stock!
    lowStockThreshold: 100,
    buyingPrice: 220,
    sellingPrice: 290,
    color: 'Black',
    createdAt: '2025-01-25T14:20:00.000Z',
  },
  {
    id: 'prod_6',
    storeId: 'store_1',
    nameBn: 'থাই উইন্ডো হেভি হুইল রোলার (Wheel Roller)',
    nameEn: 'Thai Window Heavy Roller',
    category: 'accessories',
    unit: 'pcs',
    stockQty: 320,
    lowStockThreshold: 50,
    buyingPrice: 65,
    sellingPrice: 95,
    createdAt: '2025-01-26T16:00:00.000Z',
  },
  {
    id: 'prod_7',
    storeId: 'store_1',
    nameBn: 'গ্লাস সিলিকন গ্লু ব্ল্যাক (Silicon Tube)',
    nameEn: 'Glass Silicon Sealant Black',
    category: 'accessories',
    unit: 'pcs',
    stockQty: 18, // Low stock
    lowStockThreshold: 30,
    buyingPrice: 280,
    sellingPrice: 350,
    createdAt: '2025-01-28T12:00:00.000Z',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    storeId: 'store_1',
    name: 'তৌহিদুর রহমান (আবাসন কনস্ট্রাকশন)',
    type: 'dealer',
    mobile: '01715998877',
    address: 'সেক্টর ৪, উত্তরা, ঢাকা',
    totalDue: 42500,
  },
  {
    id: 'cust_2',
    storeId: 'store_1',
    name: 'ইঞ্জিনিয়ার শাহজাহান কবির',
    type: 'dealer',
    mobile: '01812345678',
    address: 'ব্লক সি, বসুন্ধরা আর/এ',
    totalDue: 18200,
  },
  {
    id: 'cust_3',
    storeId: 'store_1',
    name: 'মো: জসিম উদ্দিন',
    type: 'retail',
    mobile: '01911002233',
    address: 'মিরপুর ১০, ঢাকা',
    totalDue: 0,
  },
  {
    id: 'cust_4',
    storeId: 'store_1',
    name: 'কামরুল হাসান (বিল্ডার)',
    type: 'dealer',
    mobile: '01688334455',
    address: 'ধানমন্ডি ২৭, ঢাকা',
    totalDue: 9400,
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_1001',
    invoiceNo: 'TG-2025-001',
    storeId: 'store_1',
    customerId: 'cust_1',
    customerName: 'তৌহিদুর রহমান (আবাসন কনস্ট্রাকশন)',
    customerType: 'dealer',
    customerMobile: '01715998877',
    customerAddress: 'সেক্টর ৪, উত্তরা, ঢাকা',
    items: [
      {
        productId: 'prod_1',
        productNameBn: '৫ মিমি ক্লিয়ার গ্লাস (Clear Glass)',
        productNameEn: '5mm Clear Glass',
        rate: 58,
        qty: 12,
        unit: 'sqft',
        heightInches: 72,
        widthInches: 48,
        sqft: 288,
        total: 16704,
      },
      {
        productId: 'prod_4',
        productNameBn: 'থাই ৪" স্লাইডিং সেকশন প্রফাইল',
        productNameEn: 'Thai 4" Sliding Section Silver',
        rate: 240,
        qty: 120,
        unit: 'feet',
        total: 28800,
      },
    ],
    subtotal: 45504,
    discount: 3004,
    grandTotal: 42500,
    paidAmount: 0,
    dueAmount: 42500,
    paymentStatus: 'due',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdByName: 'করিম গ্লাস এডমিন',
  },
  {
    id: 'inv_1002',
    invoiceNo: 'TG-2025-002',
    storeId: 'store_1',
    customerId: 'cust_2',
    customerName: 'ইঞ্জিনিয়ার শাহজাহান কবির',
    customerType: 'dealer',
    customerMobile: '01812345678',
    customerAddress: 'ব্লক সি, বসুন্ধরা আর/এ',
    items: [
      {
        productId: 'prod_2',
        productNameBn: '১০ মিমি টেম্পার্ড গ্লাস (Tempered Glass)',
        productNameEn: '10mm Tempered Glass',
        rate: 155,
        qty: 6,
        unit: 'sqft',
        heightInches: 84,
        widthInches: 36,
        sqft: 126,
        total: 19530,
      },
      {
        productId: 'prod_6',
        productNameBn: 'থাই উইন্ডো হেভি হুইল রোলার',
        productNameEn: 'Thai Window Heavy Roller',
        rate: 95,
        qty: 20,
        unit: 'pcs',
        total: 1900,
      },
    ],
    subtotal: 21430,
    discount: 1230,
    grandTotal: 20200,
    paidAmount: 2000,
    dueAmount: 18200,
    paymentStatus: 'partial',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdByName: 'রহিম মিয়া',
  },
  {
    id: 'inv_1003',
    invoiceNo: 'TG-2025-003',
    storeId: 'store_1',
    customerId: 'cust_3',
    customerName: 'মো: জসিম উদ্দিন',
    customerType: 'retail',
    customerMobile: '01911002233',
    customerAddress: 'মিরপুর ১০, ঢাকা',
    items: [
      {
        productId: 'prod_7',
        productNameBn: 'গ্লাস সিলিকন গ্লু ব্ল্যাক (Silicon Tube)',
        productNameEn: 'Glass Silicon Sealant Black',
        rate: 350,
        qty: 5,
        unit: 'pcs',
        total: 1750,
      },
    ],
    subtotal: 1750,
    discount: 50,
    grandTotal: 1700,
    paidAmount: 1700,
    dueAmount: 0,
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
    createdByName: 'করিম গ্লাস এডমিন',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    storeId: 'store_1',
    type: 'electricity',
    amount: 4500,
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    description: 'জানুয়ারি মাসের ডেসকো বিদ্যুৎ বিল পরিশোধ',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'exp_2',
    storeId: 'store_1',
    type: 'rent',
    amount: 25000,
    date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    description: 'দোকান ভাড়া পরিশোধ',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'exp_3',
    storeId: 'store_1',
    type: 'transport',
    amount: 1800,
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    description: 'গ্লাস ট্রাক ট্রান্সপোর্ট ভাড়া',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const INITIAL_STOCK_ARRIVALS: StockArrival[] = [
  {
    id: 'arr_1',
    storeId: 'store_1',
    productId: 'prod_1',
    productName: '৫ মিমি ক্লিয়ার গ্লাস (Clear Glass)',
    supplierName: 'পিএইচপি গ্লাস ইন্ডাস্ট্রিজ লি:',
    receivedQty: 1000,
    unitCost: 42,
    totalCost: 42000,
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    note: 'ট্রাক নং ঢাকা মেট্রো ট-১১২২',
  },
  {
    id: 'arr_2',
    storeId: 'store_1',
    productId: 'prod_4',
    productName: 'থাই ৪" স্লাইডিং সেকশন প্রফাইল',
    supplierName: 'কাজী অ্যালুমিনিয়াম মিলস',
    receivedQty: 500,
    unitCost: 180,
    totalCost: 90000,
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    note: 'সিলভার অ্যানোডাইজড ইনভয়েস #4412',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    storeId: 'store_1',
    customerId: 'cust_2',
    customerName: 'ইঞ্জিনিয়ার শাহজাহান কবির',
    invoiceNo: 'TG-2025-002',
    amount: 2000,
    type: 'payment',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 86400000).toISOString(),
    note: 'বিল জমা',
  },
  {
    id: 'tx_2',
    storeId: 'store_1',
    customerId: 'cust_3',
    customerName: 'মো: জসিম উদ্দিন',
    invoiceNo: 'TG-2025-003',
    amount: 1700,
    type: 'payment',
    paymentMethod: 'bkash',
    date: new Date().toISOString(),
    note: 'সম্পূর্ণ নগদ পরিশোধ',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    storeId: 'store_1',
    username: 'storeadmin',
    action: 'লগইন করেছেন',
    timestamp: new Date().toISOString(),
  },
];

// Helper to get/set stored collections
function getStored<T>(key: string, initial: T): T {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return initial;
  }
}

function setStored<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const api = {
  // STORES (/api/stores)
  async getStores(): Promise<Store[]> {
    return getStored<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
  },

  async createStore(data: Omit<Store, 'id' | 'createdAt' | 'isSuspended'>): Promise<Store> {
    const stores = getStored<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
    const newStore: Store = {
      ...data,
      id: `store_${Date.now()}`,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };
    stores.unshift(newStore);
    setStored(STORAGE_KEYS.STORES, stores);
    return newStore;
  },

  async saveStoreDirectly(store: Store): Promise<Store> {
    const stores = getStored<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
    const index = stores.findIndex((s) => s.id === store.id);
    if (index !== -1) {
      stores[index] = store;
    } else {
      stores.unshift(store);
    }
    setStored(STORAGE_KEYS.STORES, stores);
    return store;
  },

  async toggleStoreStatus(storeId: string): Promise<Store> {
    const stores = getStored<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
    const store = stores.find((s) => s.id === storeId);
    if (!store) throw new Error('Store not found');
    store.isSuspended = !store.isSuspended;
    setStored(STORAGE_KEYS.STORES, stores);
    return store;
  },

  async deleteStore(storeId: string): Promise<void> {
    let stores = getStored<Store[]>(STORAGE_KEYS.STORES, INITIAL_STORES);
    stores = stores.filter((s) => s.id !== storeId);
    setStored(STORAGE_KEYS.STORES, stores);
  },

  // PRODUCTS (/api/products)
  async getProducts(storeId: string): Promise<Product[]> {
    if (!storeId) return [];
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return all.filter((p) => p.storeId === storeId);
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const newProduct: Product = {
      ...data,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newProduct);
    setStored(STORAGE_KEYS.PRODUCTS, all);

    addNotification(
      data.storeId,
      'নতুন পণ্য ক্যাটালগে যুক্ত হয়েছে (Input)',
      `পণ্য: ${newProduct.nameBn} (${newProduct.unit}) | বিক্রয় মূল্য: ৳${newProduct.sellingPrice}`,
      'product',
      { productName: newProduct.nameBn, amount: newProduct.sellingPrice }
    );

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');
    all[index] = { ...all[index], ...updates };
    setStored(STORAGE_KEYS.PRODUCTS, all);

    addNotification(
      all[index].storeId,
      'পণ্য তথ্য/স্টক আপডেট (Data Entry)',
      `পণ্য: ${all[index].nameBn} | স্টক: ${all[index].stockQty} ${all[index].unit} | মূল্য: ৳${all[index].sellingPrice}`,
      'stock',
      { productName: all[index].nameBn, qty: all[index].stockQty, amount: all[index].sellingPrice }
    );

    return all[index];
  },

  async deleteProduct(id: string): Promise<void> {
    let all = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    all = all.filter((p) => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, all);
  },

  // INVOICES (/api/invoices)
  async getInvoices(storeId: string): Promise<Invoice[]> {
    if (!storeId) return [];
    const all = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    return all.filter((inv) => inv.storeId === storeId);
  },

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNo' | 'createdAt'>): Promise<Invoice> {
    const allInvoices = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    const count = allInvoices.length + 1;
    const invoiceNo = `TG-2025-${String(count).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      invoiceNo,
      createdAt: new Date().toISOString(),
    };

    // Deduct inventory stock
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    for (const item of newInvoice.items) {
      const prodIndex = products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        const deductQty = item.unit === 'sqft' ? Math.ceil(item.sqft || item.qty) : item.qty;
        products[prodIndex].stockQty = Math.max(0, products[prodIndex].stockQty - deductQty);
      }
    }
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // Update customer due if applicable
    if (newInvoice.dueAmount > 0) {
      const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      let cust = customers.find((c) => c.mobile === newInvoice.customerMobile);
      if (!cust && newInvoice.customerName) {
        cust = {
          id: `cust_${Date.now()}`,
          storeId: newInvoice.storeId,
          name: newInvoice.customerName,
          type: newInvoice.customerType,
          mobile: newInvoice.customerMobile,
          address: newInvoice.customerAddress,
          totalDue: 0,
        };
        customers.push(cust);
      }
      if (cust) {
        cust.totalDue += newInvoice.dueAmount;
        newInvoice.customerId = cust.id;
      }
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    allInvoices.unshift(newInvoice);
    setStored(STORAGE_KEYS.INVOICES, allInvoices);

    // Log transaction with double-entry accounting
    if (newInvoice.paidAmount > 0) {
      const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      const paymentMethod = newInvoice.paymentMethod || 'cash';
      transactions.unshift({
        id: `tx_${Date.now()}_sale`,
        storeId: newInvoice.storeId,
        customerId: newInvoice.customerId || 'cust_guest',
        customerName: newInvoice.customerName,
        invoiceNo: newInvoice.invoiceNo,
        amount: newInvoice.paidAmount,
        type: 'payment',
        paymentMethod,
        date: newInvoice.createdAt,
        note: `বিক্রি মেমো #${newInvoice.invoiceNo} নগদ জমা`,
        createdBy: newInvoice.createdByName || 'Cash Counter',
        debitAccount: paymentMethod === 'bank' ? 'Bank' : 'Cash',
        creditAccount: 'Sales Account',
      });
      setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

      // Detailed Payment Notification (Customer, Invoice, Payment Type, Amount, Received By, Date)
      addPaymentNotification(newInvoice.storeId, {
        customerName: newInvoice.customerName,
        invoiceNo: newInvoice.invoiceNo,
        paymentType: 'New Sale Payment',
        amount: newInvoice.paidAmount,
        receivedBy: newInvoice.createdByName || 'Cash Counter',
        date: new Date(newInvoice.createdAt).toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        paymentMethod,
      });
    }

    addNotification(
      newInvoice.storeId,
      'নতুন বিক্রি ইনভয়েস তৈরি (Sale)',
      `মেমো #${newInvoice.invoiceNo} (${newInvoice.customerName}) | মোট: ৳${newInvoice.grandTotal}, জমা: ৳${newInvoice.paidAmount}, বাকি: ৳${newInvoice.dueAmount}`,
      'sale',
      {
        amount: newInvoice.grandTotal,
        customerName: newInvoice.customerName,
        invoiceNo: newInvoice.invoiceNo,
      }
    );

    return newInvoice;
  },

  async deleteInvoice(id: string): Promise<void> {
    let all = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    all = all.filter((i) => i.id !== id);
    setStored(STORAGE_KEYS.INVOICES, all);
  },

  // TRANSACTIONS (/api/transactions)
  async getTransactions(storeId: string): Promise<Transaction[]> {
    if (!storeId) return [];
    const all = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return all.filter((tx) => tx.storeId === storeId);
  },

  // CUSTOMERS (/api/customers)
  async getCustomers(storeId: string): Promise<Customer[]> {
    if (!storeId) return [];
    const all = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    return all.filter((c) => c.storeId === storeId);
  },

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const newCustomer: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
    };
    customers.unshift(newCustomer);
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  async collectCustomerDue(
    storeId: string,
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | string = 'cash',
    note?: string,
    receivedByName?: string
  ): Promise<Customer> {
    const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const index = customers.findIndex((c) => c.id === customerId);
    if (index === -1) throw new Error('Customer not found');

    customers[index].totalDue = Math.max(0, customers[index].totalDue - amount);
    setStored(STORAGE_KEYS.CUSTOMERS, customers);

    const txDate = new Date().toISOString();

    // Add transaction to ledger with double-entry accounting
    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const referenceInvoice = note && (note.includes('TG-') || note.includes('INV')) ? note : undefined;
    
    transactions.unshift({
      id: `tx_${Date.now()}_due`,
      storeId,
      customerId,
      customerName: customers[index].name,
      invoiceNo: referenceInvoice,
      amount,
      type: 'due_collection',
      paymentMethod,
      date: txDate,
      note: note || 'বকেয়া খাতা আদায়',
      createdBy: receivedByName || 'Cash Counter',
      debitAccount: paymentMethod === 'bank' ? 'Bank' : 'Cash',
      creditAccount: 'Customer Due',
    });
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

    // Detailed Payment Notification (Customer, Invoice, Payment Type, Amount, Received By, Date)
    addPaymentNotification(storeId, {
      customerName: customers[index].name,
      invoiceNo: referenceInvoice || 'Due Collection',
      paymentType: 'Due Payment',
      amount,
      receivedBy: receivedByName || 'Cash Counter',
      date: new Date(txDate).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      paymentMethod,
    });

    return customers[index];
  },

  // STOCK ARRIVALS (/api/stock-arrivals)
  async getStockArrivals(storeId: string): Promise<StockArrival[]> {
    if (!storeId) return [];
    const all = getStored<StockArrival[]>(STORAGE_KEYS.STOCK_ARRIVALS, INITIAL_STOCK_ARRIVALS);
    return all.filter((a) => a.storeId === storeId);
  },

  async createStockArrival(data: Omit<StockArrival, 'id'>): Promise<StockArrival> {
    const arrivals = getStored<StockArrival[]>(STORAGE_KEYS.STOCK_ARRIVALS, INITIAL_STOCK_ARRIVALS);
    const newArrival: StockArrival = {
      ...data,
      id: `arr_${Date.now()}`,
    };
    arrivals.unshift(newArrival);
    setStored(STORAGE_KEYS.STOCK_ARRIVALS, arrivals);

    // Add stock to product inventory
    const products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const index = products.findIndex((p) => p.id === data.productId);
    if (index !== -1) {
      products[index].stockQty += data.receivedQty;
      // Optionally update buying price
      if (data.unitCost > 0) {
        products[index].buyingPrice = data.unitCost;
      }
      setStored(STORAGE_KEYS.PRODUCTS, products);
    }

    // Record Product Purchase Transaction in Ledger (Double-entry: Debit Inventory, Credit Cash/Supplier)
    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    transactions.unshift({
      id: `tx_${Date.now()}_purchase`,
      storeId: newArrival.storeId,
      customerName: newArrival.supplierName || 'মহাজন / সরবরাহকারী',
      amount: newArrival.totalCost,
      type: 'purchase',
      paymentMethod: 'cash',
      date: newArrival.date ? new Date(newArrival.date).toISOString() : new Date().toISOString(),
      note: `পণ্য ক্রয়: ${newArrival.productName} (${newArrival.receivedQty} পিস)`,
      createdBy: 'Inventory Manager',
      debitAccount: 'Inventory',
      creditAccount: 'Cash/Supplier',
    });
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

    addNotification(
      data.storeId,
      'নতুন স্টক আগমন (Input)',
      `${data.productName} - পরিমাণ: ${data.receivedQty} | সরবরাহকারী: ${data.supplierName} | খরচ: ৳${data.totalCost}`,
      'stock',
      {
        productName: data.productName,
        qty: data.receivedQty,
        amount: data.totalCost,
      }
    );

    return newArrival;
  },

  // EXPENSES (/api/expenses)
  async getExpenses(storeId: string): Promise<Expense[]> {
    if (!storeId) return [];
    const all = getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    return all.filter((e) => e.storeId === storeId);
  },

  async createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const expenses = getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const newExpense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    setStored(STORAGE_KEYS.EXPENSES, expenses);

    // Record Expense Transaction in Ledger (Double-entry: Debit Operating Expense, Credit Cash)
    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    transactions.unshift({
      id: `tx_${Date.now()}_exp`,
      storeId: newExpense.storeId,
      customerName: 'পরিচালন ব্যয়',
      amount: newExpense.amount,
      type: 'expense',
      paymentMethod: 'cash',
      date: newExpense.date ? new Date(newExpense.date).toISOString() : new Date().toISOString(),
      note: `খরচ: ${newExpense.description} (${newExpense.type})`,
      createdBy: 'Accounts',
      debitAccount: 'Operating Expense',
      creditAccount: 'Cash',
    });
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

    addNotification(
      data.storeId,
      'নতুন পরিচালন ব্যয় (Output)',
      `খাত: ${(data.type || '').toUpperCase()} | পরিমাণ: ৳${data.amount} | বিবরণ: ${data.description}`,
      'expense',
      {
        amount: data.amount,
        category: data.type,
      }
    );

    return newExpense;
  },

  async recordAdvancePayment(
    storeId: string,
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | string = 'cash',
    note?: string,
    receivedByName?: string
  ): Promise<Transaction> {
    const customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer ? customer.name : 'অগ্রিম প্রদানকারী গ্রাহক';
    const txDate = new Date().toISOString();

    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const newTx: Transaction = {
      id: `tx_${Date.now()}_adv`,
      storeId,
      customerId,
      customerName,
      amount,
      type: 'advance',
      paymentMethod,
      date: txDate,
      note: note || 'গ্রাহকের অগ্রিম জমা',
      createdBy: receivedByName || 'Cash Counter',
      debitAccount: paymentMethod === 'bank' ? 'Bank' : 'Cash',
      creditAccount: 'Customer Advance',
    };
    transactions.unshift(newTx);
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);

    addPaymentNotification(storeId, {
      customerName,
      invoiceNo: 'Advance Payment',
      paymentType: 'Advance Payment',
      amount,
      receivedBy: receivedByName || 'Cash Counter',
      date: new Date(txDate).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      paymentMethod,
    });

    return newTx;
  },

  async deleteExpense(id: string): Promise<void> {
    let expenses = getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    expenses = expenses.filter((e) => e.id !== id);
    setStored(STORAGE_KEYS.EXPENSES, expenses);
  },

  // BACKUP & RESET (/api/database)
  async exportFullBackup(storeId: string) {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      storeId,
      products: await this.getProducts(storeId),
      invoices: await this.getInvoices(storeId),
      customers: await this.getCustomers(storeId),
      stockArrivals: await this.getStockArrivals(storeId),
      expenses: await this.getExpenses(storeId),
    };
    return data;
  },

  async restoreFullBackup(backupObj: any, storeId: string) {
    if (!backupObj || typeof backupObj !== 'object') {
      throw new Error('Invalid JSON backup file');
    }
    if (backupObj.products) setStored(STORAGE_KEYS.PRODUCTS, backupObj.products);
    if (backupObj.invoices) setStored(STORAGE_KEYS.INVOICES, backupObj.invoices);
    if (backupObj.customers) setStored(STORAGE_KEYS.CUSTOMERS, backupObj.customers);
    if (backupObj.stockArrivals) setStored(STORAGE_KEYS.STOCK_ARRIVALS, backupObj.stockArrivals);
    if (backupObj.expenses) setStored(STORAGE_KEYS.EXPENSES, backupObj.expenses);
    return true;
  },

  async resetAllStoreData(storeId: string) {
    if (!storeId) return;
    let products = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    let invoices = getStored<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    let customers = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    let arrivals = getStored<StockArrival[]>(STORAGE_KEYS.STOCK_ARRIVALS, INITIAL_STOCK_ARRIVALS);
    let expenses = getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    let transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);

    products = products.filter((p) => p.storeId !== storeId);
    invoices = invoices.filter((i) => i.storeId !== storeId);
    customers = customers.filter((c) => c.storeId !== storeId);
    arrivals = arrivals.filter((a) => a.storeId !== storeId);
    expenses = expenses.filter((e) => e.storeId !== storeId);
    transactions = transactions.filter((t) => t.storeId !== storeId);

    setStored(STORAGE_KEYS.PRODUCTS, products);
    setStored(STORAGE_KEYS.INVOICES, invoices);
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    setStored(STORAGE_KEYS.STOCK_ARRIVALS, arrivals);
    setStored(STORAGE_KEYS.EXPENSES, expenses);
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
};
