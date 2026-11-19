import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Receipt,
  Smartphone,
  X,
} from 'lucide-react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';
import type { InvoiceRecord, SubscriptionPlan } from '../../types';
import { formatInr } from '../../utils/campusCraveLogic';

export function PlansAndCheckout({ onBack }: { onBack: () => void }) {
  const { state, purchasePlan } = useCampusCrave();
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm'>('GPay');
  const [receipt, setReceipt] = useState<InvoiceRecord | null>(null);

  const handleConfirmUpi = () => {
    if (!checkoutPlan) return;
    const inv = purchasePlan(checkoutPlan, upiApp);
    setReceipt(inv);
    setCheckoutPlan(null);
  };

  return (
    <div className="space-y-5 pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer min-h-[40px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to More
      </button>

      <div>
        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
          Meal Plans & UPI Checkout
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Active: {state.subscription.planName} · {state.subscription.creditsRemaining} credits remaining
        </p>
      </div>

      {/* Receipt Banner if just paid */}
      {receipt && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Payment Successful via {receipt.upiApp}
            </span>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              aria-label="Dismiss receipt"
              className="text-emerald-700 dark:text-emerald-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5 font-mono">
            <div>Plan: {receipt.planName}</div>
            <div>Paid: {formatInr(receipt.amount)} · UTR: {receipt.utrNumber}</div>
            <div>Invoice ID: {receipt.id}</div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="space-y-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border space-y-3 ${
              plan.popular
                ? 'border-[#FF6B35] ring-1 ring-[#FF6B35]/30'
                : 'border-stone-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-[#FF6B35]">
                  {plan.popular ? 'Most Popular · Save up to 40%' : plan.audience}
                </p>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{plan.tagline}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatInr(plan.price)}
                </div>
                <div className="text-[11px] font-mono text-zinc-400 line-through">
                  {formatInr(plan.originalDeliveryEquivalent)}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
              {plan.credits} meals · {plan.validityDays} days · ~₹{plan.perMealCost}/meal
            </div>

            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              {plan.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setCheckoutPlan(plan)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                plan.popular
                  ? 'bg-[#FF6B35] text-white hover:bg-[#e85d2a]'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
              }`}
            >
              Buy {plan.name} · {formatInr(plan.price)}
            </button>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Why Hostellers Switch to CampusCrave
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="py-2 pr-2 font-semibold">Factor</th>
                <th className="py-2 px-2 font-bold text-[#FF6B35]">CampusCrave</th>
                <th className="py-2 px-2 font-semibold">Zomato/Swiggy</th>
                <th className="py-2 px-2 font-semibold">Dhaba</th>
                <th className="py-2 pl-2 font-semibold">Mess</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="py-2 pr-2 font-medium">Price/meal</td>
                <td className="py-2 px-2 font-mono font-bold text-[#15803D] dark:text-emerald-400">₹50–55</td>
                <td className="py-2 px-2 font-mono">₹150–250</td>
                <td className="py-2 px-2 font-mono">₹70–110</td>
                <td className="py-2 pl-2 font-mono">₹65 fixed</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-medium">Hygiene</td>
                <td className="py-2 px-2 font-semibold">5-pt Audit</td>
                <td className="py-2 px-2">Unverified</td>
                <td className="py-2 px-2">Inconsistent</td>
                <td className="py-2 pl-2">Basic</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-medium">Variety</td>
                <td className="py-2 px-2 font-semibold">6 Kitchens</td>
                <td className="py-2 px-2">High</td>
                <td className="py-2 px-2">Limited</td>
                <td className="py-2 pl-2">Repetitive</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 font-medium">Extra Fees</td>
                <td className="py-2 px-2 font-semibold text-[#15803D] dark:text-emerald-400">₹0 Fees</td>
                <td className="py-2 px-2">Delivery+Surge</td>
                <td className="py-2 px-2">None</td>
                <td className="py-2 pl-2">Fixed Term</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mock UPI Checkout Modal */}
      {checkoutPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="UPI Checkout"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Instant UPI Checkout
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                aria-label="Close checkout"
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {checkoutPlan.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  +{checkoutPlan.credits} credits · {checkoutPlan.validityDays} days
                </div>
              </div>
              <div className="text-lg font-extrabold font-mono text-[#FF6B35]">
                {formatInr(checkoutPlan.price)}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Choose UPI App
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['GPay', 'PhonePe', 'Paytm'] as const).map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiApp(app)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer min-h-[44px] ${
                      upiApp === app
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                        : 'border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmUpi}
              className="w-full py-3 px-4 rounded-xl bg-[#15803D] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#166534] transition-colors cursor-pointer min-h-[48px]"
            >
              <Receipt className="w-4 h-4" />
              Pay {formatInr(checkoutPlan.price)} via {upiApp}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
