import React from 'react';
import {
  LayoutDashboard, PlusCircle, Table, Settings, LogOut,
  ChevronLeft, ChevronRight, X, Wallet, RefreshCw,
  CreditCard, Target, CalendarDays, BarChart2, TrendingUp,
  PieChart, LineChart, Trophy, Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: PlusCircle, label: 'Nuevo Gasto', path: '/nuevo' },
      { icon: Table, label: 'Movimientos', path: '/movimientos' },
    ],
  },
  {
    label: 'Ingresos',
    items: [
      { icon: TrendingUp, label: 'Ingresos', path: '/ingresos' },
      { icon: RefreshCw, label: 'Recurrentes', path: '/recurrentes' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { icon: PieChart,   label: 'Presupuesto',  path: '/presupuesto' },
      { icon: CreditCard, label: 'Deudas',        path: '/deudas' },
      { icon: Wallet,     label: 'Tarjetas',      path: '/tarjetas' },
      { icon: Target,     label: 'Metas',         path: '/metas' },
      { icon: Users,      label: 'Familia',       path: '/familia' },
    ],
  },
  {
    label: 'Reportes',
    items: [
      { icon: LineChart,   label: 'Proyección',    path: '/proyeccion' },
      { icon: CalendarDays, label: 'Calendario',   path: '/calendario' },
      { icon: BarChart2,   label: 'Resumen Anual', path: '/anual' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { icon: Settings, label: 'Configuración', path: '/config' },
      { icon: Trophy,   label: 'Logros',        path: '/logros' },
    ],
  },
];

const SidebarItem = ({ icon: Icon, label, path, active, collapsed, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group ${
      active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}
  >
    {active && (
      <motion.div
        layoutId="activeNav"
        className="absolute inset-0 nav-active-bg rounded-xl -z-10"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
    <Icon size={20} className={`shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`} />
    {!collapsed && (
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">{label}</span>
    )}
  </Link>
);

const Sidebar = ({ collapsed, onToggleCollapse, isMobileOpen, setIsMobileOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await toast.promise(logout(), {
        loading: 'Cerrando sesión...', success: '¡Hasta pronto!', error: 'Error al cerrar sesión',
      });
    } catch (e) { console.error(e); }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 border-b-2 border-indigo-700/50 shrink-0"
          >
            <span className="text-white font-black text-xl italic">$</span>
          </motion.div>
          {!collapsed && (
            <span className="text-white font-black text-xl tracking-tighter">CostApp</span>
          )}
        </Link>
        <div className="flex items-center">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onPointerDown={() => setIsMobileOpen(false)}
            className="lg:hidden p-3 rounded-lg bg-slate-800/50 text-slate-400 active:text-rose-500 transition-all border border-white/5 touch-manipulation"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-5 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-3 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.path}
                  {...item}
                  active={location.pathname === item.path}
                  collapsed={collapsed}
                  onClick={() => setIsMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50 shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 group"
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="font-bold text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen sidebar-themed border-r z-[50] shadow-2xl transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile — backdrop y panel separados para evitar que el backdrop capture eventos del botón X */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[48]"
            onPointerDown={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 h-screen w-64 sidebar-themed border-r z-[49] shadow-2xl flex flex-col"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
