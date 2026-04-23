import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag,
  ArrowLeft, Wallet, ShieldCheck, HeartPulse,
  Home, Utensils, Truck, Play, GraduationCap, User, CreditCard, PiggyBank,
  Target,
} from 'lucide-react';

const ICON_MAP = {
  'Alimentación': Utensils, 'Vivienda': Home, 'Transporte': Truck,
  'Salud': HeartPulse, 'Entretenimiento': Play, 'Educación': GraduationCap,
  'Personal': User, 'Financiero': CreditCard, 'Ahorro/Inversión': PiggyBank,
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmt = v => Number(v || 0).toLocaleString('es-CL');

const BudgetReport = ({ report }) => {
  const categories = Object.entries(report.budgets || {}).filter(([, b]) => b > 0);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="p-2 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loud Budgeting</span>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Límites de gasto</p>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            {MONTH_NAMES[report.month]} {report.year}
          </h1>
          <p className="text-slate-400 font-bold">Por {report.userName || 'Usuario de CostApp'}</p>
        </motion.div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Presupuesto por categoría</p>
          {categories.map(([cat, budget], i) => {
            const Icon = ICON_MAP[cat] || ShoppingBag;
            const spent = (report.categoryTotals || {})[cat] || 0;
            const pct = Math.min((spent / budget) * 100, 100);
            const isOver = spent > budget;
            const isWarn = !isOver && pct >= 80;
            return (
              <motion.div
                key={cat}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-slate-800 text-slate-400 rounded-xl shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm text-white">{cat}</span>
                      <span className={`text-xs font-black tabular-nums ${isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-400'}`}>
                        ${fmt(spent)} / ${fmt(budget)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-bold text-slate-600">
                  <span>{pct.toFixed(0)}% usado</span>
                  {isOver
                    ? <span className="text-rose-500">Excedido en ${fmt(spent - budget)}</span>
                    : <span>${fmt(budget - spent)} disponible</span>
                  }
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="pt-8 text-center space-y-3">
          <p className="text-slate-500 text-xs italic">"Gastar con propósito es la base de la libertad financiera."</p>
          <span className="text-lg font-black tracking-tighter text-indigo-500">CostApp</span>
        </div>
      </div>
    </div>
  );
};

const PublicReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const snap = await getDoc(doc(db, 'public_reports', id));
        if (snap.exists()) setReport(snap.data());
      } catch (e) {
        console.error('Error fetching shared report:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (report?.type === 'budget') return <BudgetReport report={report} />;

  if (!report) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
        <TrendingUp size={40} className="rotate-180" />
      </div>
      <h1 className="text-2xl font-black text-white">Reporte no encontrado</h1>
      <p className="text-slate-400 mt-2">El link puede haber expirado o es incorrecto.</p>
      <Link to="/" className="mt-8 text-indigo-400 font-bold flex items-center gap-2">
        <ArrowLeft size={18} /> Ir a la App
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Navbar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="p-2 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Reporte Público Protegido</span>
          </div>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Informe Mensual</p>
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
            {MONTH_NAMES[report.month]} {report.year}
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-medium">
            <User size={14} />
            <span>Por {report.userName || 'Usuario de CostApp'}</span>
          </div>
        </motion.div>

        {/* Highlight Card */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-indigo-600 rounded-[2.5rem] p-8 text-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={120} />
          </div>
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Gasto Total del Mes</p>
          <h2 className="text-5xl font-black text-white">$ {report.total.toLocaleString('es-CL')}</h2>
        </motion.div>

        {/* Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Desglose de Movimientos</h3>
          <div className="space-y-3">
            {report.expenses.map((exp, i) => {
              const Icon = ICON_MAP[exp.category] || ShoppingBag;
              return (
                <motion.div 
                    key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 group"
                >
                  <div className="p-3 bg-slate-800 text-slate-400 rounded-xl group-hover:text-indigo-400 transition-colors">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{exp.description || exp.category}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{exp.category}</span>
                  </div>
                  <p className="font-black text-white">$ {exp.amount.toLocaleString('es-CL')}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center space-y-4">
            <p className="text-slate-500 text-xs font-medium italic">"Gastar con propósito es la base de la libertad financiera."</p>
            <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Generado con</p>
                <span className="text-xl font-black tracking-tighter text-indigo-500">CostApp Premium</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PublicReport;
