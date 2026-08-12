import { AutoReportSnapshot } from '../types';
import { api } from './api';

const AUTO_SNAPSHOTS_KEY = 'thai_pos_auto_snapshots_v1';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const autoReportService = {
  /**
   * Get all stored snapshots from LocalStorage
   */
  getSnapshots(storeId?: string): AutoReportSnapshot[] {
    try {
      const raw = localStorage.getItem(AUTO_SNAPSHOTS_KEY);
      if (!raw) return [];
      const snapshots: AutoReportSnapshot[] = JSON.parse(raw);
      if (storeId) {
        return snapshots.filter((s) => s.storeId === storeId);
      }
      return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      console.error('Failed to parse auto report snapshots:', e);
      return [];
    }
  },

  /**
   * Generate a new 12-hour financial report snapshot for a specific store
   */
  async generateSnapshot(storeId: string, storeName: string): Promise<AutoReportSnapshot> {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - TWELVE_HOURS_MS);

    // Fetch invoices and expenses
    const invoices = await api.getInvoices(storeId);
    const expenses = await api.getExpenses(storeId);
    const transactions = await api.getTransactions(storeId);

    // Filter for the last 12-hour window
    const recentInvoices = invoices.filter((inv) => new Date(inv.createdAt) >= twelveHoursAgo);
    const recentExpenses = expenses.filter((exp) => new Date(exp.date) >= twelveHoursAgo);
    const recentTransactions = transactions.filter((tx) => new Date(tx.date) >= twelveHoursAgo);

    let totalRevenue = 0;
    let totalCost = 0;
    let newDueAmount = 0;

    recentInvoices.forEach((inv) => {
      totalRevenue += inv.paidAmount || 0;
      newDueAmount += inv.dueAmount || 0;

      // Calculate estimated cost of items
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const qty = item.unit === 'sqft' ? (item.sqft || item.qty) : item.qty;
          totalCost += Math.round((item.rate * 0.7) * (qty || 1));
        });
      }
    });


    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const dueCollected = recentTransactions
      .filter((tx) => tx.type === 'due_collection')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses + dueCollected;

    const formattedTime = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });

    const snapshot: AutoReportSnapshot = {
      id: 'snap_' + Date.now(),
      storeId,
      storeName,
      periodLabel: `১২-ঘণ্টার ব্যাকআপ (${formattedDate} ${formattedTime})`,
      timestamp: now.toISOString(),
      startTime: twelveHoursAgo.toISOString(),
      endTime: now.toISOString(),
      totalSalesCount: recentInvoices.length,
      totalRevenue,
      totalCost,
      netProfit,
      totalExpenses,
      dueCollected,
      newDueAmount,
      newInvoicesCount: recentInvoices.length,
      newExpensesCount: recentExpenses.length,
      summaryText: `মেমো: ${recentInvoices.length} টি, ক্যাশ ইন: ৳${totalRevenue.toLocaleString('en-BD')}, খরচ: ৳${totalExpenses.toLocaleString('en-BD')}, নিট লাভ: ৳${netProfit.toLocaleString('en-BD')}`,
    };

    // Save to LocalStorage
    const existing = this.getSnapshots();
    const updated = [snapshot, ...existing];
    localStorage.setItem(AUTO_SNAPSHOTS_KEY, JSON.stringify(updated));

    return snapshot;
  },

  /**
   * Check if 12 hours have passed since last snapshot for this store.
   * If yes, automatically trigger and generate a new snapshot.
   */
  async checkAndRunAutoSnapshot(storeId: string, storeName: string): Promise<AutoReportSnapshot | null> {
    const snapshots = this.getSnapshots(storeId);
    const latest = snapshots[0];

    const now = Date.now();
    if (!latest || now - new Date(latest.timestamp).getTime() >= TWELVE_HOURS_MS) {
      return await this.generateSnapshot(storeId, storeName);
    }

    return null;
  },

  /**
   * Export a snapshot to downloadable CSV file
   */
  exportToCSV(snapshot: AutoReportSnapshot): void {
    const csvRows = [
      ['Thai Glass POS - 12-Hour Accounting Auto Report'],
      ['Store Name', snapshot.storeName],
      ['Snapshot Period', snapshot.periodLabel],
      ['Generated At', new Date(snapshot.timestamp).toLocaleString()],
      [],
      ['Metric Name', 'Value (BDT / Count)'],
      ['New Invoices Created', snapshot.newInvoicesCount],
      ['Total Cash Received (Sales)', snapshot.totalRevenue],
      ['New Due Amount', snapshot.newDueAmount],
      ['Due Collected', snapshot.dueCollected],
      ['Total Cost of Goods', snapshot.totalCost],
      ['Total Operating Expenses', snapshot.totalExpenses],
      ['Net Estimated Profit', snapshot.netProfit],
      ['Summary', snapshot.summaryText],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `12hr_report_${snapshot.storeName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Delete a snapshot from archive
   */
  deleteSnapshot(snapshotId: string): void {
    const existing = this.getSnapshots();
    const filtered = existing.filter((s) => s.id !== snapshotId);
    localStorage.setItem(AUTO_SNAPSHOTS_KEY, JSON.stringify(filtered));
  },
};
