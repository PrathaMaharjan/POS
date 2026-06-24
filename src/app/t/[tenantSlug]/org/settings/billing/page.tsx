"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Receipt,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface Plan {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: {
    outlets: string;
    staff: string;
    tables: string;
  };
}

const PLANS: Record<string, Plan> = {
  Starter: {
    name: "Starter",
    priceMonthly: 29,
    priceYearly: 24,
    features: [
      "Up to 2 Outlets / Branches",
      "Up to 5 Staff Members per branch",
      "Up to 15 Active Tables",
      "Standard KOT (Kitchen Order Ticket)",
      "Daily Analytics Report",
      "Email & Chat Support",
    ],
    limits: { outlets: "2", staff: "5", tables: "15" },
  },
  Pro: {
    name: "Pro",
    priceMonthly: 79,
    priceYearly: 63,
    features: [
      "Up to 5 Outlets / Branches",
      "Up to 25 Staff Members total",
      "Up to 50 Active Tables",
      "Advanced KOT + Kitchen Display System (KDS)",
      "Multi-outlet Realtime Dashboard",
      "Advanced Inventory & Recipe Management",
      "Custom receipt branding & header config",
      "Priority 24/7 Support",
    ],
    limits: { outlets: "5", staff: "25", tables: "50" },
  },
  Enterprise: {
    name: "Enterprise",
    priceMonthly: 199,
    priceYearly: 159,
    features: [
      "Unlimited Outlets & Branches",
      "Unlimited Staff Members & Waiters",
      "Unlimited Tables",
      "Full API & Webhook Access",
      "Custom Roles and RBAC controls",
      "Dedicated account manager",
      "Custom Hardware integration",
      "SLA 99.9% guaranteed uptime",
    ],
    limits: { outlets: "Unlimited", staff: "Unlimited", tables: "Unlimited" },
  },
};

