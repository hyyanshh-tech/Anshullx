import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Moon,
  Sun,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCampusCrave } from '../context/CampusCraveContext';
import type { UserRole } from '../types';

interface TopBarProps {
  onOpenAbout: () => void;
  showAbout: boolean;
  onCloseAbout: () => void;
}

export function TopBar({ onOpenAbout, showAbout, onCloseAbout }: TopBarProps) {
  const { state, setRole, toggleDarkMode } = useCampusCrave();

  const handleRoleSelect = (role: UserRole) => {
    onCloseAbout();
    setRole(role);
  };

  const navLinks = [
    { id: 'student', label: 'Student', isAbout: false },
    { id: 'vendor', label: 'Vendor', isAbout: false },
    { id: 'admin', label: 'Admin', isAbout: false },
    { id: 'about', label: 'About', isAbout: true },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 dark:border-white/[0.08] bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleRoleSelect('student')}
          className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] rounded-lg px-0.5 sm:px-1 cursor-pointer"
        >
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#E04F1D] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#FF6B35]/30">
            <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
          <span>CampusCrave</span>
        </motion.button>

        {/* Zone 2: Clean single-line navigation links with magnetic sliding indicator */}
        <nav aria-label="Primary role navigation" className="flex items-center gap-2.5 sm:gap-6 min-w-0">
          {navLinks.map((item) => {
            const active = item.isAbout
              ? showAbout
              : !showAbout && state.role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.isAbout) {
                    if (showAbout) onCloseAbout();
                    else onOpenAbout();
                  } else {
                    handleRoleSelect(item.id);
                  }
                }}
                className={`relative text-xs sm:text-sm font-medium py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#FF6B35]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="topbar-role-indicator"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className="absolute left-0 right-0 bottom-0 h-0.5 rounded-full bg-[#FF6B35]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={toggleDarkMode}
            aria-label={state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            {state.darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-zinc-600" />
            )}
            <span className="hidden sm:inline">{state.darkMode ? 'Light' : 'Dark'}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

export function ToastViewport() {
  const { toasts } = useCampusCrave();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'warning'
              ? AlertTriangle
              : toast.type === 'error'
              ? XCircle
              : Info;
          const colorClass =
            toast.type === 'success'
              ? 'border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100'
              : toast.type === 'warning'
              ? 'border-amber-200/90 dark:border-amber-800/80 bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100'
              : toast.type === 'error'
              ? 'border-rose-200/90 dark:border-rose-800/80 bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100'
              : 'border-stone-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-xl backdrop-blur-xl text-xs font-medium ${colorClass}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{toast.title}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

