import * as XLSX from 'xlsx';

/**
 * Genera un archivo Excel con:
 *  - Hoja 1: Detalle de todos los gastos
 *  - Hoja 2: Resumen por categoría con presupuesto vs real
 *  - Hoja 3: Resumen del mes (sueldo, total, disponible)
 *
 * @param {Array}  expenses      - Lista de gastos a exportar
 * @param {Array}  categories    - Lista de categorías
 * @param {number} salary        - Sueldo mensual configurado
 * @param {Object} budgets       - Presupuesto por categoría { 'Vivienda': 450, ... }
 * @param {Object} categoryTotals - Total gastado por categoría { 'Vivienda': 430, ... }
 */
export const exportExpensesToExcel = (
  expenses,
  categories,
  salary = 0,
  budgets = {},
  categoryTotals = {}
) => {
  if (!expenses || expenses.length === 0) return;

  const wb = XLSX.utils.book_new();

  // ─── Hoja 1: Detalle de Gastos ────────────────────────────────────────────
  const detailData = expenses.map((exp) => ({
    Fecha: new Date(exp.date + 'T00:00:00').toLocaleDateString('es-CL'),
    Categoría: exp.category,
    Descripción: exp.description || '-',
    Monto: exp.amount,
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailData);

  // Fórmula de sumatoria en la fila siguiente al último gasto
  const lastDetailRow = detailData.length + 1;
  XLSX.utils.sheet_add_aoa(
    wsDetail,
    [['TOTAL', '', '', { f: `SUM(D2:D${lastDetailRow})` }]],
    { origin: `A${lastDetailRow + 1}` }
  );

  // Ajuste de ancho de columnas
  wsDetail['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 35 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle de Gastos');

  // ─── Hoja 2: Presupuesto vs Real ─────────────────────────────────────────
  const summaryRows = categories.map((cat) => {
    const budget = budgets[cat.name] || 0;
    const spent = categoryTotals[cat.name] || 0;
    const diff = budget - spent;
    const pct = budget > 0 ? ((spent / budget) * 100).toFixed(1) + '%' : 'Sin presupuesto';
    return {
      Categoría: cat.name,
      Presupuesto: budget,
      'Total Gastado': spent,
      Diferencia: diff,
      '% Utilizado': pct,
    };
  });

  // Fila de totales
  const totalBudget = Object.values(budgets).reduce((a, b) => a + (b || 0), 0);
  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + (b || 0), 0);
  summaryRows.push({
    Categoría: 'TOTAL',
    Presupuesto: totalBudget,
    'Total Gastado': totalSpent,
    Diferencia: totalBudget - totalSpent,
    '% Utilizado': totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) + '%' : '-',
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Presupuesto vs Real');

  // ─── Hoja 3: Resumen del Mes ──────────────────────────────────────────────
  if (salary > 0) {
    const available = salary - totalSpent;
    const pctSpent = salary > 0 ? ((totalSpent / salary) * 100).toFixed(1) + '%' : '—';

    const overviewData = [
      { Concepto: 'Sueldo Mensual', Valor: salary },
      { Concepto: 'Total Gastado', Valor: totalSpent },
      { Concepto: 'Disponible', Valor: available },
      { Concepto: '% del Sueldo Gastado', Valor: pctSpent },
    ];

    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 28 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, wsOverview, 'Resumen del Mes');
  }

  // ─── Descarga ─────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Reporte_Gastos_${dateStr}.xlsx`);
};
