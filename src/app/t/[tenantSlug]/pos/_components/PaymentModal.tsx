"use client";

import React, { useState, useMemo, useRef } from 'react';
import api from '@/lib/api';
import { useTheme } from '../context/ThemeContext';

interface Product {
  name: string;
  price: number;
}

interface CartItem {
  productId?: string;
  quantity: number;
  notes?: string;
  name?: string;
  price?: number;
  extraCost?: HullNumber;
  product?: Product;
}

type PaymentMethod = 'Cash' | 'Card' | 'QR';
type OrderType = 'TAKEAWAY' | 'DINE_IN';

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
}

type HullNumber = number;

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
  customerPhone = ''
}: PaymentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const actualSubtotal = orderType === 'TAKEAWAY' ? subtotalAmount : totalAmount;
  const tax = Math.round(actualSubtotal * 0.08 * 100) / 100;
  const grandTotal = Math.round((actualSubtotal + tax) * 100) / 100;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (orderType === 'TAKEAWAY') {
        const amountTendered = paymentMethod === 'Cash'
          ? parseFloat(cashReceived || '0')
          : grandTotal;

        const payload = {
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart.map(item => ({
            productId: item.productId,
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

      let lastResData = null;
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
      <div className={`border rounded-2xl p-8 w-full max-w-md flex flex-col gap-6 relative overflow-hidden transition-all duration-200 ${
        isDark ? "bg-[#141416] border-neutral-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-4 gap-6 animate-fadeIn">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${
              isDark 
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
                Transaction settled via <span className={`font-medium ${isDark ? "text-[#e5b83b]" : "text-emerald-600"}`}>{paymentMethod}</span>
              </p>
            </div>

            <div className={`rounded-xl p-4 border flex flex-col gap-2 text-sm w-full ${
              isDark ? "bg-[#0c0c0d] border-neutral-900 text-neutral-400" : "bg-slate-50 border-slate-200 text-slate-650"
            }`}>
              <div className="flex justify-between items-center">
                <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Total Settled</span>
                <span className={`font-bold text-base ${isDark ? "text-white" : "text-slate-800"}`}>Rs.{grandTotal.toFixed(2)}</span>
              </div>
              {paymentMethod === 'Cash' && paymentResult && (
                <>
                  <div className={`flex justify-between items-center border-t pt-2 ${isDark ? "border-neutral-800" : "border-slate-200"}`}>
                    <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Cash Received</span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                      Rs.{parseFloat(cashReceived || '0').toFixed(2)}
                    </span>
                  </div>
                  {paymentResult.changeDue > 0 && (
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
                onClick={handleCloseModal}
                className={`w-full font-bold py-3 rounded-xl transition-all duration-150 text-sm ${
                  isDark 
                    ? "bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d]" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
              >
                Done & Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Payment Settle</h2>
              <button onClick={handleCloseModal} className={`transition-colors p-1 rounded-md ${
                isDark ? "text-neutral-500 hover:text-white hover:bg-neutral-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={`rounded-xl p-4 space-y-2 border ${
              isDark ? "bg-[#0c0c0d] border-transparent" : "bg-slate-50 border-slate-200"
            }`}>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Subtotal</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{totalAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                <span>Tax (8%)</span>
                <span className={isDark ? "" : "font-medium"}>Rs.{tax.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold border-t pt-2 mt-1 ${
                isDark ? "text-white border-neutral-800" : "text-slate-800 border-slate-200"
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
                      className={`py-3 rounded-xl text-sm font-semibold border transition-all duration-150 flex items-center justify-center gap-2 ${
                        isSelected
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
                  className={`outline-none rounded-xl px-4 py-3 text-sm transition-colors border ${
                    isDark 
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
              disabled={isSubmitting || (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < grandTotal))}
              className={`w-full disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2 ${
                isDark 
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