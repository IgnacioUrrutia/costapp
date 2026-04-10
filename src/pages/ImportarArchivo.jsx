import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Table2, CheckCircle, AlertCircle,
  Loader2, ChevronDown, ChevronUp, X, CreditCard, Landmark, Trash2,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';
import { parsePDFFile, parseExcelFile, guessCategory } from '../utils/bankParsers';
import * as XLSX from 'xlsx';

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

export default function ImportarArchivo() {
  const { addExpense, creditCards, addCreditCard } = useExpenses();
  const navigate = useNavigate();

  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [source, setSource] = useState('');
  const [cardInfo, setCardInfo] = useState(null);
  const [cardAction, setCardAction] = useState('create'); // 'create' | existing card id
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef();

  // ── File processing ─────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    setParseError(null);
    try {
      let result;
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        const buf = await file.arrayBuffer();
        result = await parsePDFFile(buf);
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Make XLSX available for the parser
        window._XLSX = XLSX;
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        result = parseExcelFile(wb);
      } else {
        setParseError('Formato no soportado. Usa archivos .pdf, .xlsx o .xls');
        return;
      }

      if (!result || result.transactions.length === 0) {
        setParseError('No se encontraron transacciones en el archivo. Verifica que sea un estado de cuenta válido.');
        return;
      }

      setSource(result.source);
      setCardInfo(result.cardInfo);

      // Check if card already exists by last4
      if (result.cardInfo?.last4) {
        const existing = creditCards.find(c =>
          c.name?.includes(result.cardInfo.last4) ||
          c.last4 === result.cardInfo.last4
        );
        setCardAction(existing ? existing.id : 'create');
      } else {
        setCardAction('create');
      }

      setItems(result.transactions.map((t, i) => ({ ...t, id: i, selected: true })));
      setStep('preview');
    } catch (err) {
      console.error(err);
      setParseError('Error al procesar el archivo: ' + err.message);
    }
  }, [creditCards]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Import ───────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) return;
    setStep('importing');
    setProgress(0);

    // Create card if needed
    let linkedCardId = cardAction !== 'create' ? cardAction : null;
    if (cardAction === 'create' && cardInfo) {
      await addCreditCard({
        name: cardInfo.name,
        type: cardInfo.type,
        last4: cardInfo.last4,
        creditLimit: cardInfo.creditLimit || 0,
        usedAmount: 0,
        bank: cardInfo.bank || '',
      });
      // Find the newly created card
      const newCard = creditCards.find(c => c.name === cardInfo.name);
      if (newCard) linkedCardId = newCard.id;
    }

    for (let idx = 0; idx < selected.length; idx++) {
      const item = selected[idx];
      await addExpense({
        description: item.description,
        amount: item.amount,
        category: item.category,
        date: item.date,
        ...(linkedCardId ? { creditCardId: linkedCardId } : {}),
      });
      setProgress(Math.round(((idx + 1) / selected.length) * 100));
      await new Promise(r => setTimeout(r, 100));
    }

    setImportedCount(selected.length);
    setStep('done');
  };

  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const changeCategory = (id, cat) => setItems(prev => prev.map(i => i.id === id ? { ...i, category: cat } : i));
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const selectedItems = items.filter(i => i.selected);
  const total = selectedItems.reduce((a, i) => a + i.amount, 0);
  const visibleItems = showAll ? items : items.slice(0, 10);

  // ── DONE screen ──────────────────────────────────────────────────────────
  if (step === 'done') {
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
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">¡Listo!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold text-slate-800 dark:text-white">{importedCount} gastos</span> importados desde
          </p>
          <p className="text-xs text-indigo-600 font-bold mb-6">{source}</p>
          {cardAction === 'create' && cardInfo && (
            <p className="text-xs text-emerald-600 font-bold mb-6">
              ✓ Tarjeta "{cardInfo.name}" creada automáticamente
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setItems([]); setCardInfo(null); setSource(''); }}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-2xl text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Otro archivo
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-sm transition"
            >
              Ver Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── UPLOAD screen ────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Importar desde Archivo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sube tu estado de cuenta bancario y te importamos los gastos automáticamente
          </p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center gap-4 cursor-pointer transition ${
            dragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
          }`}
        >
          <div className="p-4 bg-indigo-100 dark:bg-indigo-950 rounded-2xl">
            <Upload size={28} className="text-indigo-600" />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-800 dark:text-white text-lg">
              Arrastra tu archivo aquí
            </p>
            <p className="text-sm text-slate-400 mt-1">o haz clic para seleccionar</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" onChange={onFileChange} className="hidden" />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {parseError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl px-4 py-3"
            >
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{parseError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supported formats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {[
            {
              icon: Table2,
              title: 'Excel (.xlsx)',
              items: ['Banco de Chile – Cuenta Corriente', 'CMR Falabella', 'Cualquier Excel con columnas de fecha y monto'],
              color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
            },
            {
              icon: FileText,
              title: 'PDF',
              items: ['Santander Mastercard', 'CMR Falabella PDF', 'Otros bancos (detección automática)'],
              color: 'text-rose-600 bg-rose-50 dark:bg-rose-950',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${f.color}`}>
                  <f.icon size={18} />
                </div>
                <p className="font-black text-slate-800 dark:text-white">{f.title}</p>
              </div>
              <ul className="space-y-1">
                {f.items.map((item) => (
                  <li key={item} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  // ── IMPORTING screen ─────────────────────────────────────────────────────
  if (step === 'importing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-10 shadow-xl text-center max-w-sm w-full"
        >
          <Loader2 size={40} className="text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Importando...</h2>
          <p className="text-sm text-slate-400 mb-6">{progress}% completado</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── PREVIEW screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Revisar y confirmar
            </h1>
            <p className="text-sm text-indigo-600 font-bold mt-0.5">{source}</p>
          </div>
          <button
            onClick={() => { setStep('upload'); setItems([]); }}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
          >
            <X size={16} /> Cancelar
          </button>
        </div>
      </motion.div>

      {/* Card section */}
      {cardInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Tarjeta detectada
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${cardInfo.type === 'debit' ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-blue-50 dark:bg-blue-950'}`}>
              {cardInfo.type === 'debit'
                ? <Landmark size={18} className="text-emerald-600" />
                : <CreditCard size={18} className="text-blue-600" />
              }
            </div>
            <div>
              <p className="font-black text-slate-800 dark:text-white">{cardInfo.name}</p>
              <p className="text-xs text-slate-400">
                {cardInfo.type === 'debit' ? 'Débito' : 'Crédito'} · {cardInfo.bank}
              </p>
            </div>
          </div>

          {/* Card linking options */}
          <div className="space-y-2">
            <button
              onClick={() => setCardAction('create')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold text-left transition ${
                cardAction === 'create'
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              }`}
            >
              <CheckCircle size={15} className={cardAction === 'create' ? 'text-indigo-600' : 'text-slate-300'} />
              Crear tarjeta automáticamente en mis tarjetas
            </button>
            {creditCards.map(card => (
              <button
                key={card.id}
                onClick={() => setCardAction(card.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold text-left transition ${
                  cardAction === card.id
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                }`}
              >
                <CheckCircle size={15} className={cardAction === card.id ? 'text-indigo-600' : 'text-slate-300'} />
                Vincular a: {card.name}
              </button>
            ))}
            <button
              onClick={() => setCardAction(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold text-left transition ${
                cardAction === null
                  ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
              }`}
            >
              <CheckCircle size={15} className={cardAction === null ? 'text-slate-600' : 'text-slate-300'} />
              No vincular a ninguna tarjeta
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Seleccionados', value: `${selectedItems.length} / ${items.length}` },
          { label: 'Total', value: `$${fmt(total)}` },
          { label: 'Archivo', value: source.split(' ')[0] },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className="text-base font-black text-slate-800 dark:text-white truncate">{s.value}</p>
          </div>
        ))}
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
            onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: !items.every(x => x.selected) })))}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            {items.every(i => i.selected) ? 'Desmarcar todo' : 'Seleccionar todo'}
          </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {visibleItems.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-6 py-3 transition ${!item.selected ? 'opacity-40' : ''}`}>
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.description}</p>
                <p className="text-xs text-slate-400">
                  {new Date(item.date + 'T00:00:00').toLocaleDateString('es-CL')}
                </p>
              </div>
              <select
                value={item.category}
                onChange={(e) => changeCategory(item.id, e.target.value)}
                className={`text-[10px] font-bold px-2 py-1 rounded-xl border-0 cursor-pointer ${CAT_COLORS[item.category] || ''}`}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-sm font-black text-slate-800 dark:text-white shrink-0 ml-1">
                ${fmt(item.amount)}
              </span>
              <button onClick={() => removeItem(item.id)} className="p-1 text-slate-300 hover:text-rose-400 transition shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {items.length > 10 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-50 dark:border-slate-800 transition"
          >
            {showAll ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver {items.length - 10} más</>}
          </button>
        )}
      </motion.div>

      {/* Import button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <button
          onClick={handleImport}
          disabled={selectedItems.length === 0}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition text-base"
        >
          <Upload size={18} />
          Importar {selectedItems.length} gastos · ${fmt(total)}
        </button>
      </motion.div>

    </div>
  );
}