const INITIAL_INVOICES = [
  { id: "INV-2026-004", date: "2026-06-24", amount: "$79.00", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2026-003", date: "2026-05-24", amount: "$79.00", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2026-002", date: "2026-04-24", amount: "$79.00", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2026-001", date: "2026-03-24", amount: "$29.00", status: "Paid", method: "Visa •••• 4242" },
];

export default function BillingPage() {
  const { tenantSlug } = useParams();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Persisted state simulation
  const [currentPlan, setCurrentPlan] = useState("Pro");
  const [cardInfo, setCardInfo] = useState({
    brand: "Visa",
    last4: "4242",
    expiry: "12/28",
    holder: "Alexander Wright",
  });
  
  // Interaction modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ ...cardInfo });
  const [cardLoading, setCardLoading] = useState(false);

  // Success toast indicators
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpgradeClick = (planName: string) => {
    setSelectedPlanName(planName);
    setIsCheckoutOpen(true);
  };

  const handleConfirmPlanChange = async () => {
    setCheckoutLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1200));
    setCurrentPlan(selectedPlanName);
    setCheckoutLoading(false);
    setIsCheckoutOpen(false);
    showNotification(`Subscription successfully updated to the ${selectedPlanName} plan!`);
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    setCardInfo({ ...cardForm });
    setCardLoading(false);
    setIsCardModalOpen(false);
    showNotification("Billing card information successfully updated.");
  };


  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div className="rounded-xl bg-emerald-600 px-6 py-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-emerald-100/80 mt-1">
            Manage your subscription tier, track organization usage quotas, and view past invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/30 px-3 py-1.5 rounded-lg border border-emerald-400/20 text-xs font-medium self-start md:self-auto">
          <ShieldCheck className="h-4 w-4 text-emerald-100" />
          Billing Access Level: Owner
        </div>
      </div>

      {/* Success Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg animate-slide-up">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Top Section: Active Plan Status + Quick Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active plan status */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Current Plan</span>
                <h2 className="text-2xl font-bold text-slate-800 mt-0.5">{currentPlan} Plan</h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-slate-800">
                  ${currentPlan === "Pro" ? PLANS.Pro.priceMonthly : currentPlan === "Starter" ? PLANS.Starter.priceMonthly : PLANS.Enterprise.priceMonthly}
                </span>
                <span className="text-xs text-slate-400 font-medium"> / month</span>
              </div>
            </div>

            {/* Quota Usage trackers */}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Organization Resource Quotas</h3>
            <div className="space-y-4">
              {/* Branches */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Registered Outlets / Branches</span>
                  <span className="text-slate-800">3 of {PLANS[currentPlan]?.limits.outlets} branches</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: currentPlan === "Starter" ? "100%" : currentPlan === "Pro" ? "60%" : "15%" }} />
                </div>
              </div>

              {/* Staff members */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Total Assigned Staff Directory</span>
                  <span className="text-slate-800">8 of {PLANS[currentPlan]?.limits.staff} members</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: currentPlan === "Starter" ? "100%" : currentPlan === "Pro" ? "32%" : "5%" }} />
                </div>
              </div>

              {/* Tables */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Active Dining Tables</span>
                  <span className="text-slate-800">14 of {PLANS[currentPlan]?.limits.tables} tables</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: currentPlan === "Starter" ? "93%" : currentPlan === "Pro" ? "28%" : "2%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Next billing charge occurs on <strong className="text-slate-700 font-semibold">July 24, 2026</strong></span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Auto-renew enabled
            </span>
          </div>
        </div>

        {/* Credit Card Details Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between gap-5">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Payment Gateway</h2>
              <p className="text-xs text-slate-400 mt-0.5">Primary credit card used for recurring renewals</p>
            </div>

            {/* Mock Credit Card graphic */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-xl p-4 shadow-md flex flex-col justify-between h-32 relative overflow-hidden">
              {/* Subtle background circles */}
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
              <div className="absolute left-6 top-6 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg" />
              
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold tracking-widest text-slate-300">POS PAY</span>
                <span className="text-xs font-bold text-slate-400 font-sans italic">{cardInfo.brand}</span>
              </div>
              <div className="text-sm font-mono tracking-widest text-slate-100 my-1">
                ••••  ••••  ••••  {cardInfo.last4}
              </div>
              <div className="flex items-end justify-between text-[9px] text-slate-400 uppercase">
                <div>
                  <span className="block text-[8px] text-slate-500 leading-none">Holder</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block truncate max-w-[120px]">{cardInfo.holder}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-slate-500 leading-none">Expiry</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{cardInfo.expiry}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCardForm({ ...cardInfo });
              setIsCardModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 hover:border-slate-300 py-2.5 text-xs font-semibold text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100"
          >
            <CreditCard className="w-4 h-4 text-slate-500" />
            Update Card Information
          </button>
        </div>

      </div>

      {/* Pricing Matrix Plans Grid */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Plan Comparison Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Toggle to yearly billing to receive a 20% discount on subscription costs.</p>
          </div>
          
          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`rounded-md px-3.5 py-1 text-xs font-bold transition-all ${
                billingPeriod === "monthly" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`rounded-md px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1 ${
                billingPeriod === "yearly" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Yearly
              <span className="bg-emerald-100 text-emerald-700 text-[8px] font-extrabold px-1 py-0.5 rounded uppercase leading-none">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PLANS).map((p) => {
            const isCurrent = currentPlan === p.name;
            const price = billingPeriod === "monthly" ? p.priceMonthly : p.priceYearly;
            
            return (
              <div
                key={p.name}
                className={`rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isCurrent ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200"
                }`}
              >
                {/* Popular label for Pro */}
                {p.name === "Pro" && (
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                )}

                <div>
                  <h3 className="text-base font-bold text-slate-800">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-extrabold text-slate-800">${price}</span>
                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {billingPeriod === "yearly" ? `Billed annually ($${price * 12}/year)` : "Billed monthly"}
                  </p>

                  <div className="border-t border-slate-100 my-4" />

                  {/* Resource quotas checklist */}
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <div className="w-full text-center rounded-lg bg-emerald-50 border border-emerald-200 py-2.5 text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Active Subscription
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgradeClick(p.name)}
                      className={`w-full text-center rounded-lg py-2.5 text-xs font-bold transition-all ${
                        p.name === "Enterprise"
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      }`}
                    >
                      {currentPlan === "Enterprise" || (currentPlan === "Pro" && p.name === "Starter") ? "Switch Plan" : "Upgrade Plan"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Invoice logs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-2">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Billing History</h2>
            <p className="text-xs text-slate-400 mt-0.5">List of past invoice transaction records.</p>
          </div>
          <Receipt className="h-5 w-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Invoice Number</th>
                <th className="py-3 px-6">Billing Date</th>
                <th className="py-3 px-6">Paid Amount</th>
                <th className="py-3 px-6">Payment Gateway</th>
                <th className="py-3 px-6">Transaction Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {INITIAL_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{inv.id}</td>
                  <td className="py-3.5 px-6">{inv.date}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-800">{inv.amount}</td>
                  <td className="py-3.5 px-6 text-slate-400">{inv.method}</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                      <span className="mr-1 h-1 w-1 rounded-full bg-emerald-600" />
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Plan Switch Checkout Modal */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !checkoutLoading && setIsCheckoutOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">Modify Subscription Plan</h3>
              <button
                disabled={checkoutLoading}
                onClick={() => setIsCheckoutOpen(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-semibold uppercase">Plan to Upgrade</span>
                <span className="font-bold text-slate-800 text-sm">{selectedPlanName} Tier</span>
              </div>
              
              <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Billing Subtotal</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    ${billingPeriod === "monthly" ? PLANS[selectedPlanName]?.priceMonthly : PLANS[selectedPlanName]?.priceYearly}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimated Local Taxes</span>
                  <span className="font-semibold text-slate-700 font-mono">$0.00</span>
                </div>
                <div className="border-t border-slate-200 my-1 pt-1.5 flex items-center justify-between text-sm font-bold text-slate-800">
                  <span>Grand Total (Due now)</span>
                  <span className="font-mono text-emerald-600">
                    ${billingPeriod === "monthly" ? PLANS[selectedPlanName]?.priceMonthly : PLANS[selectedPlanName]?.priceYearly}.00
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 px-3.5 py-2.5 text-[11px] text-amber-800 leading-snug">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                <span>
                  Your active credit card ending in <strong>{cardInfo.last4}</strong> will be billed immediately. Future recurring charges will reflect this new price matrix.
                </span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  disabled={checkoutLoading}
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={checkoutLoading}
                  onClick={handleConfirmPlanChange}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {checkoutLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {checkoutLoading ? "Confirming..." : "Confirm & Pay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Credit Card Settings Update Modal */}
      {isCardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !cardLoading && setIsCardModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">Update Credit Card</h3>
              <button
                disabled={cardLoading}
                onClick={() => setIsCardModalOpen(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateCard} className="p-5 flex-1 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide">Cardholder Name</label>
                <input
                  required
                  disabled={cardLoading}
                  type="text"
                  value={cardForm.holder}
                  onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide">Mock Card Brand</label>
                  <select
                    disabled={cardLoading}
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide">Last 4 Digits</label>
                  <input
                    required
                    disabled={cardLoading}
                    type="text"
                    pattern="\d{4}"
                    maxLength={4}
                    value={cardForm.last4}
                    onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value })}
                    placeholder="4242"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 text-center focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide">Expiration Date</label>
                  <input
                    required
                    disabled={cardLoading}
                    type="text"
                    pattern="(0[1-9]|1[0-2])\/\d{2}"
                    maxLength={5}
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 text-center focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide">CVV / CVN</label>
                  <input
                    required
                    disabled={cardLoading}
                    type="password"
                    pattern="\d{3,4}"
                    maxLength={4}
                    placeholder="•••"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 text-center focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={cardLoading}
                  onClick={() => setIsCardModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cardLoading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {cardLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {cardLoading ? "Saving Card..." : "Save Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
