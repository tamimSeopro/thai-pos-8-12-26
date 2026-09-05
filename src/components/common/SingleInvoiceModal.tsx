import React, { useState, useEffect } from 'react';
import { Invoice, Store } from '../../types';
import { Receipt, FileText, Printer, X } from 'lucide-react';
import { downloadElementAsPDF, printElementDirectly } from '../../lib/pdfHelper';
import { api } from '../../lib/api';

interface SingleInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  activeStoreName?: string;
  activeStoreId?: string;
}

export const SingleInvoiceModal: React.FC<SingleInvoiceModalProps> = ({
  invoice,
  onClose,
  activeStoreName,
  activeStoreId,
}) => {
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!invoice || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadElementAsPDF('printable-single-invoice', `Invoice_Memo_${invoice.invoiceNo}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (!invoice) return;

    let isMounted = true;
    api.getStores().then((stores) => {
      if (!isMounted) return;
      const targetStoreId = invoice.storeId || activeStoreId;
      const found = stores.find((s) => s.id === targetStoreId);
      if (found) {
        setStoreInfo(found);
      }
    }).catch((err) => console.error('Error fetching store info for invoice:', err));

    return () => {
      isMounted = false;
    };
  }, [invoice, activeStoreId]);

  if (!invoice) return null;

  const fmtDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const fmtNum = (num?: number) => {
    return (num || 0).toLocaleString('bn-BD');
  };

  // Payment Method Display Logic
  const getPaymentMethodDisplay = () => {
    if (invoice.paymentMethod && invoice.paymentMethod.trim() !== '') {
      const pm = invoice.paymentMethod.toLowerCase();
      if (pm.includes('cash') || pm.includes('নগদ')) return 'নগদ / ক্যাশ (Cash)';
      if (pm.includes('bkash') || pm.includes('বিকাশ')) return 'বিকাশ / মোবাইল ব্যাংকিং';
      if (pm.includes('bank') || pm.includes('ব্যাংক')) return 'ব্যাংক ট্র্যান্সফার (Bank)';
      if (pm.includes('card') || pm.includes('কার্ড')) return 'কার্ড পেমেন্ট (Card)';
      return invoice.paymentMethod;
    }

    // Fallback based on paid amount
    if (invoice.paidAmount >= invoice.grandTotal) {
      return 'নগদ / ক্যাশ (Cash)';
    } else if (invoice.paidAmount > 0) {
      return 'আংশিক নগদ (Partial Cash)';
    } else {
      return 'বকেয়া / ক্রেডিট (Due)';
    }
  };

  const cleanAddress = (addr?: string) => {
    if (!addr || addr.trim() === '' || addr === 'N/A') return 'N/A';
    let clean = addr.trim();
    // Strip leading "address:" or "ঠিকানা:" case-insensitively to prevent double labels
    clean = clean.replace(/^(address|ঠিকানা)\s*:\s*/i, '');
    return clean || 'N/A';
  };

  const subtotalVal = invoice.subtotal ?? (invoice as any).subTotal ?? invoice.grandTotal;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header Bar (no-print) */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  ইনভয়েস মেমো: #{invoice.invoiceNo}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : invoice.paymentStatus === 'partial'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {invoice.paymentStatus === 'paid'
                    ? 'পরিশোধিত'
                    : invoice.paymentStatus === 'partial'
                    ? 'আংশিক পরিশোধিত'
                    : 'বকেয়া'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                ইস্যুর সময়: {fmtDate(invoice.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPDF}
              className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
              title="Download / Save as PDF"
            >
              <FileText className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'ডাউনলোড পিডিএফ (Download PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => printElementDirectly('printable-single-invoice', `Invoice_Memo_${invoice.invoiceNo}`)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন (Print Now)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
              title="Close Modal (Esc)"
            >
              <X className="w-4 h-4" />
              <span>বন্ধ করুন (Close)</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div
          id="printable-single-invoice"
          className="p-6 bg-slate-900 printable-invoice text-slate-100 space-y-5 text-xs font-sans"
        >
          {/* 1. STORE HEADER */}
          <div className="text-center pb-2 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 print:text-slate-900 tracking-tight">
              {storeInfo?.name || activeStoreName || 'মেসার্স করিম থাই গ্লাস এন্ড অ্যালুমিনিয়াম'}
            </h2>
            <p className="text-xs text-slate-300 print:text-slate-800 font-semibold">
              থাই গ্লাস, অ্যালুমিনিয়াম প্রফাইল ও ডোর ফিটিংস পাইকারি ও খুচরা বিক্রেতা
            </p>
            <p className="text-xs text-slate-300 print:text-slate-800 font-medium">
              ঠিকানা: {storeInfo?.address || 'নয়া বাজার, গুলশান, ঢাকা'} | মোবাইল: {storeInfo?.phone || '০১৭১১২২৩৩৪৪'}
            </p>
          </div>

          <div className="border-b-2 border-slate-700 print:border-slate-800 my-2"></div>

          {/* 2. INVOICE META & CUSTOMER DETAILS BOX */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs print:bg-slate-50 print:border-slate-300">
            <div className="space-y-1 text-slate-200 print:text-slate-800">
              <p className="flex items-center gap-1.5 flex-wrap">
                <strong className="text-slate-400 print:text-slate-900 font-bold shrink-0">গ্রাহকের নাম:</strong>
                <span className="font-bold text-slate-100 print:text-slate-900">{invoice.customerName}</span>
              </p>
              <p className="flex items-center gap-1.5 flex-wrap">
                <strong className="text-slate-400 print:text-slate-900 font-bold shrink-0">মোবাইল:</strong>
                <span className="font-mono text-slate-200 print:text-slate-900 font-semibold">{invoice.customerMobile}</span>
                <span className="text-slate-500">|</span>
                <strong className="text-slate-400 print:text-slate-900 font-bold shrink-0">ধরন:</strong>
                <span className="font-semibold">{invoice.customerType === 'dealer' ? 'ডিলার' : 'খুচরা'}</span>
              </p>
              <p className="flex items-start gap-1.5">
                <strong className="text-slate-400 print:text-slate-900 font-bold shrink-0">ঠিকানা:</strong>
                <span className="text-slate-200 print:text-slate-900">{cleanAddress(invoice.customerAddress)}</span>
              </p>
            </div>

            <div className="space-y-1 text-right text-slate-200 print:text-slate-800">
              <p>
                <strong className="text-slate-400 print:text-slate-900 font-bold">ইনভয়েস নম্বর:</strong>{' '}
                <span className="font-mono font-bold text-slate-100 print:text-slate-900">{invoice.invoiceNo}</span>
              </p>
              <p>
                <strong className="text-slate-400 print:text-slate-900 font-bold">তারিখ ও সময়:</strong>{' '}
                <span className="font-mono text-xs">{fmtDate(invoice.createdAt)}</span>
              </p>
              <p>
                <strong className="text-slate-400 print:text-slate-900 font-bold">পেমেন্ট:</strong>{' '}
                <span className="font-bold text-emerald-400 print:text-emerald-700">
                  {invoice.paymentStatus === 'paid' ? 'পরিশোধিত' : invoice.paymentStatus === 'partial' ? 'আংশিক পরিশোধিত' : 'বকেয়া'}
                </span>
                {invoice.paymentMethod ? ` (${invoice.paymentMethod})` : ''}
              </p>
            </div>
          </div>

          {/* 3. ITEMS PURCHASED TABLE */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 print:text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>পণ্যসমূহের তালিকা (PURCHASED ITEMS LIST)</span>
              <span className="text-[10px] text-slate-400 print:text-slate-600 font-normal">
                মোট পণ্য: {invoice.items?.length || 0} টি
              </span>
            </h4>

            <div className="overflow-x-auto border border-slate-700 rounded-xl print:border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 print:bg-slate-100 font-bold text-[10px]">
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-center w-12 text-slate-400 print:text-slate-800">ক্রঃ নং</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-800">পণ্যের নাম</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-center text-slate-400 print:text-slate-800">ইউনিট</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-center text-slate-400 print:text-slate-800">সাইজ / পরিমাণ</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-800">একক দর (৳)</th>
                    <th className="p-2 border border-slate-800 print:border-slate-300 text-right text-slate-400 print:text-slate-800">মোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {(invoice.items || []).map((item: any, idx: number) => {
                    const productName = item.productNameBn || item.productNameEn || item.productName || item.name || 'পণ্য';
                    const unitStr = item.unit || (item.sqft || item.squareFeet ? 'sqft' : 'pcs');
                    const rateVal = item.rate ?? item.unitPrice ?? 0;
                    const totalVal = item.total ?? item.totalPrice ?? 0;
                    const qtyVal = item.qty ?? item.quantity ?? 1;
                    const sqftVal = item.sqft ?? item.squareFeet;

                    let qtyDisplay = `${qtyVal} ${unitStr === 'sqft' ? 'টি' : unitStr}`;
                    if (item.heightInches && item.widthInches) {
                      const calculatedSqft = sqftVal || Number(((item.heightInches * item.widthInches * qtyVal) / 144).toFixed(2));
                      qtyDisplay = `${item.heightInches}"×${item.widthInches}" (${calculatedSqft} SqFt)`;
                    } else if (sqftVal && sqftVal > 0) {
                      qtyDisplay = `${sqftVal} SqFt`;
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-950/40 print:hover:bg-transparent">
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 text-center font-mono text-slate-400 print:text-slate-700 font-semibold">
                          {(idx + 1).toLocaleString('bn-BD')}
                        </td>
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 font-medium text-slate-200 print:text-slate-900">{productName}</td>
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 text-center font-mono font-bold text-emerald-400 print:text-slate-800 text-[10px] uppercase">
                          {unitStr}
                        </td>
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 text-center font-mono text-slate-300 print:text-slate-800">
                          {qtyDisplay}
                        </td>
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 text-right font-mono text-slate-300 print:text-slate-800">
                          ৳ {fmtNum(rateVal)}
                        </td>
                        <td className="p-2 border border-slate-800/80 print:border-slate-300 text-right font-mono font-bold text-emerald-400 print:text-slate-900">
                          ৳ {fmtNum(totalVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. FINANCIAL TOTALS SUMMARY */}
          <div className="flex justify-end pt-1">
            <div className="w-full sm:w-72 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 text-xs print:bg-slate-50 print:border-slate-300">
              <div className="flex justify-between text-slate-300 print:text-slate-800">
                <span>সাব-টোটাল (Subtotal):</span>
                <span className="font-mono font-bold">৳ {fmtNum(subtotalVal)}</span>
              </div>
              {(invoice.discount ?? 0) > 0 && (
                <div className="flex justify-between text-amber-400 print:text-slate-800">
                  <span>ডিসকাউন্ট (Discount):</span>
                  <span className="font-mono font-bold">- ৳ {fmtNum(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-100 print:text-slate-900 pt-1.5 border-t border-slate-800/80 print:border-slate-300">
                <span>সর্বমোট বিল (Grand Total):</span>
                <span className="font-mono text-emerald-400 print:text-slate-900 font-black">৳ {fmtNum(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 print:text-slate-800">
                <span>নগদ পরিশোধিত (Paid Amount):</span>
                <span className="font-mono font-bold">৳ {fmtNum(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-400 print:text-slate-900 font-bold">
                <span>অবশিষ্ট বাকি (Due Amount):</span>
                <span className="font-mono">৳ {fmtNum(invoice.dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* 5. SIGNATURE SECTION (1 AUTHORIZED SIGNATURE) */}
          <div className="pt-12 pb-2 flex justify-end">
            <div className="text-center w-48 space-y-1">
              <div className="border-t-2 border-dashed border-slate-600 print:border-slate-800 w-full mb-1.5"></div>
              <p className="font-bold text-slate-100 print:text-slate-900 text-xs leading-normal">
                অনুমোদিত স্বাক্ষর
              </p>
              <p className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
                (Authorized Signature)
              </p>
            </div>
          </div>

          {/* 6. FOOTER NOTE */}
          <div className="pt-2 border-t border-slate-800 print:border-slate-300 text-center text-[10px] text-slate-400 print:text-slate-500 space-y-0.5">
            <p>ধন্যবাদ! আবার আসবেন। ক্রয়ে কোনো পরিবর্তন করতে মূল মেমো সঙ্গে রাখুন।</p>
            <p className="font-mono text-[9px] text-slate-500">Software by Thai Glass POS Systems</p>
          </div>
        </div>

        {/* Bottom Modal Footer (no-print) */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPDF}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'পিডিএফ তৈরি হচ্ছে...' : 'ডাউনলোড পিডিএফ (Download PDF)'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-rose-600 text-slate-100 hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer border border-slate-600 hover:border-rose-500"
          >
            <X className="w-4 h-4" />
            <span>বন্ধ করুন (Close)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
