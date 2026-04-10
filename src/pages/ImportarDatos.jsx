import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const CATEGORIES = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud',
  'Entretenimiento', 'Educación', 'Personal', 'Financiero', 'Ahorro/Inversión',
];

const CAT_COLORS = {
  Alimentación: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  Transporte: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  Vivienda: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  Salud: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  Entretenimiento: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  Educación: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  Personal: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  Financiero: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  'Ahorro/Inversión': 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
};

// ── Transacciones extraídas del Estado de Cuenta Santander Mastercard Life XXXX-2836
// ── Período: 26/02/2026 – 30/03/2026
const RAW_TRANSACTIONS = [
  // Febrero 2026
  { date: '2026-02-27', description: 'Bazar Tía Ani', amount: 2900, category: 'Personal' },
  { date: '2026-02-28', description: 'MercadoPago Hawaii', amount: 18980, category: 'Alimentación' },
  // Marzo 2026
  { date: '2026-03-01', description: 'Uber Trip', amount: 5094, category: 'Transporte' },
  { date: '2026-03-03', description: 'Gustapan Independencia', amount: 2600, category: 'Alimentación' },
  { date: '2026-03-06', description: 'MercadoPago Koreamar', amount: 13300, category: 'Alimentación' },
  { date: '2026-03-07', description: 'Uber Trip', amount: 2838, category: 'Transporte' },
  { date: '2026-03-07', description: 'Farmacia Erica', amount: 5990, category: 'Salud' },
  { date: '2026-03-13', description: 'Gustapan Independencia', amount: 2600, category: 'Alimentación' },
  { date: '2026-03-13', description: 'Express Sto Dgo', amount: 1450, category: 'Alimentación' },
  { date: '2026-03-15', description: 'FG Norte', amount: 10000, category: 'Personal' },
  { date: '2026-03-16', description: 'Recorrido (Bus/Metro)', amount: 41820, category: 'Transporte' },
  { date: '2026-03-16', description: 'Mundomedio GE', amount: 1500, category: 'Personal' },
  { date: '2026-03-16', description: 'Mundomedio GE', amount: 1500, category: 'Personal' },
  { date: '2026-03-17', description: 'Donde el Nico', amount: 4263, category: 'Alimentación' },
  { date: '2026-03-18', description: 'Comisión TC Fuera de Plan', amount: 4781, category: 'Financiero' },
  { date: '2026-03-19', description: 'Claude.ai Subscription', amount: 22622, category: 'Personal' },
  { date: '2026-03-19', description: 'Express Sto Dgo', amount: 3270, category: 'Alimentación' },
  { date: '2026-03-19', description: 'Gustapan', amount: 2600, category: 'Alimentación' },
  { date: '2026-03-21', description: 'Farmacia Erica', amount: 2000, category: 'Salud' },
  { date: '2026-03-21', description: 'Botillería Parraguez', amount: 22100, category: 'Entretenimiento' },
  { date: '2026-03-22', description: 'Uber', amount: 3990, category: 'Transporte' },
  { date: '2026-03-22', description: 'Bazar Tía Ani', amount: 4550, category: 'Personal' },
  { date: '2026-03-22', description: 'Bazar Tía Ani', amount: 1500, category: 'Personal' },
  { date: '2026-03-23', description: 'Integra Autos Maipú', amount: 7880, category: 'Transporte' },
  { date: '2026-03-23', description: 'Gustapan', amount: 2600, category: 'Alimentación' },
  { date: '2026-03-23', description: 'Bajón Divino', amount: 8600, category: 'Entretenimiento' },
  { date: '2026-03-23', description: 'MP Octavio U.', amount: 30000, category: 'Personal' },
  { date: '2026-03-24', description: 'Mateeeeeeo', amount: 5080, category: 'Entretenimiento' },
  { date: '2026-03-24', description: 'Express Sto Dgo', amount: 1190, category: 'Alimentación' },
  { date: '2026-03-25', description: 'Telecarane', amount: 6200, category: 'Personal' },
  { date: '2026-03-26', description: 'Frutas Magnolia', amount: 2800, category: 'Alimentación' },
  { date: '2026-03-26', description: 'Panificadora Ralun', amount: 3094, category: 'Alimentación' },
  { date: '2026-03-26', description: 'Mundomedio GE', amount: 1500, category: 'Personal' },
  { date: '2026-03-27', description: 'Bajón Divino', amount: 18000, category: 'Entretenimiento' },
  { date: '2026-03-27', description: 'Mateeeeeeo', amount: 2700, category: 'Entretenimiento' },
  { date: '2026-03-28', description: 'Sodimac Maipú', amount: 56920, category: 'Vivienda' },
  { date: '2026-03-28', description: 'Botillería Scarfac', amount: 11400, category: 'Entretenimiento' },
  { date: '2026-03-29', description: 'Bazar Tía Ani', amount: 1350, category: 'Personal' },
  { date: '2026-03-30', description: 'IVA Uso Internacional', amount: 150, category: 'Financiero' },
  { date: '2026-03-30', description: 'Servicio Compra Internacional', amount: 791, category: 'Financiero' },
  { date: '2026-03-30', description: 'Cuota Deuda Nacional (5/5)', amount: 83771, category: 'Financiero' },
  { date: '2026-03-30', description: 'Cuota Gelo Plaza Maipú SPA (2/2)', amount: 17479, category: 'Personal' },
];

