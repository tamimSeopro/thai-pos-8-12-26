import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Users,
  Search,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  History,
  Phone,
  MapPin,
  Send,
  Clock,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Customer, Invoice, Transaction } from '../../types';
import { api } from '../../lib/api';
import { usePermissions } from '../../context/PermissionsContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { fmtNum, fmtDate } from '../../lib/formatters';
import { SingleInvoiceModal } from '../common/SingleInvoiceModal';

export const DueLedgerScreen: React.FC = () => {
  const { activeStoreId, activeStoreName, permissions } = usePermissions();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Collection Form state
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pagination for transaction ledger (20 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadData = async () => {
    try {
      const [custs, invs, txs] = await Promise.all([
        api.getCustomers(activeStoreId),
        api.getInvoices(activeStoreId),
        api.getTransactions(activeStoreId),
      ]);
      setCustomers(custs);
      setInvoices(invs);
      setTransactions(txs);
      if (custs.length > 0 && !selectedCustomerId) {
        // Select first customer with dues if available
        const dueCust = custs.find((c) => c.totalDue > 0) || custs[0];
        setSelectedCustomerId(dueCust.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStoreId]);

  const dueCustomers = customers.filter(
    (c) =>
      c.totalDue > 0 &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile.includes(searchQuery))
  );

  const totalOutstandingDue = customers.reduce((acc, c) => acc + c.totalDue, 0);
  const dueCustomerCount = customers.filter((c) => c.totalDue > 0).length;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedCustomerInvoices = invoices.filter(
    (inv) => inv.customerMobile === selectedCustomer?.mobile || inv.customerId === selectedCustomer?.id
  );

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || collectAmount <= 0) return;

    try {
      await api.collectCustomerDue(
        activeStoreId,
        selectedCustomer.id,
        collectAmount,
        paymentMethod,
        note
      );

      setSuccessMsg(`৳${collectAmount} বকেয়া কালেকশন জমাকৃত হয়েছে!`);
      setCollectAmount(0);
      setNote('');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-950/40 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <BookOpen className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100">{t('dueLedgerTitle')}</h2>
          <p className="text-xs text-slate-400">গ্রাহকদের বাকি পাওনা হিসাব ও অনলাইন/ক্যাশ আদায়</p>
        </div>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title={t('statTotalDueStatus')}
          value={`৳ ${fmtNum(totalOutstandingDue)}`}
          subtitle="সর্বমোট অনাদায়ী বকেয়া টাকা"
          icon={AlertTriangle}
          variant="rose"
        />

        <StatCard
          title={t('statDueCustomerCount')}
          value={`${dueCustomerCount} জন`}
          subtitle="বর্তমানে বকেয়া থাকা গ্রাহকের সংখ্যা"
          icon={Users}
          variant="emerald"
        />
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Due Customers Searchable List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">{t('dueCustomerList')}</h3>
            <span className="text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
              {dueCustomers.length} জন বাকিদার
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchCustomer')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {dueCustomers.length === 0 ? (
            <EmptyState
              title={t('noDueCustomers')}
              description="বর্তমানে কোনো গ্রাহকের কাছে বকেয়া পাওনা নেই।"
            />
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {dueCustomers.map((cust) => {
                const isSelected = selectedCustomerId === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-100">{cust.name}</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {cust.type === 'dealer' ? 'ডিলার' : 'খুচরা'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{cust.mobile}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-rose-400">
                        ৳ {fmtNum(cust.totalDue)}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">বাকি টাকা</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Selected Customer Ledger & Collection Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-6">
          {!selectedCustomer ? (
            <EmptyState title={t('selectCustomerPrompt')} description="বামপাশের খাতার তালিকা থেকে একজন গ্রাহক নির্বাচন করুন।" />
          ) : (
            <>
              {/* Customer Header Info */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{selectedCustomer.name}</h3>
                    <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-medium">
                      {selectedCustomer.type === 'dealer' ? 'ডিলার একাউন্ট' : 'খুচরা ক্রেতা'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {selectedCustomer.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {selectedCustomer.address}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">মোট বকেয়া পাওনা:</p>
                  <p className="text-xl font-mono font-bold text-rose-400">
                    ৳ {fmtNum(selectedCustomer.totalDue)}
                  </p>
                </div>
              </div>

              {/* Quick Collect Due Form */}
              <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>{t('dueCollectionFormTitle')}</span>
                </h4>

                <form onSubmit={handleCollectDue} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t('collectAmount')}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedCustomer.totalDue}
                      value={collectAmount || ''}
                      onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                      placeholder="টাকার পরিমাণ"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t('paymentMethod')}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="cash">{t('cash')}</option>
                      <option value="bkash">{t('bkash')}</option>
                      <option value="nagad">{t('nagad')}</option>
                      <option value="bank">{t('bank')}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t('noteOptional')}
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="যেমন: ক্যাশ আদায় জমা"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('btnCollectDueSubmit')}</span>
                  </button>
                </form>
              </div>

              {/* Due Payment History with Exact Date & Time */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>আদায়কৃত বকেয়ার সময়ভিত্তিক লগ (Date & Time Payment Log)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    তারিখ ও নিখুঁত সময়সহ
                  </span>
                </h4>

                {(() => {
                  const customerTxs = transactions.filter(
                    (tx) => tx.customerId === selectedCustomer.id || tx.customerName === selectedCustomer.name
                  );

                  if (customerTxs.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        এই গ্রাহকের এখনো কোনো বকেয়া আদায়ের ট্রানজাকশন লগ নেই।
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {customerTxs.map((tx) => {
                        const formattedDateTime = fmtDate(tx.date, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });

                        return (
                          <div
                            key={tx.id}
                            className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                                  {tx.paymentMethod}
                                </span>
                                <span className="text-slate-300 font-semibold">{tx.note || 'বকেয়া আদায়'}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{formattedDateTime}</span>
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-mono font-bold text-emerald-400 text-sm">
                                + ৳ {fmtNum(tx.amount)}
                              </p>
                              <span className="text-[10px] text-slate-500">জমা হয়েছে</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Invoice History */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-sky-400" />
                  <span>{t('invoiceHistory')}</span>
                </h4>

                {selectedCustomerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">এই গ্রাহকের কোনো ইনভয়েস ইতিহাস নেই।</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {selectedCustomerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-3 bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">{inv.invoiceNo}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {fmtDate(inv.createdAt, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            মোট: ৳{fmtNum(inv.grandTotal)} | জমা: ৳{fmtNum(inv.paidAmount)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-bold text-rose-400">
                            বাকি: ৳{fmtNum(inv.dueAmount)}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              inv.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {inv.paymentStatus === 'paid' ? 'পরিশোধিত' : 'বাকি আছে'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Full-Width Table: Real-Time All Due Payment Transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-slate-950/40 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                সকল গ্রাহকের আদায়কৃত বকেয়ার সময়ভিত্তিক তালিকা (All Due Collection History)
              </h3>
              <p className="text-xs text-slate-400">
                প্রতিটি পেমেন্ট জমার সঠিক তারিখ, সময়, মাধ্যম ও নোট
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            মোট {transactions.length} টি পেমেন্ট
          </span>
        </div>

        {transactions.length === 0 ? (
          <EmptyState title="কোনো পেমেন্ট পাওয়া যায়নি" description="এখনো পর্যন্ত কোনো বকেয়া আদায় করা হয়নি।" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider bg-slate-950/40">
                  <th className="p-3">তারিখ ও সময় (Time)</th>
                  <th className="p-3">গ্রাহকের নাম</th>
                  <th className="p-3">ইনভয়েস / রেফারেন্স</th>
                  <th className="p-3">পেমেন্ট মেথড</th>
                  <th className="p-3 text-right">আদায়কৃত টাকা</th>
                  <th className="p-3">নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
                  const startIndex = (currentPage - 1) * PAGE_SIZE;
                  const paginatedTransactions = transactions.slice(startIndex, startIndex + PAGE_SIZE);

                  return paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-950/40 transition">
                      <td className="p-3 font-mono text-amber-300 font-medium">
                        {fmtDate(tx.date, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-bold text-slate-200">{tx.customerName}</td>
                      <td className="p-3 font-mono text-emerald-400">{tx.invoiceNo || 'বকেয়া খাতা আদায়'}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        ৳ {fmtNum(tx.amount)}
                      </td>
                      <td className="p-3 text-slate-400 italic">{tx.note || '-'}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {transactions.length > PAGE_SIZE && (
              <div className="flex items-center justify-between p-3 border-t border-slate-800 bg-slate-950/40">
                <p className="text-xs text-slate-400">
                  পৃষ্ঠা <span className="font-bold text-slate-200">{fmtNum(currentPage)}</span> এর{' '}
                  <span className="font-bold text-slate-200">
                    {fmtNum(Math.max(1, Math.ceil(transactions.length / PAGE_SIZE)))}
                  </span>{' '}
                  (মোট {fmtNum(transactions.length)} টি রেকর্ড, প্রতি পৃষ্ঠায় ২০ টি)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>পূর্ববর্তী</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(Math.ceil(transactions.length / PAGE_SIZE), p + 1)
                      )
                    }
                    disabled={currentPage >= Math.ceil(transactions.length / PAGE_SIZE)}
                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 transition"
                  >
                    <span>পরবর্তী</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SingleInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        activeStoreName={activeStoreName}
        activeStoreId={activeStoreId}
      />
    </div>
  );
};
