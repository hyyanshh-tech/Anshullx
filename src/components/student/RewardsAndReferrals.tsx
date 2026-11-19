import React from 'react';
import {
  ArrowLeft,
  Award,
  Copy,
  Flame,
  Share2,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { CAMPUS_LEADERBOARD } from '../../data/mockData';
import { getReferralRewardStatus } from '../../utils/campusCraveLogic';

export function RewardsAndReferrals({ onBack }: { onBack: () => void }) {
  const { state, pushToast, simulateFriendReferral } = useCampusCrave();
  const refStatus = getReferralRewardStatus(state.student.referredFriendsCount);

  const shareMessage = `Join CampusCrave near DBS Global University, Selakui & save 40% on daily meals (zero delivery fees)! Use my referral code ${state.student.referralCode} for a bonus ₹199 trial perk.`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.student.referralCode);
    } catch {
      // fallback silently
    }
    pushToast(`Copied referral code ${state.student.referralCode}!`, 'success');
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
          Rewards & Hostel Referrals
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Refer 3 friends = 1 free meal credit · Current tier: {refStatus.tierLabel}
        </p>
      </div>

      {/* Referral Card */}
      <section className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-300 font-semibold">Your Referral Code</p>
            <div className="text-2xl font-extrabold font-mono tracking-wider mt-0.5">
              {state.student.referralCode}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy referral code"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>Progress to next free meal</span>
            <span className="font-mono font-bold">
              {refStatus.progressTowardNext} / 3 friends
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-[#FF6B35] transition-all"
              style={{ width: `${(refStatus.progressTowardNext / 3) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            {refStatus.freeMealsEarned} free meal(s) unlocked so far · {refStatus.neededForNext} more
            friend(s) for your next free credit
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#166534] min-h-[44px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share WhatsApp
          </a>
          <button
            type="button"
            onClick={simulateFriendReferral}
            className="py-2.5 px-3 rounded-xl bg-[#FF6B35] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#e85d2a] cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Simulate Invite
          </button>
        </div>
      </section>

      {/* Streak Badges */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#FF6B35]" />
          Streak & Milestone Badges
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800">
            <Flame className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {state.student.streakDays}d Streak
            </div>
            <div className="text-[10px] text-zinc-500">Mess-Free</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800">
            <Award className="w-5 h-5 text-[#15803D] dark:text-emerald-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {refStatus.tierLabel.split(' ')[0]}
            </div>
            <div className="text-[10px] text-zinc-500">{state.student.referredFriendsCount} Referrals</div>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Rank #3
            </div>
            <div className="text-[10px] text-zinc-500">DBS Selakui</div>
          </div>
        </div>
      </section>

      {/* Campus Leaderboard */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          DBS Global University Leaderboard
        </h2>
        <div className="divide-y divide-stone-100 dark:divide-zinc-800">
          {CAMPUS_LEADERBOARD.map((row) => {
            const referrals = row.isCurrentUser
              ? state.student.referredFriendsCount
              : row.referrals;
            return (
              <div
                key={row.rank}
                className={`py-2.5 flex items-center justify-between text-xs ${
                  row.isCurrentUser ? 'font-bold text-[#FF6B35]' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono w-5 text-zinc-400">#{row.rank}</span>
                  <div>
                    <div>{row.isCurrentUser ? `${state.student.name} (You)` : row.name}</div>
                    <div className="text-[11px] font-normal text-zinc-500">{row.hostel}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div>{referrals} refs</div>
                  <div className="text-[11px] font-normal text-zinc-500">{row.streak}d streak</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
