"use client";

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useTheme } from '../context/ThemeContext';
import { useParams } from 'next/navigation';

interface Product {
  name: string;
  price: number;
}

type HullNumber = number;

interface CartItem {
  productId?: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  name?: string;
  price?: number;
  extraCost?: HullNumber;
  product?: Product;
}

type PaymentMethod = 'Cash' | 'Card' | 'QR';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

interface PaymentResult {
  changeDue?: number;
  [key: string]: unknown;
}

interface AlreadyPaidSummaryItem {
  itemName: string;
  quantity: number;
  method: string;
  total: number;
}

interface AlreadyPaidSummary {
  items: AlreadyPaidSummaryItem[];
  total: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount?: number;
  orderId?: string | null;
  ordersList?: any[] | null;
  cart?: CartItem[];
  orderType?: OrderType;
  tableId?: string | number | null;
  onPaymentComplete?: () => void;
  subtotalAmount?: number;
  customerName?: string;
  customerPhone?: string;
  // ── NEW — summary of payments already collected individually
  //    (via TableModal's per-item "Pay item" popup) BEFORE this
  //    modal was even opened. Without this, a table that's fully
  //    settled via item-level payments shows a receipt with
  //    Rs. 0.00 everywhere, since PaymentModal's own flow only
  //    ever sees the REMAINING balance — which is correctly zero,
  //    but tells us nothing about what was actually collected. ──
  alreadyPaidSummary?: AlreadyPaidSummary | null;
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount = 0,
  orderId = null,
  ordersList = null,
  cart = [],
  orderType = 'TAKEAWAY',
  tableId = null,
  onPaymentComplete,
  subtotalAmount = 0,
  customerName = '',
  customerPhone = '',
  alreadyPaidSummary = null,
}: PaymentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState<boolean>(false);


  const [taxRate, setTaxRate] = useState<number>(0);
  const [isTaxLoading, setIsTaxLoading] = useState<boolean>(true);

  const receiptRef = useRef<HTMLDivElement>(null);

  const cachedName = typeof window !== 'undefined' && tenantSlug ? localStorage.getItem(`org_name_${tenantSlug}`) : null;


  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function fetchTaxRate() {
      setIsTaxLoading(true);
      try {
        const outletId = typeof window !== 'undefined'
          ? localStorage.getItem("activeOutletId")
          : null;

        if (!outletId) {
          if (!cancelled) setTaxRate(0);
          return;
        }

        const res = await api.get(`/outlets/${outletId}`);
        const outlet = res.data.outlet;

        if (outlet && !cancelled) {
          const rate = outlet.taxEnabled
            ? Number(outlet.taxRate ?? 0)
            : 0;
          setTaxRate(rate);
        }
      } catch (err) {
        console.error("Failed to fetch outlet tax rate:", err);
        // fall back to 0 rather than a guessed hardcoded number —
        // safer to show "no tax" than to show a WRONG tax rate
        if (!cancelled) setTaxRate(0);
      } finally {
        if (!cancelled) setIsTaxLoading(false);
      }
    }

    fetchTaxRate();
    return () => { cancelled = true; };
  }, [isOpen]);


  const actualSubtotal = orderType === 'TAKEAWAY' ? subtotalAmount : totalAmount;
  const tax = Math.round(actualSubtotal * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.round((actualSubtotal + tax) * 100) / 100;

  // ── NEW — a DINE_IN table can arrive here with NOTHING left to
  //    charge, if every item on every order was already settled
  //    individually via partial payment. Without this check,
  //    handleConfirm falls through to "targetOrders.length === 0"
  //    and shows a confusing "No active order found" error —
  //    even though the table genuinely IS fully paid. This lets
  //    the modal show a receipt/confirmation instead of erroring. ──
  const alreadyFullySettled = orderType === 'DINE_IN' && grandTotal <= 0;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // ── nothing left to charge — skip straight to the receipt
      //    screen instead of calling any payment endpoint ──
      if (alreadyFullySettled) {
        setPaymentResult({ changeDue: 0 });
        setIsSuccess(true);
        setIsSubmitting(false);
        return;
      }

      if (orderType === 'TAKEAWAY') {
        const rawAmount = paymentMethod === 'Cash'
          ? parseFloat(cashReceived || '0')
          : grandTotal;

        const amountTendered = Number.isNaN(rawAmount) ? 0 : rawAmount;

        const payload = {
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            notes: item.notes || undefined,
            quantity: item.quantity,
          })),
          payment: {
            method: paymentMethod.toLowerCase() as 'cash' | 'card' | 'qr',
            amountTendered,
          }
        };

        const res = await api.post('/orders/takeaway', payload);

        setPaymentResult(res.data);
        setIsSuccess(true);
        return;
      }

      const targetOrders = ordersList && ordersList.length > 0
        ? ordersList
        : (orderId ? [{ id: orderId, total: grandTotal }] : []);

      if (targetOrders.length === 0) {
        setErrorMessage("No active order found to process payment.");
        setIsSubmitting(false);
        return;
      }

      let lastResData: PaymentResult | null = null;
      let totalChangeDue = 0;

      if (paymentMethod === 'Cash' && cashReceived) {
        let cashLeft = parseFloat(cashReceived);

        for (let i = 0; i < targetOrders.length; i++) {
          const o = targetOrders[i];
          const orderTotal = Number(o.total);

          const payAmount = Math.min(cashLeft, orderTotal);

          const res = await api.post(`/orders/${o.id}/payment`, {
            amount: payAmount,
            method: 'cash',
          });
          lastResData = res.data;
          cashLeft = Math.max(cashLeft - payAmount, 0);
        }

        totalChangeDue = Number(cashLeft.toFixed(2));
        if (lastResData) {
          lastResData.changeDue = totalChangeDue;
        }
      } else {
        // Card or QR
        for (let i = 0; i < targetOrders.length; i++) {
          const o = targetOrders[i];
          const res = await api.post(`/orders/${o.id}/payment`, {
            amount: Number(o.total),
            method: paymentMethod.toLowerCase() as 'cash' | 'card' | 'qr',
          });
          lastResData = res.data;
        }
      }

      setPaymentResult(lastResData);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Payment failed:", err);
      setErrorMessage(err.response?.data?.error ?? "Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      setIsDownloadingReceipt(true);


      const html2pdf = (await import('html2pdf.js')).default;

      const opt: any = {
        margin: 3,
        filename: `receipt_${orderId || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, width: 280, windowWidth: 280 },
        jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' },
      };

      await (html2pdf() as any).set(opt).from(receiptRef.current).save();
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        handleDownloadReceipt();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleCloseModal = () => {
    const wasSuccess = isSuccess;
    setCashReceived('');
    setPaymentMethod('Cash');
    setIsSuccess(false);
    setPaymentResult(null);
    setErrorMessage(null);
    onClose();
    if (wasSuccess && onPaymentComplete) {
      onPaymentComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
      <div className={`border rounded-2xl p-8 w-full max-w-md flex flex-col gap-6 relative overflow-hidden transition-all duration-200 ${isDark ? "bg-[#141416] border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-4 gap-6 animate-fadeIn">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${isDark
              ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>Payment Completed Successfully!</h2>
              <p className={`text-sm mt-1.5 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                {alreadyPaidSummary
                  ? 'Every item was already settled individually'
                  : (<>Transaction settled via <span className={`font-medium ${isDark ? "text-[#e5b83b]" : "text-emerald-600"}`}>{paymentMethod}</span></>)
                }
              </p>
            </div>

            <div className={`rounded-xl p-4 border flex flex-col gap-2 text-sm w-full ${isDark ? "bg-[#0c0c0d] border-neutral-900 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-650"
              }`}>
              {/* ── UPDATED — show the REAL collected total when this
                   table was settled entirely via individual item
                   payments, instead of the (correctly zero) grandTotal
                   this modal's own flow never actually charged ── */}
              <div className="flex justify-between items-center">
                <span className={isDark ? "text-neutral-400" : "text-slate-500"}>
                  {alreadyPaidSummary ? 'Total Collected' : 'Total Settled'}
                </span>
                <span className={`font-bold text-base ${isDark ? "text-white" : "text-slate-800"}`}>
                  Rs.{(alreadyPaidSummary ? alreadyPaidSummary.total : grandTotal).toFixed(2)}
                </span>
              </div>

              {/* ── NEW — per-payment breakdown, each showing its own
                   total, only relevant when settled via item payments ── */}
              {alreadyPaidSummary && alreadyPaidSummary.items.length > 0 && (
                <div className={`flex flex-col gap-1.5 border-t pt-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                  {alreadyPaidSummary.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className={isDark ? "text-neutral-500" : "text-slate-500"}>
                        {it.quantity} × {it.itemName} <span className="uppercase">({it.method})</span>
                      </span>
                      <span className={isDark ? "text-neutral-300" : "text-slate-700"}>Rs.{it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {!alreadyPaidSummary && paymentMethod === 'Cash' && paymentResult && (
                <>
                  <div className={`flex justify-between items-center border-t pt-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                    <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Cash Received</span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                      Rs.{parseFloat(cashReceived || '0').toFixed(2)}
                    </span>
                  </div>
                  {(paymentResult.changeDue ?? 0) > 0 && (
                    <div className={`flex justify-between items-center border-t pt-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                      <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Change Return</span>
                      <span className={`font-bold text-base ${isDark ? "text-[#22c55e]" : "text-emerald-600"}`}>
                        Rs.{Number(paymentResult.changeDue).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloadingReceipt}
                className={`w-full font-semibold py-3 rounded-xl border transition-all duration-150 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {isDownloadingReceipt ? 'Generating PDF...' : 'Download Receipt PDF'}
              </button>
              <button
                onClick={handleCloseModal}
                className={`w-full font-bold py-3 rounded-xl transition-all duration-150 text-sm ${isDark
                  ? "bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d]"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  }`}
              >
                Done & Close
              </button>
            </div>


            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
              <div
                ref={receiptRef}
                style={{
                  boxSizing: 'border-box',
                  width: '280px',
                  padding: '22px 18px',
                  fontFamily: '"Courier New", Courier, monospace, sans-serif',
                  color: '#000',
                  background: '#fff',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h1 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {cachedName || 'POS System'}
                  </h1>
                  <p style={{ margin: '0 0 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>
                    Receipt
                  </p>
                  <div style={{ boxSizing: 'border-box', width: '100%', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0', fontSize: '10.5px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                      <span>Date:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    {orderId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                        <span>Order ID:</span>
                        <span style={{ fontFamily: 'monospace' }}>{orderId.substring(0, 8)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                      <span>Type:</span>
                      <span>{orderType}</span>
                    </div>
                    {orderType === 'DINE_IN' && tableId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                        <span>Table:</span>
                        <span style={{ fontWeight: 'bold' }}>{tableId}</span>
                      </div>
                    )}
                    {customerName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                        <span>Customer:</span>
                        <span>{customerName}</span>
                      </div>
                    )}
                    {customerPhone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                        <span>Phone:</span>
                        <span>{customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <table style={{ width: '100%', tableLayout: 'fixed', fontSize: '10.5px', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <colgroup>
                    <col style={{ width: '54%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '32%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #000' }}>
                      <th style={{ textAlign: 'left', padding: '6px 2px 6px 0', fontWeight: 'bold' }}>
                        {alreadyPaidSummary ? 'ITEM' : orderType === 'DINE_IN' ? 'PAYMENT' : 'ITEM'}
                      </th>
                      <th style={{ textAlign: 'center', padding: '6px 2px', fontWeight: 'bold' }}>
                        {alreadyPaidSummary ? 'QTY' : orderType === 'DINE_IN' ? 'ITEMS' : 'QTY'}
                      </th>
                      <th style={{ textAlign: 'right', padding: '6px 0 6px 2px', fontWeight: 'bold' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alreadyPaidSummary && alreadyPaidSummary.items.length > 0 ? (
                      // ── NEW — table was already fully settled via
                      //    individual item payments BEFORE this modal
                      //    opened. List each of those payments here,
                      //    each showing its own total (mirrors exactly
                      //    what the ordersList branch does for a normal
                      //    settlement), tax already included per line. ──
                      alreadyPaidSummary.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                          <td style={{ padding: '6px 2px 6px 0', verticalAlign: 'top', wordBreak: 'break-word' }}>
                            <div style={{ fontWeight: 'bold' }}>{it.itemName}</div>
                            <div style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>{it.method}</div>
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 2px', verticalAlign: 'top' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '6px 0 6px 2px', verticalAlign: 'top', fontWeight: 'bold', wordBreak: 'break-word' }}>
                            Rs. {it.total.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : orderType === 'DINE_IN' ? (
                      // ── FIX — was always rendering the full, ORIGINAL cart
                      //    quantities here (stale once partial payments had
                      //    already covered some units), which visibly
                      //    contradicted the correct "remaining balance"
                      //    summary shown below. ordersList already carries
                      //    each order's correct REMAINING total, so list
                      //    one row per order/payment here instead — each
                      //    row shows that payment's own total, and they
                      //    sum to exactly the grand total in the summary. ──
                      (ordersList && ordersList.length > 0
                        ? ordersList
                        : (orderId ? [{ id: orderId, orderNumber: '', items: [], total: grandTotal }] : [])
                      ).map((o: any, idx: number) => (
                        <tr key={o.id ?? idx} style={{ borderBottom: '1px dotted #eee' }}>
                          <td style={{ padding: '6px 2px 6px 0', verticalAlign: 'top', wordBreak: 'break-word' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              Order {o.orderNumber ? `#${o.orderNumber}` : idx + 1}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 2px', verticalAlign: 'top' }}>
                            {Array.isArray(o.items) ? o.items.length : '—'}
                          </td>
                          <td style={{ textAlign: 'right', padding: '6px 0 6px 2px', verticalAlign: 'top', fontWeight: 'bold', wordBreak: 'break-word' }}>
                            Rs. {Number(o.total ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      cart.map((item, idx) => {
                        const price = item.price ?? item.product?.price ?? 0;
                        const name = item.name ?? item.product?.name ?? 'Item';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                            <td style={{ padding: '6px 2px 6px 0', verticalAlign: 'top', wordBreak: 'break-word' }}>
                              <div style={{ fontWeight: 'bold' }}>{name}</div>

                            </td>
                            <td style={{ textAlign: 'center', padding: '6px 2px', verticalAlign: 'top' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '6px 0 6px 2px', verticalAlign: 'top', fontWeight: 'bold', wordBreak: 'break-word' }}>
                              Rs. {(price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {alreadyPaidSummary ? (
                  // ── NEW — the item rows above already have tax baked
                  //    into each total individually (they came from
                  //    TableModal's per-item tax calculation), so we do
                  //    NOT re-run Subtotal/Tax through this modal's own
                  //    pipeline again — that would double-count tax.
                  //    Just show the single grand total across every
                  //    payment made, which is exactly what was asked:
                  //    "at the last show the total of all the payment". ──
                  <div style={{ boxSizing: 'border-box', width: '100%', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 'bold', fontSize: '13px', margin: '8px 0 4px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                      <span>GRAND TOTAL</span>
                      <span>Rs. {alreadyPaidSummary.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ boxSizing: 'border-box', width: '100%', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '4px 0' }}>
                      <span>Subtotal</span>
                      <span>Rs. {actualSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '4px 0' }}>
                      <span>VAT / Tax ({taxRate}%)</span>
                      <span>Rs. {tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 'bold', fontSize: '13px', margin: '8px 0 4px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                      <span>TOTAL</span>
                      <span>Rs. {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {!alreadyPaidSummary && (
                  <div style={{ boxSizing: 'border-box', width: '100%', borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '8px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                      <span>Payment Method:</span>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{paymentMethod}</span>
                    </div>
                    {paymentMethod === 'Cash' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                          <span>Cash Tendered:</span>
                          <span>Rs. {parseFloat(cashReceived || '0').toFixed(2)}</span>
                        </div>
                        {(paymentResult?.changeDue ?? 0) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0', fontWeight: 'bold' }}>
                            <span>Change Returned:</span>
                            <span>Rs. {Number(paymentResult?.changeDue).toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '9.5px', borderTop: '1px dashed #000', paddingTop: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>THANK YOU FOR YOUR VISIT!</p>
                </div>
              </div>
            </div>
          </div>
        ) : alreadyFullySettled ? (
          // ── NEW — shown instead of the normal payment form when
          //    every item on this table was already paid off
          //    individually via partial payment. There is nothing
          //    left to collect, but the cashier still needs a card
          //    to confirm from and generate/print the final receipt. ──
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Payment Settle</h2>
              <button onClick={handleCloseModal} className={`transition-colors p-1 rounded-md ${isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={`rounded-xl p-5 flex flex-col items-center text-center gap-3 border ${isDark ? "bg-[#0c0c0d] border-emerald-900/40" : "bg-emerald-50 border-emerald-100"
              }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isDark
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                : 'bg-emerald-100 border-emerald-200 text-emerald-600'
                }`}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                  Already fully paid
                </p>
                <p className={`text-xs mt-1 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                  Every item on this table was already settled individually.
                  Nothing left to collect — generate the final receipt below.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-xs font-semibold text-center mt-1 bg-red-500/10 border border-red-500/20 py-2 rounded-xl">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`w-full disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 ${isDark
                ? "bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d]"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
            >
              {isSubmitting ? 'Processing...' : 'Generate Receipt & Close Table'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Payment Settle</h2>
              <button onClick={handleCloseModal} className={`transition-colors p-1 rounded-md ${isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={`rounded-xl p-4 space-y-2 border ${isDark ? "bg-[#0c0c0d] border-transparent" : "bg-slate-50 border-slate-200"
              }`}>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Subtotal</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{actualSubtotal.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Tax {isTaxLoading ? "(...)" : `(${taxRate}%)`}</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{tax.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold border-t pt-2 mt-1 ${isDark ? "text-white border-neutral-800" : "text-slate-800 border-slate-200"
                }`}>
                <span>Total Due</span>
                <span className={`text-lg ${isDark ? "text-[#e5b83b]" : "text-emerald-600"}`}>Rs.{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-slate-400"}`}>Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Cash', 'Card', 'QR'] as const).map(id => {
                  const isSelected = paymentMethod === id;
                  let icon;

                  if (id === 'Cash') {
                    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>;
                  } else if (id === 'Card') {
                    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
                  } else {
                    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="16" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /></svg>;
                  }

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all duration-150 flex items-center justify-center gap-2 ${isSelected
                        ? isDark
                          ? 'bg-[#e5b83b] text-[#0c0c0d] border-[#e5b83b]'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : isDark
                          ? 'bg-[#0c0c0d] text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800 shadow-sm'
                        }`}
                    >
                      <span className={isSelected ? (isDark ? 'text-[#0c0c0d]' : 'text-white') : (isDark ? 'text-[#e5b83b]' : 'text-emerald-600')}>
                        {icon}
                      </span>
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="flex flex-col gap-2">
                <label className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-slate-400"}`}>Amount Received</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={`Rs. ${grandTotal.toFixed(2)}`}
                  className={`outline-none rounded-xl px-4 py-3 text-sm transition-colors border ${isDark
                    ? "bg-[#0c0c0d] border-neutral-800 focus:border-[#e5b83b] text-white placeholder-neutral-500"
                    : "bg-white border-slate-200 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
                    }`}
                />
                {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                  <p className={`text-sm font-semibold mt-1 ${isDark ? "text-[#22c55e]" : "text-emerald-600"}`}>
                    Change: Rs.{(parseFloat(cashReceived) - grandTotal).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="text-red-500 text-xs font-semibold text-center mt-1 bg-red-500/10 border border-red-500/20 py-2 rounded-xl">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isSubmitting || isTaxLoading || (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < grandTotal))}
              className={`w-full disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 ${isDark
                ? "bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d]"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
            >
              {isSubmitting ? 'Processing...' : 'Confirm Payment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}