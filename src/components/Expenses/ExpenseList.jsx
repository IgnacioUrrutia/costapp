import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Utensils, 
  Home, 
  Truck, 
  HeartPulse, 
  Play, 
  GraduationCap, 
  User, 
  CreditCard, 
  PiggyBank,
  ShoppingBag,
  MoreVertical,
  Calendar,
  Image as ImageIcon,
  Edit2,
  X
} from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';

const ICON_MAP = {
  'Alimentación': Utensils,
  'Vivienda': Home,
  'Transporte': Truck,
  'Salud': HeartPulse,
  'Entretenimiento': Play,
  'Educación': GraduationCap,
  'Personal': User,
  'Financiero': CreditCard,
  'Ahorro/Inversión': PiggyBank,
};

const ExpenseItem = ({ expense, delay, onEdit }) => {
  const { deleteExpense } = useExpenses();
  const [showMenu, setShowMenu] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const Icon = ICON_MAP[expense.category] || ShoppingBag;

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -80) {
      deleteExpense(expense.id, expense.receiptUrl);
    }
    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-[1.5rem]">
      {/* Delete hint — revealed on swipe left */}
      <div
        className="absolute inset-y-0 right-0 w-20 bg-rose-500 flex items-center justify-center rounded-r-[1.5rem] pointer-events-none"
        style={{ opacity: Math.min(Math.abs(dragX) / 80, 1) }}
      >
        <Trash2 size={20} className="text-white" strokeWidth={2.5} />
      </div>

    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay }}
      drag="x"
      dragConstraints={{ left: -100, right: 0 }}
      dragElastic={0.05}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={handleDragEnd}
      className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex items-center gap-4 cursor-grab active:cursor-grabbing"
    >
      <div className={`p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-black text-slate-800 dark:text-white truncate tracking-tight">{expense.description || expense.category}</h4>
          <p className="font-black text-slate-800 dark:text-white whitespace-nowrap text-lg">
            $ {expense.amount.toLocaleString('es-CL')}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {expense.category}
          </span>
          {expense.isInstallment && (
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CreditCard size={10} strokeWidth={3} />
              Cuota {expense.currentInstallment}/{expense.installmentsCount}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
            <Calendar size={12} strokeWidth={3} />
            {new Date(expense.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
        {expense.receiptUrl && (
          <motion.a
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}
            whileTap={{ scale: 0.9 }}
            href={expense.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-slate-300 transition-colors"
            title="Ver Recibo"
          >
            <ImageIcon size={18} strokeWidth={2.5} />
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
                  onPointerDown={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden"
                  onPointerDown={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onEdit?.(expense);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors touch-manipulation"
                  >
                    <Edit2 size={14} className="text-indigo-500" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      deleteExpense(expense.id, expense.receiptUrl);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors touch-manipulation"
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
    </div>
  );
};

const ExpenseList = ({ limit, onEditExpense }) => {
  const { filteredExpenses } = useExpenses();
  
  const displayExpenses = limit ? filteredExpenses.slice(0, limit) : filteredExpenses;

  if (displayExpenses.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center"
      >
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No hay gastos para mostrar</h3>
        <p className="text-slate-400 mt-2 font-medium">Prueba ajustando los filtros o registra un nuevo gasto.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
          {limit ? 'Últimos Movimientos' : 'Todos los Movimientos'}
        </h3>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
          {filteredExpenses.length} Total
        </span>
      </div>

      <div className="grid gap-4 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {displayExpenses.map((expense, index) => (
            <ExpenseItem 
              key={expense.id} 
              expense={expense} 
              delay={index * 0.05}
              onEdit={onEditExpense}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {limit && filteredExpenses.length > limit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 text-center"
        >
          <a
            href="/movimientos"
            className="text-sm font-black text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-widest"
          >
            Ver todos los movimientos →
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default ExpenseList;
