import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Leaf,
  QrCode,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCampusCrave } from '../../context/CampusCraveContext';

const QUICK_CHIPS = [
  'Cheap & filling',
  'High protein',
  'Late-night study snack',
  'Surprise me',
];

export function AiMealBuddy() {
  const {
    state,
    updateStudentProfile,
    addChatMessage,
    setWeeklyPlan,
    pushToast,
    jumpToQrRedeem,
    markMilestone,
  } = useCampusCrave();

  const [input, setInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const eateriesSummary = state.eateries.map((e) => ({
    name: e.name,
    distanceKm: e.distanceKm,
    cuisine: e.cuisine,
    isPureVeg: e.isPureVeg,
    hygieneRating: e.hygieneRating,
    avgPartnerPrice: e.avgPartnerPrice,
    todaySpecial: e.todaySpecial,
    openHours: e.openHours,
  }));

  const findMatchingEatery = (text: string) => {
    const lower = text.toLowerCase();
    return state.eateries.find((e) => {
      const words = e.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return (
        lower.includes(e.name.toLowerCase()) ||
        words.some((w) => lower.includes(w))
      );
    });
  };

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loadingChat) return;

    markMilestone('usedAiBuddy');
    addChatMessage({
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    });
    setInput('');
    setLoadingChat(true);

    try {
      const res = await fetch('/api/ai/meal-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          studentName: state.student.name,
          vegOnly: state.student.vegOnly,
          examMode: state.student.examMode,
          creditsLeft: state.subscription.creditsRemaining,
          monthlyBudget: state.student.monthlyBudgetGoal,
          eateriesSummary,
        }),
      });
      const data = await res.json();
      addChatMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text:
          data.reply ||
          'Try Pahadi Rasoi Dhaba (0.35 km) for Rajma Chawal + 2 Rotis for 1 credit!',
        timestamp: Date.now(),
      });
    } catch {
      addChatMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Try South Spice Corner (0.50 km, 4.9★ Hygiene) for Crispy Masala Dosa + Sambar (1 credit).',
        timestamp: Date.now(),
      });
    } finally {
      setLoadingChat(false);
    }
  };

  const handlePlanWeek = async () => {
    markMilestone('usedAiBuddy');
    setLoadingPlan(true);
    try {
      const res = await fetch('/api/ai/weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vegOnly: state.student.vegOnly,
          examMode: state.student.examMode,
          creditsLeft: state.subscription.creditsRemaining,
          monthlyBudget: state.student.monthlyBudgetGoal,
          eateriesSummary,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.plan)) {
        setWeeklyPlan(data.plan, data.summary || '');
        pushToast('7-day budget-fitted meal plan ready!', 'success');
      }
    } catch {
      pushToast('Could not generate weekly plan right now.', 'error');
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF6B35]" />
            AI Meal Buddy
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Powered by Gemini · {state.subscription.creditsRemaining} credits left
          </p>
        </div>

        <button
          type="button"
          onClick={handlePlanWeek}
          disabled={loadingPlan}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 disabled:opacity-60 cursor-pointer min-h-[40px] shrink-0 whitespace-nowrap"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {loadingPlan ? 'Planning...' : 'Plan my week'}
        </button>
      </div>

      {/* Mode Toggles */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateStudentProfile({ vegOnly: !state.student.vegOnly })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer min-h-[36px] whitespace-nowrap ${
            state.student.vegOnly
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white dark:bg-[#1A1C21] text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          Veg Only: {state.student.vegOnly ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={() => updateStudentProfile({ examMode: !state.student.examMode })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer min-h-[36px] whitespace-nowrap ${
            state.student.examMode
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white dark:bg-[#1A1C21] text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Exam-Week Mode: {state.student.examMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => sendPrompt(chip)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-[#FF6B35] whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3 max-h-[300px] overflow-y-auto">
        {state.chatMessages.map((msg) => {
          const parts = msg.text.split(/(\*\*[^*]+\*\*)/g);
          const matchedEatery =
            msg.sender === 'ai' ? findMatchingEatery(msg.text) : undefined;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              } gap-1.5`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                  msg.sender === 'user'
                    ? 'bg-[#FF6B35] text-white rounded-br-sm'
                    : 'bg-stone-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'
                }`}
              >
                {parts.map((part, idx) =>
                  part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={idx} className="font-bold">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <React.Fragment key={idx}>{part}</React.Fragment>
                  ),
                )}
              </div>
              {matchedEatery && (
                <button
                  type="button"
                  onClick={() =>
                    jumpToQrRedeem(matchedEatery.id, matchedEatery.todaySpecial)
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold hover:bg-[#FF6B35]/20 cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-3 h-3" />
                  Redeem at {matchedEatery.name}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {loadingChat && (
          <div className="flex justify-start">
            <div className="w-48 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 animate-pulse" />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendPrompt(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          aria-label="Ask AI Meal Buddy"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask e.g. 'Something warm under 550 kcal'..."
          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={loadingChat || !input.trim()}
          className="p-2.5 rounded-xl bg-[#FF6B35] text-white hover:bg-[#e85d2a] disabled:opacity-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* AI Weekly Meal Planner */}
      {loadingPlan && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-2">
          <div className="h-4 w-44 bg-stone-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-16 w-full bg-stone-100 dark:bg-zinc-800/70 rounded-xl animate-pulse" />
          <div className="h-16 w-full bg-stone-100 dark:bg-zinc-800/70 rounded-xl animate-pulse" />
        </div>
      )}

      {!loadingPlan && state.weeklyPlan && (
        <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Your 7-Day AI Meal Plan
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {state.weeklyPlanSummary}
            </p>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-zinc-800">
            {state.weeklyPlan.map((day) => {
              const lunchEatery = findMatchingEatery(day.lunch.eatery);
              const dinnerEatery = findMatchingEatery(day.dinner.eatery);
              return (
                <div key={day.day} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{day.day}</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-zinc-600 dark:text-zinc-300 min-w-0">
                      <span className="font-semibold text-[#FF6B35]">Lunch:</span>{' '}
                      {day.lunch.dish} @ {day.lunch.eatery} ({day.lunch.tag})
                    </div>
                    {lunchEatery && (
                      <button
                        type="button"
                        onClick={() => jumpToQrRedeem(lunchEatery.id, day.lunch.dish)}
                        className="px-2.5 py-1 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold hover:bg-[#FF6B35]/20 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Redeem
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-zinc-600 dark:text-zinc-300 min-w-0">
                      <span className="font-semibold text-[#15803D] dark:text-emerald-400">
                        Dinner:
                      </span>{' '}
                      {day.dinner.dish} @ {day.dinner.eatery} ({day.dinner.tag})
                    </div>
                    {dinnerEatery && (
                      <button
                        type="button"
                        onClick={() => jumpToQrRedeem(dinnerEatery.id, day.dinner.dish)}
                        className="px-2.5 py-1 rounded-lg bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400 text-[11px] font-bold hover:bg-[#15803D]/20 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Redeem
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

