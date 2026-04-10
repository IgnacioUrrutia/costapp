import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Search, Menu, Sun, Moon, HelpCircle, X, LogOut, Settings, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useExpenses } from '../../context/ExpenseContext';

const Navbar = ({ collapsed, toggleMobileMenu, onOpenTutorial }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { budgets, salary } = useExpenses();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);

  // Build contextual notifications
  const notifs = [];
  if (!salary || salary === 0) {
    notifs.push({ id: 'salary', icon: '💰', title: 'Configura tu sueldo', desc: 'Para ver cuánto te queda disponible', to: '/config' });
  }
  const hasBudgets = budgets && Object.values(budgets).some(v => v > 0);
  if (!hasBudgets) {
    notifs.push({ id: 'budget', icon: '📊', title: 'Define tus presupuestos', desc: 'Fija límites por categoría en Configuración', to: '/config' });
  }
  notifs.push({ id: 'tip', icon: '💡', title: 'Consejo', desc: 'Registra tus gastos del día a día para ver el historial mensual', to: null });

  const unread = notifs.length;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/30 z-[40] transition-all duration-300 flex items-center px-5 sm:px-8 justify-between ${
        collapsed ? 'lg:left-[72px]' : 'lg:left-64'
      } left-0`}
    >
      {/* Left */}
      <div className="flex items-center gap-4 flex-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMobileMenu}
          className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-500/20 shadow-sm"
        >
          <Menu size={22} strokeWidth={2.5} />
        </motion.button>

        <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 px-4 py-2.5 rounded-2xl w-full max-w-xs focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30 transition-all group">
          <Search size={17} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-600 dark:text-slate-300 font-semibold placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 ml-4">

        {/* Tutorial */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onOpenTutorial}
          title="Ver tutorial"
          className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
        >
          <HelpCircle size={20} />
        </motion.button>

        {/* Theme */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowNotifs(v => !v); setShowUser(false); }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all relative"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">{unread}</span>
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Notificaciones</p>
                    <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                  {notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 text-sm font-bold">
                      Todo en orden ✓
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {notifs.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {n.to ? (
                            <Link to={n.to} onClick={() => setShowNotifs(false)} className="flex items-start gap-3">
                              <span className="text-xl shrink-0">{n.icon}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-start gap-3">
                              <span className="text-xl shrink-0">{n.icon}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowUser(v => !v); setShowNotifs(false); }}
            className="flex items-center gap-3 group cursor-pointer p-1.5 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50"
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors tracking-tight leading-tight">
                {user?.displayName?.split(' ')[0] || 'Usuario'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 border-2 border-white dark:border-slate-800 overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} strokeWidth={2.5} />
              )}
            </div>
          </motion.button>

          <AnimatePresence>
            {showUser && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUser(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.displayName || 'Usuario'}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to="/config"
                      onClick={() => setShowUser(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings size={15} className="text-slate-400" /> Configuración
                    </Link>
                    <Link
                      to="/importar-archivo"
                      onClick={() => setShowUser(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Upload size={15} className="text-slate-400" /> Importar estado de cuenta
                    </Link>
                    <button
                      onClick={() => { setShowUser(false); onOpenTutorial(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <HelpCircle size={15} className="text-slate-400" /> Ver tutorial
                    </button>
                    <button
                      onClick={() => { setShowUser(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
