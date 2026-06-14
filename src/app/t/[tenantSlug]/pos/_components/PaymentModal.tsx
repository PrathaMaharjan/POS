"use client";

import React, { useState, useMemo, useRef } from 'react';



interface Product {
  name: string;
  price: number;
}

interface CartItem {
  quantity: number;
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
  totalAmount: number;
  cart?: CartItem[];
  orderType?: OrderType;
  tableId?: string | number | null;
}

type HullNumber = number;

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  cart = [], 
  orderType = 'TAKEAWAY', 
  tableId = null 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;


  const tax = totalAmount * 0.08;
  const grandTotal = totalAmount + tax;

  const handleConfirm = () => {

    setIsSuccess(true);
  };

  const handleCloseModal = () => {
    setCashReceived('');
    setPaymentMethod('Cash');
    setIsSuccess(false);
    onClose();
  };

  return (
  
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
        <div className="bg-[#141416] border border-neutral-800 rounded-2xl p-8 w-full max-w-md flex flex-col gap-6 relative overflow-hidden">

          {isSuccess ? (

            <div className="flex flex-col items-center justify-center text-center py-4 gap-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Payment Completed Successfully!</h2>
                <p className="text-sm text-neutral-500 mt-1.5">
                  Transaction settled via <span className="text-[#e5b83b] font-medium">{paymentMethod}</span>
                </p>
              </div>

              <div className="w-full bg-[#0c0c0d] rounded-xl p-4 border border-neutral-900 flex justify-between items-center text-sm">
                <span className="text-neutral-400">Total Settled</span>
                <span className="text-white font-bold text-base">Rs.{grandTotal.toFixed(2)}</span>
              </div>

              <div className="w-full flex flex-col gap-2 mt-2">
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-[#e5b83b] hover:bg-[#f5c847] text-[#0c0c0d] font-bold py-3 rounded-xl transition-all duration-150 text-sm"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (

            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Payment Settle</h2>
                <button onClick={handleCloseModal} className="text-neutral-500 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="bg-[#0c0c0d] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Subtotal</span>
                  <span>Rs.{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-400">
                  <span>Tax (8%)</span>
                  <span>Rs.{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-2 mt-1">
                  <span>Total Due</span>
                  <span className="text-[#e5b83b] text-lg">Rs.{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Payment Method</label>
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
                            ? 'bg-[#e5b83b] text-[#0c0c0d] border-[#e5b83b]'
                            : 'bg-[#0c0c0d] text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                        }`}
                      >
                        <span className={isSelected ? 'text-[#0c0c0d]' : 'text-[#e5b83b]'}>
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
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Amount Received</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={`Rs. ${grandTotal.toFixed(2)}`}
                    className="bg-[#0c0c0d] border border-neutral-800 focus:border-[#e5b83b] outline-none rounded-xl px-4 py-3 text-sm text-white transition-colors"
                  />
                  {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                    <p className="text-sm text-[#22c55e] font-semibold mt-1">
                      Change: Rs.{(parseFloat(cashReceived) - grandTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < grandTotal)}
                className="w-full bg-[#e5b83b] hover:bg-[#f5c847] disabled:opacity-40 disabled:cursor-not-allowed text-[#0c0c0d] font-bold py-3 rounded-xl transition-all duration-150 text-sm"
              >
                Confirm Payment
              </button>
            </>
          )}

        </div>
      </div>
  
  );
}