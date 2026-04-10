import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, PiggyBank, X, Upload, MoreVertical, Edit2,
  Home, Utensils, Truck, HeartPulse, Play, GraduationCap,
  ShoppingBag, Trash2, Calendar, Search
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseFilters from '../components/Expenses/ExpenseFilters';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import ImportTool from '../components/Expenses/ImportTool';
import Modal from '../components/UI/Modal';
import { Image as ImageIcon } from 'lucide-react';

const ICON_MAP = {
  'Alimentación': Utensils, 'Vivienda': Home, 'Transporte': Truck,
  'Salud': HeartPulse, 'Entretenimiento': Play, 'Educación': GraduationCap,
  'Personal': User, 'Financiero': CreditCard, 'Ahorro/Inversión': PiggyBank,
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

const ExpenseRow = ({ expense, onEdit }) => {
  const { deleteExpense } = useExpenses();
  const [showMenu, setShowMenu] = React.useState(false);
  const Icon = ICON_MAP[expense.category] || ShoppingBag;
  const colorClass = COLOR_MAP[expense.category] || 'text-slate-500 bg-slate-500/10';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all group flex items-center gap-4"
    >
      <div className={`p-3.5 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300 ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-black text-slate-800 dark:text-white tracking-tight truncate">
              {expense.description || expense.category}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {expense.category}
              </span>
              {expense.isInstallment && (
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CreditCard size={10} strokeWidth={3} />
                  Cuota {expense.currentInstallment}/{expense.installmentsCount}
                </span>
              )}
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                <Calendar size={11} strokeWidth={3} />
                {new Date(expense.date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            {expense.isInstallment && expense.installmentsCount > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((expense.currentInstallment / expense.installmentsCount) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-violet-500">
                  {Math.round((expense.currentInstallment / expense.installmentsCount) * 100)}%
                </span>
              </div>
            )}
          </div>
          <p className="font-black text-slate-800 dark:text-white text-lg whitespace-nowrap shrink-0">
            $ {expense.amount.toLocaleString('es-CL')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
        {expense.receiptUrl && (
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            href={expense.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            title="Ver Recibo"
          >
            <ImageIcon size={16} strokeWidth={2.5} />
          </motion.a>
        )}
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2.5 rounded-xl transition-colors ${showMenu ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onEdit(expense);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Edit2 size={14} className="text-indigo-500" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      deleteExpense(expense.id, expense.receiptUrl);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const Movimientos = () => {
  const { filteredExpenses, salary, currentMonthTotal } = useExpenses();
  const [search, setSearch] = useState('');
  const [editExpense, setEditExpense] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const displayed = useMemo(() => {
    if (!search.trim()) return filteredExpenses;
    const q = search.toLowerCase();
    return filteredExpenses.filter(
      (exp) =>
        (exp.description || '').toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
    );
  }, [filteredExpenses, search]);

  const totalDisplayed = displayed.reduce((acc, exp) => acc + exp.amount, 0);
  const installmentExpenses = displayed.filter(exp => exp.isInstallment);
  const totalInstallments = installmentExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Movimientos</h1>
          <p className="text-slate-400 font-medium mt-1">Historial completo de tus gastos.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            <Upload size={16} className="text-indigo-500" />
            Importar
          </button>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl w-full sm:w-80 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30 transition-all group">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors shrink-0" />
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-300 font-semibold placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <ImportTool onComplete={() => setShowImport(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <ExpenseFilters />

      {/* Resumen del período */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registros</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{displayed.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Mostrado</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            $ {totalDisplayed.toLocaleString('es-CL')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Promedio</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            $ {displayed.length > 0 ? (totalDisplayed / displayed.length).toLocaleString('es-CL') : '0.00'}
          </p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${salary > 0 && currentMonthTotal > salary ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Disponible</p>
          <p className={`text-2xl font-black ${salary > 0 && currentMonthTotal > salary ? 'text-rose-500' : 'text-emerald-500'}`}>
            {salary > 0 ? `$ ${(salary - currentMonthTotal).toLocaleString('es-CL')}` : '—'}
          </p>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${installmentExpenses.length > 0 ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">En Cuotas</p>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
            {installmentExpenses.length > 0 ? `$ ${totalInstallments.toLocaleString('es-CL')}` : '—'}
          </p>
          {installmentExpenses.length > 0 && (
            <p className="text-[10px] font-bold text-violet-400 mt-0.5">{installmentExpenses.length} pago{installmentExpenses.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Modal edición */}
      <AnimatePresence>
        {editExpense && (
          <Modal
            isOpen={!!editExpense}
            onClose={() => setEditExpense(null)}
            title="Editar Gasto"
          >
            <ExpenseForm
              initialData={editExpense}
              onClose={() => setEditExpense(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Lista */}
      {displayed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-16 text-center"
        >
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No hay movimientos</h3>
          <p className="text-slate-400 mt-2 font-medium">
            {search ? 'Ningún resultado para tu búsqueda.' : 'Ajusta los filtros o registra un nuevo gasto.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              {displayed.length} movimiento{displayed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <AnimatePresence mode="popLayout">
            {displayed.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={setEditExpense}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
