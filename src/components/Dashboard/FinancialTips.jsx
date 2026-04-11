import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';

const ALL_TIPS = [
  {
    id: 'avalanche',
    condition: ({ debts }) => debts.length > 1,
    emoji: '❄️',
    title: 'Método Avalancha',
    body: 'Paga primero la deuda con mayor tasa de interés. Pagas menos en total aunque tarde más en ver resultados visibles. Ideal si tienes varias deudas con tasas distintas.',
    tag: 'Deudas',
    tagColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  {
    id: 'snowball',
    condition: ({ debts }) => debts.length > 1,
    emoji: '⛄',
    title: 'Método Bola de Nieve',
    body: 'Paga primero la deuda más pequeña. Cada deuda que liquidas libera flujo de caja y te da motivación para atacar la siguiente. Mejor para quienes necesitan victorias rápidas.',
    tag: 'Deudas',
    tagColor: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  {
    id: 'emergency_fund',
    condition: ({ goals }) =>
      !goals.some(g =>
        g.isEmergency ||
        g.name?.toLowerCase().includes('emergencia') ||
        g.name?.toLowerCase().includes('emergency')
      ),
    emoji: '🛡️',
    title: 'Fondo de Emergencia',
    body: 'Ahorra entre 3 y 6 meses de tus gastos fijos en una cuenta separada. El 55% de las personas no tiene este colchón. Crea una meta llamada "Emergencia" en la sección Metas.',
    tag: 'Ahorro',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  {
    id: 'rule_50_30_20',
    condition: () => true,
    emoji: '🎯',
    title: 'Regla 50/30/20',
    body: '50% de tus ingresos para necesidades (arriendo, comida, servicios), 30% para gustos y 20% para ahorro y deudas. Es un punto de partida, no una camisa de fuerza.',
    tag: 'Presupuesto',
    tagColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
  {
    id: 'pay_yourself_first',
    condition: ({ salary }) => salary > 0,
    emoji: '💰',
    title: 'Págate Primero',
    body: 'Apenas recibas tu sueldo, transfiere tu meta de ahorro a otra cuenta. Lo que no ves, no lo gastas. Automatiza este paso si puedes.',
    tag: 'Ahorro',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  {
    id: 'no_impulse',
    condition: () => true,
    emoji: '⏳',
    title: 'Regla de las 48 Horas',
    body: 'Para compras no planificadas sobre $20.000, espera 48 horas. Si todavía la quieres y puedes pagarla sin afectar el presupuesto, cómprala. Elimina el 80% de los gastos impulsivos.',
    tag: 'Hábitos',
    tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  {
    id: 'cae_warning',
    condition: ({ creditCards }) => creditCards.length > 0,
    emoji: '📊',
    title: 'Entiende el CAE',
    body: 'El CAE (Costo Anual Equivalente) es el costo real de un crédito en un año. Incluye tasa de interés + comisiones. Compara siempre por CAE, no por cuota. Usa el Simulador en Tarjetas.',
    tag: 'Tarjetas',
    tagColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  },
  {
    id: 'compound_interest',
    condition: ({ goals }) => goals.length > 0,
    emoji: '📈',
    title: 'Interés Compuesto',
    body: 'Si ahorras $50.000 al mes con retorno anual del 5%, en 10 años tendrás $7,7 millones — pero habrás aportado solo $6M. El resto es el interés trabajando por ti. Empieza hoy.',
    tag: 'Inversión',
    tagColor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  },
];

const DISMISS_KEY = 'costapp_dismissed_tips';

export default function FinancialTips({ className = '' }) {
  const { debts, goals, creditCards, salary } = useExpenses();

  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
  });
  const [expanded, setExpanded] = useState(true);

  const ctx = { debts, goals, creditCards, salary };

  const availableTips = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const eligible = ALL_TIPS.filter(t => t.condition(ctx) && !dismissed.includes(t.id));
    if (eligible.length === 0) return [];
    const start = dayIndex % eligible.length;
    // Show up to 2 tips, rotating by day
    return [
      eligible[start % eligible.length],
      eligible[(start + 1) % eligible.length],
    ].slice(0, Math.min(2, eligible.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debts, goals, creditCards, salary, dismissed]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  if (availableTips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`c-card p-5 ${className}`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between group"
      >
        <div className="c-card-header gap-3">
          <div className="c-card-icon bg-amber-50 dark:bg-amber-950">
            <Lightbulb size={18} className="text-amber-500" />
          </div>
          <div className="text-left">
            <h3 className="c-card-title text-sm">Educación Financiera</h3>
            <p className="c-card-subtitle">Tips contextuales basados en tus datos</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-slate-400 shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {availableTips.map(tip => (
                <div key={tip.id} className="c-inner-card p-4 relative">
                  <button
                    onClick={() => dismiss(tip.id)}
                    className="absolute top-3 right-3 p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 rounded-lg transition"
                  >
                    <X size={12} />
                  </button>
                  <div className="flex items-start gap-3 pr-5">
                    <span className="text-2xl shrink-0 leading-none mt-0.5">{tip.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-black text-slate-800 dark:text-white">{tip.title}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tip.tagColor}`}>
                          {tip.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
