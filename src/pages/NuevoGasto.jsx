import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import { useExpenses } from '../context/ExpenseContext';

const NuevoGasto = () => {
  const navigate = useNavigate();
  const { salary, currentMonthTotal } = useExpenses();

  const remaining = salary > 0 ? salary - currentMonthTotal : null;

  const handleClose = () => {
    navigate('/movimientos');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Nuevo Gasto</h1>
          <p className="text-slate-400 font-medium mt-0.5">Registra un nuevo movimiento.</p>
        </div>
      </div>

      {/* Info sueldo disponible */}
      {remaining !== null && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 flex items-center justify-between border ${
            remaining < 0
              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
          }`}
        >
          <div>
            <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${remaining < 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
              Disponible este mes
            </p>
            <p className={`text-2xl font-black ${remaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              $ {remaining.toLocaleString('es-CL')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400">Sueldo</p>
            <p className="text-sm font-black text-slate-600 dark:text-slate-300">
              $ {salary.toLocaleString('es-CL')}
            </p>
            <p className="text-xs font-bold text-slate-400 mt-1">Gastado</p>
            <p className={`text-sm font-black ${remaining < 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
              $ {currentMonthTotal.toLocaleString('es-CL')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600">
            <PlusCircle size={22} />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-xl tracking-tight">Registrar Gasto</h2>
            <div className="h-1 w-10 bg-indigo-600 rounded-full mt-1" />
          </div>
        </div>

        <ExpenseForm onClose={handleClose} />
      </motion.div>
    </div>
  );
};

export default NuevoGasto;
