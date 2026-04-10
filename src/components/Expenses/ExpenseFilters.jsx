import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { Filter, Calendar, Tag, CreditCard } from 'lucide-react';

const ExpenseFilters = () => {
  const { filters, setFilters, categories } = useExpenses();

  const months = [
    { value: -1, label: 'Todos los Meses' },
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 shadow-sm mb-6">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
        <Filter size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
      </div>

      <div className="flex items-center gap-4 flex-wrap flex-1">
        <div className="relative">
          <select 
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
            className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none text-slate-700 dark:text-slate-200"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Calendar size={14} />
          </div>
        </div>

        <div className="relative">
          <select 
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none text-slate-700 dark:text-slate-200"
          >
            <option value="Todas">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Tag size={14} />
          </div>
        </div>

        {/* Filtro de cuotas */}
        <button
          onClick={() => setFilters({ ...filters, onlyInstallments: !filters.onlyInstallments })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filters.onlyInstallments
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600'
          }`}
        >
          <CreditCard size={14} />
          Cuotas
        </button>
      </div>

      <button 
        onClick={() => setFilters({ month: new Date().getMonth(), year: new Date().getFullYear(), category: 'Todas', onlyInstallments: false })}
        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
      >
        Reiniciar filtros
      </button>
    </div>
  );
};

export default ExpenseFilters;
