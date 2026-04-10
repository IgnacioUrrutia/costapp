import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Wallet, Save, Home, Utensils, Truck, HeartPulse,
  Play, GraduationCap, User, CreditCard, PiggyBank, Info,
  TrendingUp, Globe, RefreshCw, Download, WifiOff,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { parseAmount } from '../utils/format';
import { toast } from 'react-hot-toast';

// ── Indicador de conexión ──────────────────────────────────────────────────────
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

const ICON_MAP = {
  'Vivienda': Home,
  'Alimentación': Utensils,
  'Transporte': Truck,
  'Salud': HeartPulse,
  'Entretenimiento': Play,
  'Educación': GraduationCap,
  'Personal': User,
  'Financiero': CreditCard,
  'Ahorro/Inversión': PiggyBank,
};

const COLOR_MAP = {
  'Vivienda': 'text-blue-500 bg-blue-500/10',
  'Alimentación': 'text-emerald-500 bg-emerald-500/10',
  'Transporte': 'text-amber-500 bg-amber-500/10',
  'Salud': 'text-rose-500 bg-rose-500/10',
  'Entretenimiento': 'text-purple-500 bg-purple-500/10',
  'Educación': 'text-indigo-500 bg-indigo-500/10',
  'Personal': 'text-pink-500 bg-pink-500/10',
  'Financiero': 'text-slate-500 bg-slate-500/10',
  'Ahorro/Inversión': 'text-teal-500 bg-teal-500/10',
};

