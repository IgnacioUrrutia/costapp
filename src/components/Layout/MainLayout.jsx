import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AppTutorial from '../Tutorial/AppTutorial';
import { useAuth } from '../../context/AuthContext';

const TUTORIAL_KEY = 'costapp_tutorial_seen_v1';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Show tutorial on first login
  useEffect(() => {
    if (!user) return;
    const key = `${TUTORIAL_KEY}_${user.uid}`;
    if (!localStorage.getItem(key)) {
      // Small delay so the dashboard loads first
      const t = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
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

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AnimatePresence>
        {showTutorial && <AppTutorial onClose={closeTutorial} />}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