export default function ImportarDatos() {
  const { addExpense } = useExpenses();
  const navigate = useNavigate();

  const [items, setItems] = useState(
    RAW_TRANSACTIONS.map((t, i) => ({ ...t, id: i, selected: true }))
  );
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const selectedItems = items.filter((i) => i.selected);
  const total = selectedItems.reduce((acc, i) => acc + i.amount, 0);

  const toggleItem = (id) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const changeCategory = (id, cat) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, category: cat } : i));
  };

  const handleImport = async () => {
    if (selectedItems.length === 0) return;
    setImporting(true);
    setProgress(0);

    for (let idx = 0; idx < selectedItems.length; idx++) {
      const item = selectedItems[idx];
      await addExpense({
        description: item.description,
        amount: item.amount,
        category: item.category,
        date: item.date,
      });
      setProgress(Math.round(((idx + 1) / selectedItems.length) * 100));
      // Small delay to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 120));
    }

    setImporting(false);
    setDone(true);
  };

  const visibleItems = showAll ? items : items.slice(0, 8);

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-10 shadow-xl text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            ¡Importación completada!
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {selectedItems.length} gastos importados correctamente desde tu estado de cuenta Santander.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Puedes eliminar esta página de la app cuando quieras.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition"
          >
            Ver Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-2xl">
            <Upload size={20} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Importar Gastos
          </h1>
        </div>
        <p className="text-sm text-slate-400 ml-1">
          Estado de cuenta <span className="font-bold text-slate-600 dark:text-slate-300">Santander Mastercard Life XXXX-2836</span> · Período Feb–Mar 2026
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Transacciones', value: `${selectedItems.length} / ${items.length}` },
          { label: 'Total a importar', value: `$${fmt(total)}` },
          { label: 'Fuente', value: 'Santander' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3"
      >
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          Revisa las categorías antes de importar. Puedes desmarcar transacciones que no quieras incluir o cambiar su categoría.
        </p>
      </motion.div>

      {/* Transaction list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-slate-800 dark:text-white">Transacciones detectadas</h2>
          <button
            onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: !items.every((x) => x.selected) })))}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            {items.every((i) => i.selected) ? 'Desmarcar todo' : 'Seleccionar todo'}
          </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-6 py-3 transition ${!item.selected ? 'opacity-40' : ''}`}
            >
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {item.description}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(item.date + 'T00:00:00').toLocaleDateString('es-CL')}
                </p>
              </div>
              <select
                value={item.category}
                onChange={(e) => changeCategory(item.id, e.target.value)}
                className={`text-[10px] font-bold px-2 py-1 rounded-xl border-0 cursor-pointer ${CAT_COLORS[item.category] || ''}`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-sm font-black text-slate-800 dark:text-white shrink-0 ml-2">
                ${fmt(item.amount)}
              </span>
            </div>
          ))}
        </div>

        {items.length > 8 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-50 dark:border-slate-800 transition"
          >
            {showAll ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver {items.length - 8} más</>}
          </button>
        )}
      </motion.div>

      {/* Import button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        {importing && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-slate-600 dark:text-slate-300">Importando...</span>
              <span className="font-black text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        <button
          onClick={handleImport}
          disabled={importing || selectedItems.length === 0}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition text-base"
        >
          {importing
            ? <><Loader2 size={18} className="animate-spin" /> Importando {selectedItems.length} gastos...</>
            : <><Upload size={18} /> Importar {selectedItems.length} gastos · ${fmt(total)}</>
          }
        </button>
      </motion.div>

    </div>
  );
}
