import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AppTutorial from '../Tutorial/AppTutorial';
import GlobalSearch from '../UI/GlobalSearch';
import OnboardingModal, { ONBOARDING_KEY } from '../UI/OnboardingModal';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';

const TUTORIAL_KEY = 'costapp_tutorial_seen_v1';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { salary, loading } = useExpenses();

  // Show tutorial on first login
  useEffect(() => {
    if (!user) return;
    const key = `${TUTORIAL_KEY}_${user.uid}`;
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Show onboarding when salary is not set and user hasn't dismissed it
  useEffect(() => {
    if (!user || loading) return;
    if (salary === 0 && !localStorage.getItem(ONBOARDING_KEY)) {
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, [user, salary, loading]);

  const closeTutorial = () => {
    if (user) {
      localStorage.setItem(`${TUTORIAL_KEY}_${user.uid}`, '1');
    }
    setShowTutorial(false);
  };

  const openTutorial = () => setShowTutorial(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen page-themed">
      <Sidebar
        collapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={mobileOpen}
        setIsMobileOpen={setMobileOpen}
      />

      <Navbar
        collapsed={!sidebarOpen}
        toggleMobileMenu={() => setMobileOpen((prev) => !prev)}
        onOpenTutorial={openTutorial}
      />

      <main
        className={`pt-24 px-5 sm:px-8 pb-10 transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <AnimatePresence>
        {showTutorial && <AppTutorial onClose={closeTutorial} />}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      </AnimatePresence>

      <GlobalSearch />
    </div>
  );
};

export default MainLayout;
