import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = () => Capacitor.isNativePlatform();

// ── Request permission ────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!isNative()) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
}

// ── Cancel all pending ────────────────────────────────────────────────────────
async function cancelAll() {
  if (!isNative()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }
}

// ── Schedule a single notification ───────────────────────────────────────────
async function schedule(id, title, body, scheduleAt) {
  if (!isNative()) return;
  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: { at: scheduleAt },
      sound: null,
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    }],
  });
}

// ── Schedule recurring via interval ──────────────────────────────────────────
async function scheduleRepeating(id, title, body, scheduleAt, every) {
  if (!isNative()) return;
  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: { at: scheduleAt, every, allowWhileIdle: true },
      sound: null,
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    }],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION IDs
// ═══════════════════════════════════════════════════════════════════════════════
const ID = {
  // Existentes
  DAILY_REMINDER:    1,
  BUDGET_WARNING:    2,
  BUDGET_EXCEEDED:   3,
  DEBT_DUE:          4,  // ≤ 7 días
  SALARY_DAY:        5,
  END_OF_MONTH:      6,
  DEBT_PAYMENT_DAY:  7,
  GOAL_REMINDER:     8,

  // Nuevos
  DEBT_DUE_3DAYS:    9,   // 3 días exactos antes del vencimiento
  DEBT_DUE_1DAY:     10,  // 1 día exacto antes del vencimiento
  CUOTA_MONTHLY:     11,  // Recordatorio cuotas (día 5 de cada mes)
  LOW_CREDIT:        12,  // Tarjeta de crédito < 20% disponible
  WEEKLY_REPORT:     13,  // Resumen semanal (lunes 09:00)
  GOAL_MILESTONE:    14,  // Meta al 75%+
  OVERSPENDING:      15,  // Gastos superan ingresos
  RECURRING_DAY:     16,  // Recordatorio recurrentes (día 1 del mes)
  // IDs 20-29 reservados para deudas múltiples (3 días)
  // IDs 30-39 reservados para deudas múltiples (1 día)
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════
export async function scheduleAllNotifications({
  salary, budgets, categoryTotals, debts, goals,
  creditCards = [], currentMonthTotal = 0, totalIncome = 0, weeklySpendingData = null,
}) {
  if (!isNative()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAll();

  const now = new Date();

  // ── 1. Recordatorio diario — 21:30 ───────────────────────────────────────────
  const dailyAt = new Date(now);
  dailyAt.setHours(21, 30, 0, 0);
  if (dailyAt <= now) dailyAt.setDate(dailyAt.getDate() + 1);
  await scheduleRepeating(
    ID.DAILY_REMINDER,
    '💸 ¿Registraste tus gastos hoy?',
    'Tómate un minuto para apuntar lo que gastaste. Tu yo de fin de mes te lo agradecerá.',
    dailyAt,
    'day'
  );

  // ── 2. Alerta presupuesto al 80% ─────────────────────────────────────────────
  if (budgets && categoryTotals) {
    const warnCats = Object.entries(categoryTotals)
      .filter(([cat, spent]) => {
        const limit = budgets[cat] || 0;
        if (limit === 0) return false;
        const pct = (spent / limit) * 100;
        return pct >= 80 && pct < 100;
      })
      .map(([cat]) => cat);

    if (warnCats.length > 0) {
      const at = new Date(now.getTime() + 5 * 60 * 1000);
      await schedule(
        ID.BUDGET_WARNING,
        `⚠️ Presupuesto de ${warnCats[0]} al límite`,
        `Ya usaste más del 80% de tu presupuesto en ${warnCats[0]}. Ojo con lo que gastas este mes.`,
        at
      );
    }
  }

  // ── 3. Alerta presupuesto superado ───────────────────────────────────────────
  if (budgets && categoryTotals) {
    const exceededCats = Object.entries(categoryTotals)
      .filter(([cat, spent]) => {
        const limit = budgets[cat] || 0;
        return limit > 0 && spent > limit;
      })
      .map(([cat]) => cat);

    if (exceededCats.length > 0) {
      const at = new Date(now.getTime() + 3 * 60 * 1000);
      await schedule(
        ID.BUDGET_EXCEEDED,
        '🚨 Superaste el presupuesto',
        `Pasaste el límite en: ${exceededCats.join(', ')}. Revisa tus gastos antes de fin de mes.`,
        at
      );
    }
  }

  // ── 4. Deuda más próxima a vencer (≤ 7 días) — genérico ──────────────────────
  const nearDebts = (debts || []).filter(d => {
    if (!d.dueDate || d.paid) return false;
    const due = new Date(d.dueDate + 'T00:00:00');
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (nearDebts.length > 0) {
    const d = nearDebts[0];
    const diff = Math.ceil((new Date(d.dueDate + 'T00:00:00') - now) / (1000 * 60 * 60 * 24));
    const at = new Date(now.getTime() + 10 * 60 * 1000);
    await schedule(
      ID.DEBT_DUE,
      `📅 Vence: ${d.name}`,
      diff === 0
        ? `¡Hoy vence el pago de "${d.name}"! No te olvides de pagarlo.`
        : `Quedan ${diff} día${diff > 1 ? 's' : ''} para el vencimiento de "${d.name}".`,
      at
    );
  }

  // ── 5. Día de pago tarjetas — día 15 de cada mes, 09:00 ──────────────────────
  const paymentDay15 = new Date(now.getFullYear(), now.getMonth(), 15, 9, 0, 0, 0);
  if (paymentDay15 <= now) paymentDay15.setMonth(paymentDay15.getMonth() + 1);
  await schedule(
    ID.DEBT_PAYMENT_DAY,
    '💳 Día de pago de tarjetas',
    'Hoy es el día 15. Recuerda pagar tus tarjetas de crédito para evitar intereses.',
    paymentDay15
  );

  // ── 6. Fin de mes — día 28, 19:00Street ─────────────────────────────────────
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 28, 19, 0, 0, 0);
  if (endMonth <= now) endMonth.setMonth(endMonth.getMonth() + 1);
  await schedule(
    ID.END_OF_MONTH,
    '📊 Cierre de mes en 3 días',
    '¿Cómo vas con tu presupuesto? Entra a CostApp y revisa el Resumen Anual antes de que termine el mes.',
    endMonth
  );

  // ── 7. Día 1 del mes — 10:00 ─────────────────────────────────────────────────
  if (salary > 0) {
    const salaryDay = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0, 0);
    await schedule(
      ID.SALARY_DAY,
      '🎉 ¡Nuevo mes, nueva oportunidad!',
      'Entra a CostApp para revisar tus compromisos del mes y empezar con el pie derecho.',
      salaryDay
    );
  }

  // ── 8. Recordatorio metas de ahorro — lunes 08:00 ────────────────────────────
  if ((goals || []).some(g => g.currentAmount < g.targetAmount)) {
    const monday = new Date(now);
    const day = monday.getDay();
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
    monday.setDate(monday.getDate() + daysUntilMonday);
    monday.setHours(8, 0, 0, 0);
    await scheduleRepeating(
      ID.GOAL_REMINDER,
      '🎯 ¿Contribuiste a tus metas esta semana?',
      'Cada pequeño aporte cuenta. Entra a Metas y registra tu avance de la semana.',
      monday,
      'week'
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NUEVAS NOTIFICACIONES
  // ════════════════════════════════════════════════════════════════════════════

  // ── 9. Vencimiento exacto a 3 días (hasta 5 deudas) ──────────────────────────
  const debts3days = (debts || []).filter(d => {
    if (!d.dueDate || d.paid) return false;
    const diff = Math.ceil((new Date(d.dueDate + 'T00:00:00') - now) / (1000 * 60 * 60 * 24));
    return diff === 3;
  });
  for (let i = 0; i < Math.min(debts3days.length, 5); i++) {
    const d = debts3days[i];
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    await schedule(
      20 + i,
      `⏰ 3 días para vencer: ${d.name}`,
      `El pago de "${d.name}" ($${Number(d.monthlyPayment || 0).toLocaleString('es-CL')}) vence en 3 días. ¡No lo dejes para el último momento!`,
      at
    );
  }

  // ── 10. Vencimiento exacto a 1 día ───────────────────────────────────────────
  const debts1day = (debts || []).filter(d => {
    if (!d.dueDate || d.paid) return false;
    const diff = Math.ceil((new Date(d.dueDate + 'T00:00:00') - now) / (1000 * 60 * 60 * 24));
    return diff === 1;
  });
  for (let i = 0; i < Math.min(debts1day.length, 5); i++) {
    const d = debts1day[i];
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    await schedule(
      30 + i,
      `🔔 ¡Mañana vence: ${d.name}!`,
      `El pago de "${d.name}" vence mañana. Asegúrate de tener el dinero listo ($${Number(d.monthlyPayment || 0).toLocaleString('es-CL')}).`,
      at
    );
  }

  // ── 11. Recordatorio cuotas — día 5 de cada mes, 09:00 ──────────────────────
  const activeDebtsWithPayment = (debts || []).filter(d => !d.paid && (d.monthlyPayment || 0) > 0);
  if (activeDebtsWithPayment.length > 0) {
    const totalCuotas = activeDebtsWithPayment.reduce((a, d) => a + (d.monthlyPayment || 0), 0);
    const cuotaDay = new Date(now.getFullYear(), now.getMonth(), 5, 9, 0, 0, 0);
    if (cuotaDay <= now) cuotaDay.setMonth(cuotaDay.getMonth() + 1);
    await schedule(
      ID.CUOTA_MONTHLY,
      `📆 Semana de pago de cuotas`,
      `Tienes ${activeDebtsWithPayment.length} cuota${activeDebtsWithPayment.length > 1 ? 's' : ''} por pagar este mes por un total de $${totalCuotas.toLocaleString('es-CL')}. ¡Organízate a tiempo!`,
      cuotaDay
    );
  }

  // ── 12. Tarjeta de crédito con cupo bajo (< 20%) ─────────────────────────────
  const lowCreditCards = (creditCards || []).filter(c => {
    if (c.type === 'debit' || !c.creditLimit) return false;
    const available = (c.creditLimit || 0) - (c.usedAmount || 0);
    return available >= 0 && available / c.creditLimit < 0.20;
  });
  if (lowCreditCards.length > 0) {
    const card = lowCreditCards[0];
    const available = (card.creditLimit || 0) - (card.usedAmount || 0);
    const at = new Date(now.getTime() + 8 * 60 * 1000);
    await schedule(
      ID.LOW_CREDIT,
      `💳 Cupo bajo en ${card.name}`,
      `Solo te queda $${available.toLocaleString('es-CL')} disponible en tu tarjeta "${card.name}" (menos del 20%). Úsala con precaución.`,
      at
    );
  }

  // ── 13. Reporte semanal — lunes 09:00 ────────────────────────────────────────
  if (weeklySpendingData && weeklySpendingData.lastWeek > 0) {
    const nextMonday = new Date(now);
    const day = nextMonday.getDay();
    const daysUntil = day === 1 ? 7 : (8 - day) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntil);
    nextMonday.setHours(9, 0, 0, 0);

    const { lastWeek, changePct } = weeklySpendingData;
    const trend = changePct === null ? '' : changePct <= 0
      ? ` ¡Gastaste un ${Math.abs(changePct)}% menos que la semana anterior!`
      : ` Gastaste un ${changePct}% más que la semana anterior.`;

    await schedule(
      ID.WEEKLY_REPORT,
      '📈 Tu resumen semanal',
      `La semana pasada gastaste $${lastWeek.toLocaleString('es-CL')}.${trend} Revisa CostApp para ver el detalle.`,
      nextMonday
    );
  }

  // ── 14. Meta al 75% — notificación inmediata (solo una vez por sesión) ────────
  const nearGoals = (goals || []).filter(g => {
    if (!g.targetAmount || g.targetAmount === 0) return false;
    const pct = (g.currentAmount / g.targetAmount) * 100;
    return pct >= 75 && pct < 100;
  });
  if (nearGoals.length > 0) {
    const g = nearGoals[0];
    const remaining = g.targetAmount - g.currentAmount;
    const at = new Date(now.getTime() + 15 * 60 * 1000);
    await schedule(
      ID.GOAL_MILESTONE,
      `🏆 ¡Estás muy cerca de tu meta!`,
      `Tu meta "${g.name}" lleva el ${Math.round((g.currentAmount / g.targetAmount) * 100)}% completado. ¡Solo faltan $${remaining.toLocaleString('es-CL')} para lograrlo!`,
      at
    );
  }

  // ── 15. Gastos superan ingresos — alerta inmediata ───────────────────────────
  if (totalIncome > 0 && currentMonthTotal > totalIncome) {
    const excess = currentMonthTotal - totalIncome;
    const at = new Date(now.getTime() + 2 * 60 * 1000);
    await schedule(
      ID.OVERSPENDING,
      '🚨 ¡Gastos superan tus ingresos!',
      `Este mes gastaste $${excess.toLocaleString('es-CL')} más de lo que ingresa. Entra a CostApp y revisa dónde puedes reducir.`,
      at
    );
  }

  // ── 16. Recordatorio gastos recurrentes — día 1 del mes, 08:00 ───────────────
  const recurringDay = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0);
  await schedule(
    ID.RECURRING_DAY,
    '📋 Inicio de mes: registra tus fijos',
    'Nuevo mes comenzado. No olvides registrar tus gastos recurrentes (arriendo, servicios, suscripciones).',
    recurringDay
  );
}

// ── Cancel all (for logout) ───────────────────────────────────────────────────
export async function cancelAllNotifications() {
  if (!isNative()) return;
  await cancelAll();
}
