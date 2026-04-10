const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmt = (value) =>
  Number(value || 0).toLocaleString('es-CL');

export const exportToPDF = (expenses, salary, budgets, categoryTotals, filters) => {
  const month = filters?.month ?? new Date().getMonth();
  const year = filters?.year ?? new Date().getFullYear();
  const monthLabel = month === -1 ? 'Todos los meses' : MONTH_NAMES[month];
  const periodLabel = `${monthLabel} ${year}`;

  const totalSpent = Object.values(categoryTotals || {}).reduce((a, b) => a + b, 0);
  const available = (salary || 0) - totalSpent;

  // Category rows
  const categoryRows = Object.entries(categoryTotals || {})
    .sort((a, b) => b[1] - a[1])
    .map(([cat, spent]) => {
      const budget = budgets?.[cat] || 0;
      const diff = budget - spent;
      const diffColor = diff < 0 ? '#ef4444' : '#10b981';
      return `
        <tr>
          <td>${cat}</td>
          <td class="num">${fmt(spent)}</td>
          <td class="num">${budget > 0 ? fmt(budget) : '—'}</td>
          <td class="num" style="color:${diffColor}">${budget > 0 ? (diff >= 0 ? '+' : '') + fmt(diff) : '—'}</td>
        </tr>`;
    })
    .join('');

  // Expense detail rows
  const sortedExpenses = [...(expenses || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const expenseRows = sortedExpenses
    .map((exp) => {
      const dateObj = new Date(exp.date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('es-ES');
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${exp.category || ''}</td>
          <td>${exp.description || ''}</td>
          <td class="num">${fmt(exp.amount)}</td>
        </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Gastos - ${periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #4338ca; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #475569; margin-bottom: 28px; }
    h2 { font-size: 14px; font-weight: 700; color: #4338ca; margin: 24px 0 10px; border-bottom: 2px solid #4338ca; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    thead tr { background: #4338ca; color: #fff; }
    thead th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr:nth-child(even) { background: #f1f5f9; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 8px; }
    .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
    .summary-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
    .summary-box .value { font-size: 18px; font-weight: 700; color: #1e293b; }
    .available { color: ${available >= 0 ? '#059669' : '#dc2626'} !important; }
    .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <h1>Reporte de Gastos</h1>
  <p class="subtitle">Período: ${periodLabel} &nbsp;|&nbsp; Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

  <h2>Resumen General</h2>
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Sueldo</div>
      <div class="value">${fmt(salary)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Gastado</div>
      <div class="value">${fmt(totalSpent)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Disponible</div>
      <div class="value available">${fmt(available)}</div>
    </div>
  </div>

  <h2>Resumen por Categoría</h2>
  <table>
    <thead>
      <tr>
        <th>Categoría</th>
        <th style="text-align:right">Gastado</th>
        <th style="text-align:right">Presupuesto</th>
        <th style="text-align:right">Diferencia</th>
      </tr>
    </thead>
    <tbody>
      ${categoryRows}
      <tr style="font-weight:700;background:#e0e7ff">
        <td>TOTAL</td>
        <td class="num">${fmt(totalSpent)}</td>
        <td class="num">—</td>
        <td class="num">—</td>
      </tr>
    </tbody>
  </table>

  <h2>Detalle de Gastos (${sortedExpenses.length} movimientos)</h2>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Categoría</th>
        <th>Descripción</th>
        <th style="text-align:right">Monto</th>
      </tr>
    </thead>
    <tbody>
      ${expenseRows}
    </tbody>
  </table>

  <p class="footer">Reporte generado automáticamente — Control de Gastos</p>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para generar el PDF.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  };
};