const Configuracion = () => {
  const { user } = useAuth();
  const {
    salary, setSalary,
    budgets, setBudgets,
    categories, currentMonthTotal,
    currency, setCurrency,
    exchangeRate, setExchangeRate,
    suggestedBudgets,
    expenses, debts, goals, creditCards,
    recurringExpenses, additionalIncomes, debitBalance,
  } = useExpenses();

  const online = useOnlineStatus();

  const handleBackup = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      expenses,
      debts,
      goals,
      creditCards,
      recurringExpenses,
      additionalIncomes,
      salary,
      budgets,
      debitBalance,
      currency,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costapp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup descargado correctamente');
  };

  const [localSalary, setLocalSalary] = useState('');
  const [localBudgets, setLocalBudgets] = useState({});
  const [salaryDirty, setSalaryDirty] = useState(false);
  const [budgetsDirty, setBudgetsDirty] = useState(false);
  const [localExchangeRate, setLocalExchangeRate] = useState('');
  const [exchangeDirty, setExchangeDirty] = useState(false);

  useEffect(() => {
    setLocalExchangeRate(exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    setLocalSalary(salary > 0 ? salary.toString() : '');
  }, [salary]);

  useEffect(() => {
    setLocalBudgets({ ...budgets });
  }, [budgets]);

  const totalBudgeted = Object.values(localBudgets).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const remaining = (parseFloat(localSalary) || 0) - totalBudgeted;

  const handleSaveSalary = () => {
    setSalary(parseAmount(localSalary));
    setSalaryDirty(false);
  };

  const handleSaveBudgets = () => {
    const parsed = {};
    Object.entries(localBudgets).forEach(([k, v]) => {
      parsed[k] = parseAmount(v) || 0;
    });
    setBudgets(parsed);
    setBudgetsDirty(false);
  };

  const handleBudgetChange = (cat, value) => {
    setLocalBudgets((prev) => ({ ...prev, [cat]: value }));
    setBudgetsDirty(true);
  };

  const pctSpent = salary > 0 ? Math.min((currentMonthTotal / salary) * 100, 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Indicador offline */}
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3"
        >
          <WifiOff size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
            Sin conexión — los cambios se sincronizarán cuando vuelvas a conectarte.
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 data-tutorial-id="config-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Configuración</h1>
          <p className="text-slate-400 font-medium mt-1">Define tu sueldo y límites por categoría para controlar tu mes.</p>
        </div>
        <button
          onClick={handleBackup}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-bold rounded-2xl transition shadow-sm"
        >
          <Download size={15} /> Exportar backup
        </button>
      </div>

      {/* Perfil usuario */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
          <User size={28} strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-black text-slate-800 dark:text-white text-lg tracking-tight">
            {user?.displayName || 'Usuario'}
          </p>
          <p className="text-slate-400 text-sm font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Sueldo mensual */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600">
            <Wallet size={22} />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-xl">Sueldo Mensual Neto</h2>
            <p className="text-slate-400 text-sm font-medium">Base de todos los cálculos del mes</p>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              Monto mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={localSalary}
                onChange={(e) => { setLocalSalary(e.target.value); setSalaryDirty(true); }}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveSalary}
            disabled={!salaryDirty}
            className="px-6 py-4 bg-indigo-600 disabled:opacity-40 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            Guardar
          </motion.button>
        </div>

        {salary > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sueldo</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">
                $ {salary.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gastado</p>
              <p className={`text-lg font-black ${pctSpent > 80 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                $ {currentMonthTotal.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Disponible</p>
              <p className={`text-lg font-black ${(salary - currentMonthTotal) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                $ {(salary - currentMonthTotal).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Moneda y Conversión */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600">
            <Globe size={22} />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-xl">Moneda y Conversión</h2>
            <p className="text-slate-400 text-sm font-medium">Define tu moneda base y tasa de cambio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Moneda Principal</label>
            <div className="flex gap-2">
              {['CLP', 'USD'].map(cur => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${currency === cur ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo de Cambio (1 USD = ? CLP)</label>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={localExchangeRate}
                onChange={(e) => { setLocalExchangeRate(e.target.value); setExchangeDirty(true); }}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold outline-none"
              />
              <button
                onClick={() => { setExchangeRate(parseAmount(localExchangeRate)); setExchangeDirty(false); }}
                disabled={!exchangeDirty}
                className="px-4 bg-indigo-600 text-white rounded-xl disabled:opacity-40"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inteligencia: Presupuesto Sugerido */}
      {Object.keys(suggestedBudgets).length > 0 && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 text-white">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="font-black text-xl">Sugerencias Inteligentes</h2>
              <p className="text-indigo-100 text-sm font-medium">Basado en tus últimos 3 meses de gastos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(suggestedBudgets).slice(0, 4).map(([cat, amount]) => (
              <div key={cat} className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{cat}</p>
                  <p className="text-lg font-black">$ {amount.toLocaleString('es-CL')}</p>
                </div>
                <button 
                  onClick={() => handleBudgetChange(cat, amount.toString())}
                  className="text-[10px] font-black uppercase bg-white text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presupuestos por categoría */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 dark:text-white text-xl">Presupuesto por Categoría</h2>
              <p className="text-slate-400 text-sm font-medium">Asigna un límite mensual a cada gasto</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveBudgets}
            disabled={!budgetsDirty}
            className="px-5 py-3 bg-emerald-600 disabled:opacity-40 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-2 text-sm"
          >
            <Save size={16} />
            Guardar todo
          </motion.button>
        </div>

        {/* Resumen total presupuestado */}
        {(parseFloat(localSalary) || 0) > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <Info size={16} />
              <span className="text-sm font-bold">Total presupuestado:</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-slate-800 dark:text-white">
                $ {totalBudgeted.toLocaleString('es-CL')}
              </span>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${remaining >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'}`}>
                {remaining >= 0 ? `Sobran $ ${remaining.toLocaleString('es-CL')}` : `Exceso $ ${Math.abs(remaining).toLocaleString('es-CL')}`}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.name] || Wallet;
            const colorClass = COLOR_MAP[cat.name] || 'text-slate-500 bg-slate-500/10';
            const budget = parseFloat(localBudgets[cat.name]) || 0;
            const spent = 0; // podría conectarse a categoryTotals
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <p className="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight">{cat.name}</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={localBudgets[cat.name] || ''}
                    onChange={(e) => handleBudgetChange(cat.name, e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
