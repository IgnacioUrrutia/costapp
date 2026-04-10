import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CATEGORY_COLORS = {
  Vivienda: 'bg-blue-500',
  Alimentación: 'bg-emerald-500',
  Transporte: 'bg-amber-500',
  Salud: 'bg-rose-500',
  Entretenimiento: 'bg-purple-500',
  Educación: 'bg-indigo-500',
  Personal: 'bg-pink-500',
  Financiero: 'bg-slate-500',
  'Ahorro/Inversión': 'bg-teal-500',
};

const UNIQUE_CATEGORIES = Object.keys(CATEGORY_COLORS);
const CATEGORY_COLORS_BORDER = {
  Vivienda: 'border-blue-400',
  Alimentación: 'border-emerald-400',
  Transporte: 'border-amber-400',
  Salud: 'border-rose-400',
  Entretenimiento: 'border-purple-400',
  Educación: 'border-indigo-400',
  Personal: 'border-pink-400',
  Financiero: 'border-slate-400',
  'Ahorro/Inversión': 'border-teal-400',
};

// Build a 6×7 calendar grid for a given month/year
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let day = 1;
  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;
      if (cellIndex < firstDay || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day++);
      }
    }
    grid.push(week);
    if (day > daysInMonth) break;
  }
  return grid;
}

export default function Calendario() {
  const { expenses } = useExpenses();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Group expenses by day-of-month for current view month
  const expensesByDay = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date + 'T00:00:00');
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(exp);
      }
    });
    return map;
  }, [expenses, viewYear, viewMonth]);

  const selectedExpenses = selectedDay ? (expensesByDay[selectedDay] || []) : [];
  const selectedTotal = selectedExpenses.reduce((a, e) => a + e.amount, 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const isToday = (day) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 data-tutorial-id="calendario-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
          Calendario
        </h1>
        <p className="text-sm text-slate-400 mt-1">Vista mensual de tus gastos</p>
      </motion.div>

      {/* Calendar card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={prevMonth}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <AnimatePresence mode="wait">
            <motion.h2
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-black text-slate-800 dark:text-white"
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </motion.h2>
          </AnimatePresence>
          <button
            onClick={nextMonth}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800/50 last:border-b-0">
                {week.map((day, di) => {
                  const dayExpenses = day ? (expensesByDay[day] || []) : [];
                  const dayTotal = dayExpenses.reduce((a, e) => a + e.amount, 0);
                  const hasExpenses = dayExpenses.length > 0;
                  const active = day === selectedDay;
                  const todayCell = day ? isToday(day) : false;

                  // Get up to 3 unique categories for dots
                  const categories = [...new Set(dayExpenses.map((e) => e.category))].slice(0, 3);

                  return (
                    <div
                      key={di}
                      onClick={() => day && setSelectedDay(active ? null : day)}
                      className={`relative min-h-[72px] p-2 border-r border-slate-50 dark:border-slate-800/50 last:border-r-0 transition-colors ${
                        day
                          ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'bg-slate-50/50 dark:bg-slate-950/50'
                      } ${active ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}
                    >
                      {day && (
                        <>
                          {/* Day number */}
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1 ${
                              todayCell
                                ? 'bg-indigo-600 text-white'
                                : active
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {day}
                          </span>

                          {/* Expense dots */}
                          {hasExpenses && (
                            <div className="flex flex-wrap gap-0.5 mb-1">
                              {categories.map((cat) => (
                                <div
                                  key={cat}
                                  className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[cat] || 'bg-slate-400'}`}
                                />
                              ))}
                              {dayExpenses.length > 3 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              )}
                            </div>
                          )}

                          {/* Day total */}
                          {hasExpenses && (
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                              ${fmt(dayTotal)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Day detail popover */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 dark:text-white">
                  {selectedDay} de {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <span className="text-xs font-bold text-slate-400 ml-1">
                  {selectedExpenses.length} gasto{selectedExpenses.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-indigo-600">
                  ${fmt(selectedTotal)}
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {selectedExpenses.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No hay gastos en este día
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {selectedExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center gap-3 px-6 py-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[exp.category] || 'bg-slate-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {exp.description}
                      </p>
                      <p className="text-xs text-slate-400">{exp.category}</p>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white shrink-0">
                      ${fmt(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Leyenda de categorías
        </p>
        <div className="flex flex-wrap gap-3">
          {UNIQUE_CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat]}`} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{cat}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
