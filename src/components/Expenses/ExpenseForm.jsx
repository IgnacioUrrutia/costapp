import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Tag, Calendar, AlignLeft, Send, Sparkles,
  Camera, X, Image as ImageIcon, CreditCard, Hash, Landmark,
} from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';
import { parseAmount } from '../../utils/format';

const ToggleSwitch = ({ active, onChange, label }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <CreditCard size={16} className={active ? 'text-violet-500' : 'text-slate-400'} />
      <span className={`text-sm font-bold ${active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>{label}</span>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        active ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const ExpenseForm = ({ onClose, initialData }) => {
  const { addExpense, updateExpense, categories, creditCards = [] } = useExpenses();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    amount: initialData?.amount?.toString() || '',
    category: initialData?.category || 'Alimentación',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    description: initialData?.description || '',
    creditCardId: initialData?.creditCardId || '',
    isInstallment: initialData?.isInstallment || false,
    currentInstallment: initialData?.currentInstallment?.toString() || '1',
    installmentsCount: initialData?.installmentsCount?.toString() || '12',
    totalPurchaseAmount: initialData?.totalPurchaseAmount?.toString() || '',
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.receiptUrl || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setPreviewUrl(null);
  };

  // Auto-calculate monthly amount from total and sync it
  const monthlyAmount = useMemo(() => {
    if (formData.isInstallment && formData.totalPurchaseAmount && parseInt(formData.installmentsCount) > 0) {
      return Math.round(parseAmount(formData.totalPurchaseAmount) / parseInt(formData.installmentsCount));
    }
    return null;
  }, [formData.isInstallment, formData.totalPurchaseAmount, formData.installmentsCount]);

  useEffect(() => {
    if (formData.isInstallment && monthlyAmount !== null) {
      setFormData(prev => ({ ...prev, amount: monthlyAmount.toString() }));
    }
  }, [monthlyAmount, formData.isInstallment]);

  // Alerta cupo: calcula si el gasto dejará la tarjeta con menos del 10%
  const cupoAlert = useMemo(() => {
    if (!formData.creditCardId) return null;
    const card = creditCards.find(c => c.id === formData.creditCardId);
    if (!card || card.type === 'debit' || !card.creditLimit) return null;
    const chargeAmount = formData.isInstallment && formData.totalPurchaseAmount
      ? parseAmount(formData.totalPurchaseAmount)
      : parseAmount(formData.amount);
    if (!chargeAmount || chargeAmount <= 0) return null;
    const available = (card.creditLimit || 0) - (card.usedAmount || 0);
    const afterCharge = available - chargeAmount;
    const pctAfter = afterCharge / card.creditLimit;
    if (pctAfter < 0) return { type: 'over', available, afterCharge };
    if (pctAfter < 0.10) return { type: 'low', available, afterCharge };
    return null;
  }, [formData.creditCardId, formData.amount, formData.isInstallment, formData.totalPurchaseAmount, creditCards]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const baseAmount = parseAmount(formData.amount);
    
    const payload = {
      ...formData,
      amount: baseAmount,
      isInstallment: formData.isInstallment,
      creditCardId: formData.creditCardId || null,
    };

    if (formData.isInstallment) {
      payload.currentInstallment = parseInt(formData.currentInstallment) || 1;
      payload.totalInstallments = parseInt(formData.installmentsCount) || 1;
      payload.totalPurchaseAmount = parseAmount(formData.totalPurchaseAmount) || baseAmount * payload.totalInstallments;
    } else {
      // Clear installment fields if disabled
      payload.isInstallment = false;
      payload.currentInstallment = null;
      payload.totalInstallments = null;
      payload.totalPurchaseAmount = null;
    }

    if (isEditing) {
      updateExpense(initialData.id, payload, receiptFile);
    } else {
      addExpense(payload, receiptFile);
    }
    onClose();
  };

  const inputClasses =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold group-focus-within:border-indigo-500';

  const smallInputClasses =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-bold text-sm';

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
          {formData.isInstallment ? 'Monto de la Cuota' : 'Monto del Gasto'}
        </label>
        <div className="relative group">
          <DollarSign
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
            size={20}
          />
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className={inputClasses}
          />
        </div>
        {formData.isInstallment && monthlyAmount && (
          <p className="text-xs text-violet-500 font-bold ml-1">
            ≈ $ {monthlyAmount.toLocaleString('es-CL')} por cuota
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Categoría
          </label>
          <div className="relative group">
            <Tag
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              size={20}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`${inputClasses} appearance-none cursor-pointer`}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Fecha
          </label>
          <div className="relative group">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              size={20}
            />
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
          Descripción (Opcional)
        </label>
        <div className="relative group">
          <AlignLeft
            className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
            size={20}
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="¿En qué gastaste?"
            rows="2"
            className={`${inputClasses} py-4 resize-none`}
          />
        </div>
      </div>

      {/* ── Pagar con tarjeta ── */}
      {creditCards.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            Pagar con Tarjeta (Opcional)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* Sin tarjeta */}
            <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
              !formData.creditCardId
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}>
              <input
                type="radio"
                name="cardId"
                value=""
                checked={!formData.creditCardId}
                onChange={() => setFormData({ ...formData, creditCardId: '' })}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${!formData.creditCardId ? 'border-indigo-500' : 'border-slate-300'}`}>
                {!formData.creditCardId && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin tarjeta / Efectivo</span>
            </label>

            {/* Tarjetas de débito */}
            {creditCards.filter(c => c.type === 'debit').map(card => {
              const selected = formData.creditCardId === card.id;
              return (
                <label key={card.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}>
                  <input type="radio" name="cardId" value={card.id} checked={selected}
                    onChange={() => setFormData({ ...formData, creditCardId: card.id })} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? 'border-emerald-500' : 'border-slate-300'}`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <Landmark size={15} className={selected ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {card.name}{card.lastFourDigits ? ` ••${card.lastFourDigits}` : ''}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Saldo: $ {(card.creditLimit || 0).toLocaleString('es-CL')}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Débito</span>
                </label>
              );
            })}

            {/* Tarjetas de crédito */}
            {creditCards.filter(c => c.type !== 'debit').map(card => {
              const selected = formData.creditCardId === card.id;
              const available = (card.creditLimit || 0) - (card.usedAmount || 0);
              return (
                <label key={card.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}>
                  <input type="radio" name="cardId" value={card.id} checked={selected}
                    onChange={() => setFormData({ ...formData, creditCardId: card.id })} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? 'border-indigo-500' : 'border-slate-300'}`}>
                    {selected && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                  </div>
                  <CreditCard size={15} className={selected ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                      {card.name}{card.lastFourDigits ? ` ••${card.lastFourDigits}` : ''}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Disponible: $ {available.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">Crédito</span>
                </label>
              );
            })}
          </div>

          {formData.creditCardId && (() => {
            const card = creditCards.find(c => c.id === formData.creditCardId);
            return card?.type === 'debit'
              ? <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-1">Se descontará del saldo de tu cuenta débito</p>
              : <p className="text-xs text-indigo-500 font-bold ml-1">Se cargará al cupo de tu tarjeta de crédito</p>;
          })()}

          {/* Alerta de cupo insuficiente */}
          {cupoAlert && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 px-4 py-3 rounded-2xl border ${
                cupoAlert.type === 'over'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className="text-base shrink-0">{cupoAlert.type === 'over' ? '🚫' : '⚠️'}</span>
              <p className="text-xs font-bold">
                {cupoAlert.type === 'over'
                  ? `Esta compra supera el cupo disponible ($${(cupoAlert.available).toLocaleString('es-CL')} disponibles).`
                  : `Esta compra dejará tu tarjeta con menos del 10% de cupo ($${Math.round(cupoAlert.afterCharge).toLocaleString('es-CL')} restantes).`
                }
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Sección Cuotas ── */}
      <div className={`rounded-2xl border p-4 space-y-4 transition-all ${
        formData.isInstallment
          ? 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50'
          : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800'
      }`}>
        <ToggleSwitch
          active={formData.isInstallment}
          onChange={() => setFormData({ ...formData, isInstallment: !formData.isInstallment })}
          label="Pago en Cuotas (Tarjeta)"
        />

        <AnimatePresence>
          {formData.isInstallment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                {/* Monto total de la compra */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 ml-1">
                    Monto Total de la Compra
                  </label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Precio total del artículo"
                      value={formData.totalPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, totalPurchaseAmount: e.target.value })}
                      className={smallInputClasses}
                    />
                  </div>
                </div>

                {/* Cuota actual / total */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 ml-1">
                      Cuota Actual
                    </label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        value={formData.currentInstallment}
                        onChange={(e) => setFormData({ ...formData, currentInstallment: e.target.value })}
                        className={smallInputClasses}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 ml-1">
                      Total Cuotas
                    </label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="12"
                        value={formData.installmentsCount}
                        onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                        className={smallInputClasses}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview del progreso */}
                {formData.currentInstallment && formData.installmentsCount && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                        Cuota {formData.currentInstallment} de {formData.installmentsCount}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {Math.round((parseInt(formData.currentInstallment) / parseInt(formData.installmentsCount)) * 100)}% pagado
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((parseInt(formData.currentInstallment) / parseInt(formData.installmentsCount)) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-violet-500 rounded-full"
                      />
                    </div>
                    {monthlyAmount && (
                      <p className="text-[10px] font-bold text-slate-400 mt-2">
                        Quedan {parseInt(formData.installmentsCount) - parseInt(formData.currentInstallment) + 1} cuotas ×{' '}
                        $ {monthlyAmount.toLocaleString('es-CL')} ={' '}
                        $ {((parseInt(formData.installmentsCount) - parseInt(formData.currentInstallment) + 1) * monthlyAmount).toLocaleString('es-CL')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
          Comprobante / Recibo
        </label>
        
        {!previewUrl ? (
          <div className="flex gap-4">
            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all cursor-pointer group">
              <Camera size={24} className="text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-xs font-bold text-slate-500">Tomar Foto / Subir</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src={previewUrl} alt="Recibo" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                type="button" 
                onClick={removeReceipt}
                className="p-3 bg-rose-500 text-white rounded-full shadow-lg"
              >
                <X size={20} />
              </button>
              <label className="p-3 bg-indigo-600 text-white rounded-full shadow-lg cursor-pointer">
                <ImageIcon size={20} />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onClose}
          className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          Cancelar
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(79,70,229,0.2)' }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
        >
          {isEditing ? <Send size={18} /> : <Sparkles size={18} />}
          {isEditing ? 'Guardar Cambios' : 'Guardar Gasto'}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default ExpenseForm;
