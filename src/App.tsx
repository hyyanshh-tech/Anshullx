import React, { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { CampusCraveProvider, useCampusCrave } from './context/CampusCraveContext';
import { TopBar, ToastViewport } from './components/TopBarAndToasts';
import { AboutCampusCrave } from './components/AboutCampusCrave';
import { OnboardingAndLanding } from './components/OnboardingAndLanding';
import { StudentAppShell } from './components/StudentAppShell';
import { VendorPortal } from './components/VendorPortal';
import { AdminDashboard } from './components/AdminDashboard';

function CampusCraveMain() {
  const { state, setRole } = useCampusCrave();
  const [showAbout, setShowAbout] = useState(false);

  const workspaceKey = showAbout
    ? 'about'
    : state.role === 'vendor'
    ? 'vendor'
    : state.role === 'admin'
    ? 'admin'
    : state.hasCompletedOnboarding
    ? 'student'
    : 'onboarding';

  const renderWorkspace = () => {
    if (showAbout) {
      return (
        <AboutCampusCrave
          onBack={() => setShowAbout(false)}
          onSelectRole={(role) => {
            setShowAbout(false);
            setRole(role);
          }}
        />
      );
    }

    if (state.role === 'vendor') {
      return <VendorPortal />;
    }

    if (state.role === 'admin') {
      return <AdminDashboard />;
    }

    if (!state.hasCompletedOnboarding) {
      return <OnboardingAndLanding onOpenAbout={() => setShowAbout(true)} />;
    }

    return <StudentAppShell onOpenAbout={() => setShowAbout(true)} />;
  };

  return (
    <div className="relative min-h-screen bg-[#FBF9F6] dark:bg-[#0B0D11] text-zinc-900 dark:text-zinc-100 transition-colors overflow-x-clip">
      {/* Ambient Architectural Coordinate Grid & Studio Auras */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 cc-arch-grid opacity-80" />
        <div className="absolute -top-36 -left-24 w-[460px] h-[460px] rounded-full bg-[#FF6B35]/[0.08] dark:bg-[#FF6B35]/[0.11] blur-3xl animate-cc-aura" />
        <div className="absolute top-1/3 -right-28 w-[420px] h-[420px] rounded-full bg-[#15803D]/[0.06] dark:bg-[#10B981]/[0.09] blur-3xl animate-cc-aura-reverse" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBar
          showAbout={showAbout}
          onOpenAbout={() => setShowAbout(true)}
          onCloseAbout={() => setShowAbout(false)}
        />
        <ToastViewport />
        <AnimatePresence mode="wait">
          <motion.div
            key={workspaceKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            {renderWorkspace()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CampusCraveProvider>
        <CampusCraveMain />
      </CampusCraveProvider>
    </MotionConfig>
  );
}

