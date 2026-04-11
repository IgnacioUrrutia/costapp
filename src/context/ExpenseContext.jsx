import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  setDoc, getDoc,
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { scheduleAllNotifications, cancelAllNotifications } from '../utils/notifications';

const ExpenseContext = createContext();

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within an ExpenseProvider');
  return context;
};

const DEFAULT_BUDGETS = {
  'Vivienda': 0, 'Alimentación': 0, 'Transporte': 0, 'Salud': 0,
  'Entretenimiento': 0, 'Educación': 0, 'Personal': 0, 'Financiero': 0, 'Ahorro/Inversión': 0,
};

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Gastos ────────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Configuración guardada en Firestore users/{uid} ───────────────────────
  const [salary, setSalaryState] = useState(0);
  const [budgets, setBudgetsState] = useState(DEFAULT_BUDGETS);
  const [debitBalance, setDebitBalanceState] = useState(0);

  // ── Ingresos adicionales ──────────────────────────────────────────────────
  const [additionalIncomes, setAdditionalIncomes] = useState([]);

  // ── Gastos recurrentes ────────────────────────────────────────────────────
  const [recurringExpenses, setRecurringExpenses] = useState([]);

  // ── Deudas ────────────────────────────────────────────────────────────────
  const [debts, setDebts] = useState([]);

  // ── Metas de ahorro ───────────────────────────────────────────────────────
  const [goals, setGoals] = useState([]);

  // ── Tarjetas de crédito ────────────────────────────────────────────────────
  const [creditCards, setCreditCards] = useState([]);

  // ── Gastos compartidos (Pareja / Familia) ──────────────────────────────────
  const [splitPersons, setSplitPersons] = useState([]);
  const [splitExpenses, setSplitExpenses] = useState([]);

  // ── Alertas ya disparadas (evitar repetición) ─────────────────────────────
  const alertedRef = useRef(new Set());

  // ── Multi-moneda ──────────────────────────────────────────────────────────
  const [currency, setCurrencyState] = useState('CLP');
  const [exchangeRate, setExchangeRateState] = useState(900); // CLP per USD (ejemplo)

  const [categories] = useState([
    { id: '1', name: 'Vivienda', icon: 'Home', color: 'bg-blue-500' },
    { id: '2', name: 'Alimentación', icon: 'Utensils', color: 'bg-emerald-500' },
    { id: '3', name: 'Transporte', icon: 'Truck', color: 'bg-amber-500' },
    { id: '4', name: 'Salud', icon: 'HeartPulse', color: 'bg-rose-500' },
    { id: '5', name: 'Entretenimiento', icon: 'Play', color: 'bg-purple-500' },
    { id: '6', name: 'Educación', icon: 'GraduationCap', color: 'bg-indigo-500' },
    { id: '7', name: 'Personal', icon: 'User', color: 'bg-pink-500' },
    { id: '8', name: 'Financiero', icon: 'CreditCard', color: 'bg-slate-500' },
    { id: '9', name: 'Ahorro/Inversión', icon: 'PiggyBank', color: 'bg-teal-500' },
  ]);

  const [filters, setFilters] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    category: 'Todas',
    onlyInstallments: false,
  });

  // ── Sync gastos Firestore ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setExpenses([]); setLoading(false); return; }
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        date: d.data().date?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      })));
      setLoading(false);
    }, () => { toast.error('Error al sincronizar'); setLoading(false); });
    return () => unsub();
  }, [user]);

  // ── Cargar configuración del usuario ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setSalaryState(d.salary || 0);
          setBudgetsState(d.budgets || DEFAULT_BUDGETS);
          setAdditionalIncomes(d.additionalIncomes || []);
          setRecurringExpenses(d.recurringExpenses || []);
          setDebts(d.debts || []);
          setGoals(d.goals || []);
          setCreditCards(d.creditCards || []);
          setSplitPersons(d.splitPersons || []);
          setSplitExpenses(d.splitExpenses || []);
          setDebitBalanceState(d.debitBalance || 0);
          setCurrencyState(d.currency || 'CLP');
          setExchangeRateState(d.exchangeRate || 900);
        }
      } catch (e) { console.error('Error cargando configuración:', e); }
    };
    load();
  }, [user]);

  // ── Persistir campo en users/{uid} ────────────────────────────────────────
  const saveField = async (field, value) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { [field]: value }, { merge: true });
    } catch (e) { console.error('Error guardando', field, e); }
  };

  // ── Sueldo ────────────────────────────────────────────────────────────────
  const setSalary = async (value) => {
    const v = parseFloat(value) || 0;
    setSalaryState(v);
    await saveField('salary', v);
    toast.success('Sueldo actualizado');
  };

  // ── Presupuestos ──────────────────────────────────────────────────────────
  const setBudgets = async (newBudgets) => {
    setBudgetsState(newBudgets);
    await saveField('budgets', newBudgets);
    toast.success('Presupuestos guardados');
  };

  // ── Multi-moneda ──────────────────────────────────────────────────────────
  const setCurrency = async (cur) => {
    setCurrencyState(cur);
    await saveField('currency', cur);
  };

  // ── Saldo cuenta débito ────────────────────────────────────────────────────
  const setDebitBalance = async (value) => {
    const v = parseFloat(value) || 0;
    setDebitBalanceState(v);
    await saveField('debitBalance', v);
    toast.success('Saldo actualizado');
  };

  const setExchangeRate = async (rate) => {
    const r = parseFloat(rate) || 0;
    setExchangeRateState(r);
    await saveField('exchangeRate', r);
  };

  // ── CRUD Gastos ───────────────────────────────────────────────────────────
  const uploadReceipt = async (file) => {
    if (!user || !file) return null;
    try {
      const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (e) {
      console.error('Error uploading receipt:', e);
      toast.error('Error al subir el recibo');
      return null;
    }
  };

  const addExpense = async (expense, receiptFile = null) => {
    if (!user) return;
    try {
      let receiptUrl = null;
      if (receiptFile) {
        toast.loading('Subiendo recibo...', { id: 'upload' });
        receiptUrl = await uploadReceipt(receiptFile);
        toast.dismiss('upload');
      }

      // LÓGICA DE CUOTAS MEJORADA
      // Si es una compra nueva en cuotas, solo registramos la cuota actual como gasto
      const isInstallment = expense.isInstallment && expense.totalInstallments > 1;
      const amountToRegister = isInstallment ? (expense.amount) : (expense.amount || 0);

      const expenseDoc = await addDoc(collection(db, 'expenses'), {
        ...expense, 
        amount: amountToRegister,
        userId: user.uid,
        receiptUrl,
        date: new Date(expense.date + 'T00:00:00'),
        createdAt: serverTimestamp(),
      });

      // Si es en cuotas, creamos automáticamente una Deuda por el saldo restante
      if (isInstallment && expense.totalPurchaseAmount > amountToRegister) {
        const remainingAmount = expense.totalPurchaseAmount - amountToRegister;
        const monthlyPayment = amountToRegister; // La cuota mensual
        
        await addDebt({
          name: `Cuotas: ${expense.description || expense.category}`,
          category: 'Cuota',
          totalAmount: expense.totalPurchaseAmount,
          remainingAmount: remainingAmount,
          monthlyPayment: monthlyPayment,
          dueDate: '', // Opcional: calcular próxima fecha
          creditCardId: expense.creditCardId || '',
          linkedExpenseId: expenseDoc.id,
          paid: false
        }, false); // El false es para no duplicar el cargo a la tarjeta
      }

      // Cargar a la tarjeta si está vinculada
      if (expense.creditCardId) {
        // El cargo a la tarjeta siempre debe ser por el TOTAL de la compra
        const chargeAmount = isInstallment ? (expense.totalPurchaseAmount || 0) : (expense.amount || 0);
        
        // Solo cargamos a la tarjeta si NO es un gasto que viene de una deuda ya existente
        // (para evitar doble cargo)
        if (chargeAmount > 0 && !expense.isFromDebtPayment) {
          await updateCardInFirestore(expense.creditCardId, (c) => {
            if (c.type === 'debit') {
              return { ...c, creditLimit: Math.max(0, (c.creditLimit || 0) - chargeAmount) };
            }
            return { ...c, usedAmount: (c.usedAmount || 0) + chargeAmount };
          });
        }
      }

      toast.success(isInstallment ? '¡Compra y cuotas registradas!' : '¡Gasto registrado!');
    } catch (e) { 
      console.error(e);
      toast.error('Error al registrar'); 
    }
  };

  const deleteExpense = async (id, receiptUrl = null) => {
    try { 
      await deleteDoc(doc(db, 'expenses', id)); 
      
      // If there's a receipt, delete it from storage too
      if (receiptUrl) {
        const storageRef = ref(storage, receiptUrl);
        await deleteObject(storageRef).catch(e => console.warn('Error deleting file:', e));
      }

      toast.success('Gasto eliminado'); 
    }
    catch (e) { toast.error('Error al eliminar'); }
  };

  const updateExpense = async (id, updatedData, receiptFile = null) => {
    try {
      const payload = { ...updatedData };
      if (updatedData.date) payload.date = new Date(updatedData.date + 'T00:00:00');
      
      if (receiptFile) {
        toast.loading('Actualizando recibo...', { id: 'upload' });
        payload.receiptUrl = await uploadReceipt(receiptFile);
        toast.dismiss('upload');
      }

      await updateDoc(doc(db, 'expenses', id), payload);
      toast.success('Gasto actualizado');
    } catch (e) { toast.error('Error al actualizar'); }
  };

  // ── Ingresos adicionales ──────────────────────────────────────────────────
  const addIncome = async (income) => {
    const newList = [...additionalIncomes, { ...income, id: Date.now().toString() }];
    setAdditionalIncomes(newList);
    await saveField('additionalIncomes', newList);
    toast.success('Ingreso añadido');
  };

  const deleteIncome = async (id) => {
    const newList = additionalIncomes.filter(i => i.id !== id);
    setAdditionalIncomes(newList);
    await saveField('additionalIncomes', newList);
    toast.success('Ingreso eliminado');
  };

  // ── Gastos recurrentes ────────────────────────────────────────────────────
  const addRecurring = async (recurring) => {
    const newList = [...recurringExpenses, { ...recurring, id: Date.now().toString(), active: true }];
    setRecurringExpenses(newList);
    await saveField('recurringExpenses', newList);
    toast.success('Gasto recurrente añadido');
  };

  const deleteRecurring = async (id) => {
    const newList = recurringExpenses.filter(r => r.id !== id);
    setRecurringExpenses(newList);
    await saveField('recurringExpenses', newList);
    toast.success('Eliminado');
  };

  const toggleRecurring = async (id) => {
    const newList = recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRecurringExpenses(newList);
    await saveField('recurringExpenses', newList);
  };

  const registerAllRecurring = async () => {
    const active = recurringExpenses.filter(r => r.active);
    if (active.length === 0) { toast('No hay recurrentes activos'); return; }
    const today = new Date().toISOString().split('T')[0];
    for (const r of active) {
      await addExpense({ amount: r.amount, category: r.category, date: today, description: r.description });
    }
    toast.success(`${active.length} gastos registrados`);
  };

  // ── Deudas ────────────────────────────────────────────────────────────────
  // Helper: read fresh creditCards from Firestore, apply a transform, save + sync state
  const updateCardInFirestore = async (cardId, transform) => {
    if (!cardId || !user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    const freshCards = snap.exists() ? (snap.data().creditCards || []) : [];
    const newCards = freshCards.map(c => c.id === cardId ? transform(c) : c);
    setCreditCards(newCards);
    await saveField('creditCards', newCards);
  };

  const addDebt = async (debt, chargeToCard = true) => {
    const newList = [...debts, { ...debt, id: Date.now().toString(), paidThisMonth: false }];
    setDebts(newList);
    await saveField('debts', newList);

    // Solo cargamos a la tarjeta si no viene de un flujo que ya lo hizo (como addExpense)
    if (chargeToCard && debt.creditCardId) {
      const chargeAmount = debt.remainingAmount || debt.totalAmount || 0;
      if (chargeAmount > 0) {
        await updateCardInFirestore(debt.creditCardId, (c) => {
          if (c.type === 'debit') {
            return { ...c, creditLimit: Math.max(0, (c.creditLimit || 0) - chargeAmount) };
          }
          return { ...c, usedAmount: (c.usedAmount || 0) + chargeAmount };
        });
      }
    }

    if (chargeToCard) toast.success('Deuda añadida');
  };

  const deleteDebt = async (id) => {
    const debt = debts.find(d => d.id === id);
    const newList = debts.filter(d => d.id !== id);
    setDebts(newList);
    await saveField('debts', newList);

    if (debt?.creditCardId) {
      const restoreAmount = debt.remainingAmount || 0;
      if (restoreAmount > 0) {
        await updateCardInFirestore(debt.creditCardId, (c) => {
          if (c.type === 'debit') {
            return { ...c, creditLimit: (c.creditLimit || 0) + restoreAmount };
          }
          return { ...c, usedAmount: Math.max(0, (c.usedAmount || 0) - restoreAmount) };
        });
      }
    }

    toast.success('Deuda eliminada');
  };

  const payDebt = async (id, fromAccountId = null) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const payment = parseFloat(debt.monthlyPayment) || 0;
    const newRemaining = Math.max(0, (debt.remainingAmount || 0) - payment);
    const isFullyPaid = newRemaining === 0;
    
    // 1. REGISTRAR EL GASTO DEL MES (Para que aparezca en el Dashboard)
    await addExpense({
      amount: payment,
      category: debt.category || 'Financiero',
      description: `Pago cuota: ${debt.name}`,
      date: new Date().toISOString().split('T')[0],
      creditCardId: debt.creditCardId || '',
      isFromDebtPayment: true // Evitamos duplicar cargo a la tarjeta
    });

    // 2. ACTUALIZAR LA DEUDA
    const newDebts = debts.map(d =>
      d.id !== id ? d : { ...d, remainingAmount: newRemaining, paidThisMonth: true, paid: isFullyPaid }
    );
    setDebts(newDebts);
    await saveField('debts', newDebts);

    // 3. ACTUALIZAR SALDO (Si se pagó desde una cuenta de débito)
    if (fromAccountId && payment > 0) {
      await updateCardInFirestore(fromAccountId, (c) => ({
        ...c,
        creditLimit: Math.max(0, (c.creditLimit || 0) - payment),
      }));
    }

    // 4. SI ERA DE TARJETA, BAJAR EL "SALDO USADO" DE LA TARJETA
    if (debt.creditCardId && payment > 0) {
      await updateCardInFirestore(debt.creditCardId, (c) => {
        if (c.type !== 'debit') {
          return { ...c, usedAmount: Math.max(0, (c.usedAmount || 0) - payment) };
        }
        return c;
      });
    }

    if (isFullyPaid) {
      toast.success(`🎉 ¡Deuda "${debt.name}" saldada!`, { duration: 5000 });
    } else {
      toast.success('¡Cuota pagada!');
    }
  };

  const updateDebt = async (id, data) => {
    const newList = debts.map(d => d.id === id ? { ...d, ...data } : d);
    setDebts(newList);
    await saveField('debts', newList);
  };

  // ── Tarjetas de crédito ────────────────────────────────────────────────────
  const addCreditCard = async (card) => {
    const newList = [...creditCards, { ...card, id: Date.now().toString(), usedAmount: 0 }];
    setCreditCards(newList);
    await saveField('creditCards', newList);
    toast.success('Tarjeta añadida');
  };

  const deleteCreditCard = async (id) => {
    const newList = creditCards.filter(c => c.id !== id);
    setCreditCards(newList);
    await saveField('creditCards', newList);
    toast.success('Tarjeta eliminada');
  };

  const updateCreditCard = async (id, data) => {
    const newList = creditCards.map(c => c.id === id ? { ...c, ...data } : c);
    setCreditCards(newList);
    await saveField('creditCards', newList);
    toast.success('Tarjeta actualizada');
  };

  const resetCardBalance = async (id) => {
    const newList = creditCards.map(c => c.id === id ? { ...c, usedAmount: 0 } : c);
    setCreditCards(newList);
    await saveField('creditCards', newList);
    toast.success('Saldo reiniciado');
  };

  // ── Metas de ahorro ───────────────────────────────────────────────────────
  const addGoal = async (goal) => {
    const newList = [...goals, { ...goal, id: Date.now().toString(), currentAmount: 0 }];
    setGoals(newList);
    await saveField('goals', newList);
    toast.success('Meta añadida');
  };

  const deleteGoal = async (id) => {
    const newList = goals.filter(g => g.id !== id);
    setGoals(newList);
    await saveField('goals', newList);
    toast.success('Meta eliminada');
  };

  const contributeToGoal = async (id, amount) => {
    const newList = goals.map(g => {
      if (g.id !== id) return g;
      const newAmount = Math.min(g.targetAmount, g.currentAmount + amount);
      return { ...g, currentAmount: newAmount };
    });
    setGoals(newList);
    await saveField('goals', newList);
    toast.success('¡Contribución registrada!');
  };

  // ── Gastos compartidos CRUD ───────────────────────────────────────────────
  const addSplitPerson = async (person) => {
    const newList = [...splitPersons, { ...person, id: Date.now().toString() }];
    setSplitPersons(newList);
    await saveField('splitPersons', newList);
  };

  const deleteSplitPerson = async (id) => {
    const newList = splitPersons.filter(p => p.id !== id);
    setSplitPersons(newList);
    await saveField('splitPersons', newList);
  };

  const addSplitExpense = async (expense) => {
    const newList = [...splitExpenses, { ...expense, id: Date.now().toString(), settled: false }];
    setSplitExpenses(newList);
    await saveField('splitExpenses', newList);
    toast.success('Gasto compartido registrado');
  };

  const deleteSplitExpense = async (id) => {
    const newList = splitExpenses.filter(e => e.id !== id);
    setSplitExpenses(newList);
    await saveField('splitExpenses', newList);
  };

  const settleSplitExpense = async (id) => {
    const newList = splitExpenses.map(e => e.id === id ? { ...e, settled: true } : e);
    setSplitExpenses(newList);
    await saveField('splitExpenses', newList);
    toast.success('Gasto liquidado');
  };

  const settleAllWithPerson = async (personId) => {
    const newList = splitExpenses.map(e => {
      const involves = e.paidById === personId ||
        e.paidById === 'me' ||
        (e.participants || []).some(p => p.personId === personId || p.personId === 'me');
      return (involves && !e.settled) ? { ...e, settled: true } : e;
    });
    setSplitExpenses(newList);
    await saveField('splitExpenses', newList);
    toast.success('Deudas liquidadas');
  };

  // ── Filtros y derivados ───────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = new Date(exp.date + 'T00:00:00');
      const matchMonth = filters.month === -1 || d.getMonth() === filters.month;
      const matchYear = d.getFullYear() === filters.year;
      const matchCat = filters.category === 'Todas' || exp.category === filters.category;
      const matchInstallment = !filters.onlyInstallments || exp.isInstallment;
      return matchMonth && matchYear && matchCat && matchInstallment;
    });
  }, [expenses, filters]);

  const monthlyBarData = useMemo(() => {
    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth(), y = d.getFullYear();
      const total = expenses
        .filter(e => { const ed = new Date(e.date + 'T00:00:00'); return ed.getMonth() === m && ed.getFullYear() === y; })
        .reduce((a, e) => a + e.amount, 0);
      return { name: names[m], total };
    });
  }, [expenses]);

  const currentMonthTotal = useMemo(() => {
    return expenses
      .filter(e => {
        const ed = new Date(e.date + 'T00:00:00');
        return (filters.month === -1 || ed.getMonth() === filters.month) && ed.getFullYear() === filters.year;
      })
      .reduce((a, e) => a + e.amount, 0);
  }, [expenses, filters.month, filters.year]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    expenses
      .filter(e => {
        const ed = new Date(e.date + 'T00:00:00');
        return (filters.month === -1 || ed.getMonth() === filters.month) && ed.getFullYear() === filters.year;
      })
      .forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    return totals;
  }, [expenses, filters]);

  // Ingresos totales = sueldo + adicionales del mes
  const totalIncome = useMemo(() => {
    const extra = additionalIncomes
      .filter(i => {
        if (!i.date) return true;
        const d = new Date(i.date + 'T00:00:00');
        return (filters.month === -1 || d.getMonth() === filters.month) && d.getFullYear() === filters.year;
      })
      .reduce((a, i) => a + (parseFloat(i.amount) || 0), 0);
    return salary + extra;
  }, [salary, additionalIncomes, filters]);

  // Pago mensual total de deudas
  const totalDebtPayment = useMemo(() => {
    return debts.reduce((a, d) => a + (parseFloat(d.monthlyPayment) || 0), 0);
  }, [debts]);

  // Disponible real = ingresos - gastos - deudas
  const realAvailable = useMemo(() => {
    if (totalIncome === 0) return null;
    return totalIncome - currentMonthTotal - totalDebtPayment;
  }, [totalIncome, currentMonthTotal, totalDebtPayment]);

  // Score financiero 0-100
  const financialScore = useMemo(() => {
    let score = 100;
    if (totalIncome === 0) score -= 15;
    else if (currentMonthTotal > totalIncome) score -= 25;
    else if (currentMonthTotal > totalIncome * 0.9) score -= 10;

    creditCards.forEach(c => {
      if (c.type !== 'debit' && c.creditLimit > 0 && (c.usedAmount || 0) / c.creditLimit > 0.9) score -= 15;
    });

    debts.forEach(d => {
      if (d.dueDate && !d.paid) {
        const diff = Math.ceil((new Date(d.dueDate + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) score -= 10;
      }
    });

    if (!goals || goals.length === 0) score -= 5;

    if (budgets) {
      let over = 0;
      Object.entries(categoryTotals).forEach(([cat, spent]) => {
        const limit = budgets[cat] || 0;
        if (limit > 0 && spent > limit) over++;
      });
      score -= Math.min(over * 5, 20);
    }

    const paidThisMonth = debts.filter(d => d.paidThisMonth).length;
    if (debts.length > 0 && paidThisMonth === debts.length) score += 10;
    if (totalIncome > 0 && realAvailable !== null && realAvailable > totalIncome * 0.2) score += 5;

    return Math.max(0, Math.min(100, score));
  }, [totalIncome, currentMonthTotal, creditCards, debts, goals, budgets, categoryTotals, realAvailable]);

  // Proyección de saldo fin de mes
  const balanceProjection = useMemo(() => {
    if (debitBalance <= 0) return null;
    const now = new Date();
    const today = now.getDate();
    if (today === 0) return null;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - today;
    const dailyBurn = currentMonthTotal / today;
    const projectedEnd = debitBalance - dailyBurn * daysRemaining;
    const daysUntilZero = dailyBurn > 0 ? Math.floor(debitBalance / dailyBurn) : null;
    return { projectedEnd: Math.round(projectedEnd), dailyBurn: Math.round(dailyBurn), daysUntilZero, daysRemaining };
  }, [debitBalance, currentMonthTotal]);

  // Deuda más próxima a vencer (≤ 30 días, no pagada)
  const upcomingDueDebt = useMemo(() => {
    const now = new Date();
    return debts
      .filter(d => {
        if (!d.dueDate || d.paid) return false;
        const due = new Date(d.dueDate + 'T00:00:00');
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 30;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;
  }, [debts]);

  // Salud financiera: 'good' | 'warning' | 'danger'
  const financialHealth = useMemo(() => {
    const cardOverLimit = creditCards.some(c => c.type !== 'debit' && c.creditLimit > 0 &&
      (c.usedAmount || 0) / c.creditLimit >= 0.9);
    if (totalIncome > 0 && (totalIncome - currentMonthTotal - totalDebtPayment) < 0) return 'danger';
    if (cardOverLimit) return 'danger';
    if (upcomingDueDebt) {
      const diff = Math.ceil((new Date(upcomingDueDebt.dueDate + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
      if (diff <= 7) return 'warning';
    }
    if (totalIncome > 0 && currentMonthTotal / totalIncome > 0.8) return 'warning';
    return 'good';
  }, [totalIncome, currentMonthTotal, totalDebtPayment, upcomingDueDebt, creditCards]);

  // Gasto semanal: semana actual vs semana anterior
  const weeklySpendingData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // lunes = 0
    const startThisWeek = new Date(now);
    startThisWeek.setDate(now.getDate() - dayOfWeek);
    startThisWeek.setHours(0, 0, 0, 0);
    const startLastWeek = new Date(startThisWeek);
    startLastWeek.setDate(startThisWeek.getDate() - 7);
    const endLastWeek = new Date(startThisWeek);

    const thisWeek = expenses
      .filter(e => new Date(e.date + 'T00:00:00') >= startThisWeek)
      .reduce((a, e) => a + e.amount, 0);
    const lastWeek = expenses
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d >= startLastWeek && d < endLastWeek;
      })
      .reduce((a, e) => a + e.amount, 0);

    const changePct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
    return { thisWeek, lastWeek, changePct };
  }, [expenses]);

  // ── Compartir Mes ─────────────────────────────────────────────────────────
  const shareMonth = async (month, year) => {
    if (!user) return null;
    try {
      const monthData = expenses.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
      });

      const reportId = `${user.uid}_${year}_${month}_${Date.now()}`;
      await setDoc(doc(db, 'public_reports', reportId), {
        userId: user.uid,
        userName: user.displayName,
        month,
        year,
        total: monthData.reduce((a, e) => a + e.amount, 0),
        expenses: monthData.map(e => ({ amount: e.amount, category: e.category, description: e.description, date: e.date })),
        sharedAt: serverTimestamp(),
      });

      const shareUrl = `${window.location.origin}/share/${reportId}`;
      return shareUrl;
    } catch (e) {
      console.error('Error sharing month:', e);
      toast.error('Error al generar link');
      return null;
    }
  };

  // ── Presupuestos Sugeridos (Inteligencia) ──────────────────────────────────
  const suggestedBudgets = useMemo(() => {
    const historical = {};
    const now = new Date();
    // Analizar últimos 3 meses
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      expenses
        .filter(e => { const ed = new Date(e.date + 'T00:00:00'); return ed.getMonth() === m && ed.getFullYear() === y; })
        .forEach(e => {
          if (!historical[e.category]) historical[e.category] = [];
          historical[e.category].push(e.amount);
        });
    }
    
    const suggested = {};
    Object.entries(historical).forEach(([cat, amounts]) => {
      const avg = amounts.reduce((a, b) => a + b, 0) / 3; // Promedio mensual
      suggested[cat] = Math.round(avg * 1.1); // Sugerir promedio + 10% de margen
    });
    return suggested;
  }, [expenses]);

  // ── Alertas de presupuesto ────────────────────────────────────────────────
  useEffect(() => {
    if (!budgets || Object.keys(budgets).length === 0) return;
    Object.entries(categoryTotals).forEach(([cat, spent]) => {
      const budget = budgets[cat];
      if (!budget || budget === 0) return;
      const pct = (spent / budget) * 100;
      const key100 = `${cat}-100-${filters.month}-${filters.year}`;
      const key80 = `${cat}-80-${filters.month}-${filters.year}`;

      if (pct >= 100 && !alertedRef.current.has(key100)) {
        alertedRef.current.add(key100);
        toast.error(`⚠️ ${cat}: superaste el presupuesto mensual`, { duration: 5000 });
      } else if (pct >= 80 && pct < 100 && !alertedRef.current.has(key80)) {
        alertedRef.current.add(key80);
        toast(`🟡 ${cat}: llevas el ${pct.toFixed(0)}% del presupuesto`, { duration: 4000 });
      }
    });
  }, [categoryTotals, budgets, filters.month, filters.year]);

  // ── Notificaciones móviles (Capacitor) ───────────────────────────────────────
  useEffect(() => {
    if (!user) { cancelAllNotifications(); return; }
    scheduleAllNotifications({
      salary, budgets, categoryTotals, debts, goals,
      creditCards, currentMonthTotal, totalIncome, weeklySpendingData,
    });
  }, [user, salary, budgets, categoryTotals, debts, goals, creditCards, currentMonthTotal, totalIncome]);

  // ── Desglose débito vs tarjeta ─────────────────────────────────────────────
  const debitExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => !e.creditCardId)
      .reduce((a, e) => a + e.amount, 0);
  }, [filteredExpenses]);

  const creditExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => !!e.creditCardId)
      .reduce((a, e) => a + e.amount, 0);
  }, [filteredExpenses]);

  const totalCreditCardUsed = useMemo(() => {
    return creditCards.reduce((a, c) => a + (c.usedAmount || 0), 0);
  }, [creditCards]);

  const totalCreditCardLimit = useMemo(() => {
    return creditCards.reduce((a, c) => a + (c.creditLimit || 0), 0);
  }, [creditCards]);

  return (
    <ExpenseContext.Provider value={{
      expenses, filteredExpenses, categories, filters, setFilters,
      addExpense, deleteExpense, updateExpense, loading,
      salary, setSalary, budgets, setBudgets,
      debitBalance, setDebitBalance,
      monthlyBarData, currentMonthTotal, categoryTotals,
      additionalIncomes, addIncome, deleteIncome,
      recurringExpenses, addRecurring, deleteRecurring, toggleRecurring, registerAllRecurring,
      debts, addDebt, deleteDebt, payDebt, updateDebt,
      creditCards, addCreditCard, deleteCreditCard, updateCreditCard, resetCardBalance,
      goals, addGoal, deleteGoal, contributeToGoal,
      totalIncome, totalDebtPayment, realAvailable,
      debitExpensesTotal, creditExpensesTotal, totalCreditCardUsed, totalCreditCardLimit,
      currency, setCurrency, exchangeRate, setExchangeRate, suggestedBudgets,
      upcomingDueDebt, financialHealth, weeklySpendingData,
      financialScore, balanceProjection,
      shareMonth,
      splitPersons, addSplitPerson, deleteSplitPerson,
      splitExpenses, addSplitExpense, deleteSplitExpense, settleSplitExpense, settleAllWithPerson,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
