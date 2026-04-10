import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Plus, RefreshCw, CreditCard,
  Target, TrendingDown, Calendar, BarChart2, X,
  ChevronRight, ChevronLeft, Sparkles, DollarSign, Settings,
  Upload, Bell,
} from 'lucide-react';

// ── Steps definition ──────────────────────────────────────────────────────────
const STEPS = [
  {
    route: '/',
    targetId: null,
    icon: Sparkles,
    color: 'from-indigo-600 to-violet-700',
    title: '¡Bienvenido a CostApp!',
    subtitle: 'Tu gestor financiero personal',
    desc: 'CostApp te ayuda a saber en qué gastas tu dinero, cuánto te queda y llegar a fin de mes sin sorpresas. Este tutorial te guiará por todas las funciones.',
  },
  {
    route: '/',
    targetId: 'dashboard-header',
    icon: LayoutDashboard,
    color: 'from-violet-600 to-purple-700',
    title: 'Panel de Control',
    subtitle: 'Tu resumen financiero del mes',
    desc: 'Desde aquí controlas todo. Ves tus gastos del mes, presupuesto por categoría, gráficos y los últimos movimientos. Es tu punto de partida cada vez que abres la app.',
  },
  {
    route: '/',
    targetId: 'hero-balance',
    icon: Wallet,
    color: 'from-emerald-600 to-teal-700',
    title: 'Saldo en tu Cuenta',
    subtitle: 'Tu cuenta RUT, vista o banco',
    desc: 'Ingresa el saldo actual de tu cuenta. CostApp calcula cuánto te quedará disponible después de restar lo ya gastado y todos tus compromisos del mes (deudas y recurrentes).',
  },
  {
    route: '/',
    targetId: 'btn-nuevo-gasto',
    icon: Plus,
    color: 'from-rose-500 to-pink-600',
    title: 'Registrar un Gasto',
    subtitle: 'Rápido y sencillo',
    desc: 'Presiona aquí para registrar un gasto. Ingresa monto, categoría y fecha. Puedes asociarlo a tu débito o crédito, y si es en cuotas, CostApp descuenta el precio total de la compra del cupo de la tarjeta automáticamente.',
  },
  {
    route: '/recurrentes',
    targetId: 'recurrentes-title',
    icon: RefreshCw,
    color: 'from-amber-500 to-orange-600',
    title: 'Gastos Recurrentes',
    subtitle: 'Tus compromisos mensuales fijos',
    desc: 'Aquí registras los gastos que se repiten cada mes: arriendo, internet, Spotify, Netflix. CostApp los suma en el dashboard como "Comprometido" para que sepas cuánto está reservado antes de gastar.',
  },
  {
    route: '/tarjetas',
    targetId: 'tarjetas-title',
    icon: CreditCard,
    color: 'from-cyan-600 to-blue-700',
    title: 'Mis Tarjetas',
    subtitle: 'Débito y crédito en un lugar',
    desc: 'Agrega tus tarjetas de débito (cuenta corriente, RUT) o crédito (CMR, Santander, etc.). Cada gasto que vincules a una tarjeta actualiza el saldo automáticamente. Los pagos en cuotas descuentan el precio total de la compra.',
  },
  {
    route: '/deudas',
    targetId: 'deudas-title',
    icon: TrendingDown,
    color: 'from-rose-600 to-red-700',
    title: 'Deudas y Compromisos',
    subtitle: 'Controla lo que debes',
    desc: 'Registra créditos, préstamos o cuotas pendientes. Puedes vincular cada deuda a una tarjeta — al crearla se descuenta del cupo, y al marcar "Pagar este mes" se registra la cuota mensual en la tarjeta automáticamente.',
  },
  {
    route: '/metas',
    targetId: 'metas-title',
    icon: Target,
    color: 'from-purple-600 to-fuchsia-700',
    title: 'Metas de Ahorro',
    subtitle: 'Alcanza tus objetivos',
    desc: 'Define metas: un viaje, fondo de emergencia, un auto. Ve contribuyendo y CostApp te muestra el progreso con una barra visual. Cada lunes recibirás un recordatorio para aportar a tus metas.',
  },
  {
    route: '/ingresos',
    targetId: 'ingresos-title',
    icon: DollarSign,
    color: 'from-emerald-600 to-green-700',
    title: 'Ingresos Extra',
    subtitle: 'Más allá del sueldo',
    desc: 'Si recibes ingresos adicionales (freelance, arriendo, bonos, horas extra), regístralos aquí. Se suman automáticamente al total del mes en el dashboard para que el cálculo de cuánto te queda sea exacto.',
  },
  {
    route: '/anual',
    targetId: 'anual-title',
    icon: BarChart2,
    color: 'from-indigo-500 to-blue-600',
    title: 'Resumen Anual',
    subtitle: 'El panorama completo del año',
    desc: 'Ve cuánto gastaste cada mes, el mes más caro, tu promedio y cuánto ahorraste. Puedes comparar dos meses y compartir tu informe financiero con un link. Ideal para revisar al cierre de cada mes.',
  },
  {
    route: '/calendario',
    targetId: 'calendario-title',
    icon: Calendar,
    color: 'from-teal-600 to-emerald-700',
    title: 'Calendario',
    subtitle: 'Visualiza tu mes día a día',
    desc: 'El calendario muestra puntos de colores en los días con gastos. Toca cualquier día para ver el detalle de cada movimiento con su categoría y monto. Útil para detectar días de gasto excesivo.',
  },
  {
    route: '/importar-archivo',
    targetId: null,
    icon: Upload,
    color: 'from-violet-600 to-indigo-700',
    title: 'Importar Estado de Cuenta',
    subtitle: 'Sube tu PDF o Excel del banco',
    desc: 'Desde el menú de usuario puedes importar tu estado de cuenta bancario. Compatible con Banco de Chile (Excel) y Santander / CMR Falabella (PDF). CostApp detecta la tarjeta, clasifica los gastos y los importa en segundos.',
  },
  {
    route: '/config',
    targetId: 'config-title',
    icon: Settings,
    color: 'from-slate-600 to-slate-700',
    title: 'Configuración',
    subtitle: 'El primer paso: configura tu sueldo',
    desc: 'Registra tu sueldo mensual y define presupuestos por categoría (ej: $150.000 en Alimentación). CostApp te alertará cuando te acerques o superes el límite de cada categoría.',
  },
  {
    route: '/',
    targetId: null,
    icon: Bell,
    color: 'from-amber-500 to-orange-600',
    title: 'Alertas y Notificaciones',
    subtitle: 'CostApp trabaja contigo',
    desc: 'Recibirás notificaciones inteligentes: recordatorio diario a las 21:30 para registrar gastos, aviso cuando superas el 80% de un presupuesto, alerta de deudas próximas a vencer y recordatorio el día 15 para pagar tus tarjetas.',
  },
  {
    route: '/',
    targetId: null,
    icon: Sparkles,
    color: 'from-indigo-600 to-violet-700',
    title: '¡Todo listo!',
    subtitle: 'Ya conoces todo CostApp',
    desc: 'Puedes volver a ver este tutorial tocando el ícono "?" en el menú superior. El primer paso: ve a Configuración, registra tu sueldo y tus presupuestos. ¡A controlar tus finanzas!',
  },
];

// ── Spotlight ─────────────────────────────────────────────────────────────────
const Spotlight = ({ targetId }) => {
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    if (!targetId) { setRect(null); return; }
    const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setRect(null);
    }
  }, [targetId]);

  useEffect(() => {
    setRect(null);
    const t = setTimeout(measure, 420);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  const pad = 10;

  if (!targetId) {
    return <div className="fixed inset-0 bg-black/60 z-[190] pointer-events-none" />;
  }

  if (!rect) {
    return <div className="fixed inset-0 bg-black/60 z-[190] pointer-events-none" />;
  }

  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  return (
    <div className="fixed inset-0 z-[190] pointer-events-none">
      {/* 4 dark panels */}
      <div className="absolute bg-black/65" style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className="absolute bg-black/65" style={{ top, left: 0, width: left, height: h }} />
      <div className="absolute bg-black/65" style={{ top, left: left + w, right: 0, height: h }} />
      <div className="absolute bg-black/65" style={{ top: top + h, left: 0, right: 0, bottom: 0 }} />

      {/* Highlight ring */}
      <motion.div
        key={targetId}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="absolute rounded-2xl border-2 border-indigo-400"
        style={{
          top,
          left,
          width: w,
          height: h,
          boxShadow: '0 0 0 4px rgba(99,102,241,0.25), 0 0 32px rgba(99,102,241,0.15)',
        }}
      />

      {/* Pulsing dot in top-right corner of highlight */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="absolute w-3 h-3 rounded-full bg-indigo-400 border-2 border-white"
        style={{ top: top - 6, left: left + w - 6 }}
      />
    </div>
  );
};

// ── Tutorial card ─────────────────────────────────────────────────────────────
const AppTutorial = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  // Navigate when step changes
  useEffect(() => {
    if (current.route) navigate(current.route);
  }, [step, current.route]);

  const next = () => {
    if (isLast) { onClose(); return; }
    setStep(s => s + 1);
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  return (
    <>
      <Spotlight targetId={current.targetId} />

      {/* Floating card at bottom-center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className={`bg-gradient-to-br ${current.color} rounded-[1.75rem] overflow-hidden shadow-2xl`}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all z-10"
            >
              <X size={14} />
            </button>

            <div className="p-5 pb-4">
              {/* Icon + step */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-white/15">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    Paso {step + 1} de {STEPS.length}
                  </p>
                  <p className="text-[11px] font-bold text-white/60">{current.subtitle}</p>
                </div>
              </div>

              <h2 className="text-xl font-black text-white tracking-tight leading-tight mb-2">
                {current.title}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed font-medium">{current.desc}</p>
            </div>

            {/* Progress dots */}
            <div className="px-5 flex items-center gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`transition-all rounded-full ${
                    i === step ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 pt-3 flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3.5 py-2.5 bg-white/10 text-white/70 hover:text-white hover:bg-white/20 rounded-xl font-bold text-xs transition-all"
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg"
              >
                {isLast ? (
                  <><Sparkles size={14} /> ¡Empezar ahora!</>
                ) : (
                  <>Siguiente <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default AppTutorial;
