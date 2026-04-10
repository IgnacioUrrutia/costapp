// ── Keyword-based category guesser ───────────────────────────────────────────
export function guessCategory(description) {
  const d = (description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/uber|taxi|cabify|payu.*trip|recorrido|bip|transantiago|combustib|bencin|copec|petrobras|shell|enex|autobus|taller|mecanica|repuesto|integra.*auto|neumatico/.test(d)) return 'Transporte';
  if (/farmacia|clinica|hospital|medic|doctor|dentist|laboratorio|optica|isapre|fonasa/.test(d)) return 'Salud';
  if (/sodimac|homecenter|easy|construmart|ferreteria|pinturas|muebles|hogar|arrend|alquiler|agua potable|electricidad|comgas|metrogas|cge|chilectra/.test(d)) return 'Vivienda';
  if (/entel|vtr|movistar|claro|wom|mantencion.*plan|plan.*movil|internet|telefon/.test(d)) return 'Vivienda';
  if (/gustapan|panificadora|panaderia|fruteria|frutas|verdura|supermercad|lider|jumbo|unimarc|ekono|santa isabel|tottus|acuenta|altomarket|elaboradora|deliciacasera|koreamar|hawaii|donde.*nico|express.*sto|jores|ekono|mercado.*food|mall.*chino/.test(d)) return 'Alimentación';
  if (/botiller|licoreria|\bbar\b|discoteca|casino|\bcine\b|teatro|concierto|bajon|scarfac|parraguez|mateeeee/.test(d)) return 'Entretenimiento';
  if (/netflix|spotify|disney|hbo|amazon.*prime|youtube.*premium|steam|playstation|xbox|nintendo|twitch/.test(d)) return 'Entretenimiento';
  if (/claude|openai|chatgpt|microsoft 365|google workspace/.test(d)) return 'Personal';
  if (/bazar|tia ani|tienda|boutique|ropa|vestuario|zapateria|peluqueria|salon|spa|belleza|mundomedio|telecarane|imperio/.test(d)) return 'Personal';
  if (/comision|interes|mora|impuesto|iva|servicio.*admin|administracion|reestructura|refinancia|cuota.*deuda|seg.*desgrav/.test(d)) return 'Financiero';
  if (/ahorro|inversion|deposito.*plazo|fondo mutuo/.test(d)) return 'Ahorro/Inversión';
  if (/transf.*a |transf\. |traspaso|pago.*tarjeta/.test(d)) return null; // skip transfers

  return 'Personal';
}

// ── Parse amount string → number ─────────────────────────────────────────────
function parseAmt(val) {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(/\./g, '').replace(/,/g, '.').replace(/[$\s]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? null : Math.abs(Math.round(n));
}

// ── Convert Chilean date strings to YYYY-MM-DD ────────────────────────────────
function toISODate(str) {
  if (!str) return null;
  const s = String(str).trim();
  // DD-MM-YYYY or DD/MM/YYYY or DD/MM/YY
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = '20' + y;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ════════════════════════════════════════════════════════════════════════════
// EXCEL PARSERS
// ════════════════════════════════════════════════════════════════════════════

export function parseExcelFile(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const XLSX = window._XLSX; // set by the component
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // ── Banco de Chile / Banco Estado Cuenta Corriente ────────────────────────
  if (rows[1] && String(rows[1][0]).includes('Cuenta Corriente')) {
    return parseBancoChileCuentaCorriente(rows);
  }

  // ── Falabella CMR Excel ───────────────────────────────────────────────────
  if (rows.some(r => String(r[0]).toLowerCase().includes('cmr') || String(r[0]).toLowerCase().includes('falabella'))) {
    return parseFalabellaExcel(rows);
  }

  // ── Generic Excel: try to find date/description/amount columns ───────────
  return parseGenericExcel(rows);
}

function parseBancoChileCuentaCorriente(rows) {
  // Row 0: name, Row 1: "Cuenta Corriente: XXXX", Row 2: headers, Row 3+: data
  const accountLine = String(rows[1]?.[0] || '');
  const accountMatch = accountLine.match(/[\d-]+/);
  const accountRaw = accountMatch ? accountMatch[0] : 'Cuenta Corriente';
  const last4 = accountRaw.replace(/\D/g, '').slice(-4) || '0000';
  const ownerName = String(rows[0]?.[0] || '').trim();

  const cardInfo = {
    name: `Banco de Chile Cuenta Corriente ${last4}`,
    type: 'debit',
    last4,
    creditLimit: 0, // will be set from last balance row if available
    usedAmount: 0,
    bank: 'Banco de Chile',
    ownerName,
  };

  // Find current balance from first data row saldo column
  const firstDataRow = rows[3];
  if (firstDataRow && firstDataRow[4] !== '') {
    // Don't set balance here - user can set it manually
  }

  const transactions = [];
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c === '')) continue;
    const date = toISODate(String(row[0]));
    if (!date) continue;
    const description = String(row[1] || '').trim();
    const cargo = parseAmt(row[2]);
    // row[3] = abono (income) - skip
    if (!description) continue;
    // Only import expenses (cargo), skip transfers
    const cat = guessCategory(description);
    if (cat === null) continue; // skip transfers
    if (cargo === null || cargo <= 0) continue;

    transactions.push({
      date,
      description: cleanDescription(description),
      amount: cargo,
      category: cat,
    });
  }

  return { cardInfo, transactions, source: 'Banco de Chile - Cuenta Corriente' };
}

function parseFalabellaExcel(rows) {
  // Find header row (look for Fecha, Descripcion/Glosa, Cargo/Monto)
  let headerIdx = -1;
  let dateCol = -1, descCol = -1, amountCol = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i].map(c => String(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const dIdx = row.findIndex(c => /^fecha/.test(c));
    const descIdx = row.findIndex(c => /descripcion|glosa|detalle|concepto/.test(c));
    const amtIdx = row.findIndex(c => /cargo|monto|importe/.test(c));
    if (dIdx >= 0 && (descIdx >= 0 || amtIdx >= 0)) {
      headerIdx = i;
      dateCol = dIdx;
      descCol = descIdx >= 0 ? descIdx : -1;
      amountCol = amtIdx >= 0 ? amtIdx : -1;
      break;
    }
  }

  // Extract card number from first rows
  let last4 = '8901'; // default from the PDF we saw
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const joined = rows[i].join(' ');
    const m = joined.match(/(\d{4})\s*$/) || joined.match(/\*+(\d{4})/);
    if (m) { last4 = m[1]; break; }
  }

  const cardInfo = {
    name: `CMR Falabella ${last4}`,
    type: 'credit',
    last4,
    creditLimit: 400000,
    usedAmount: 0,
    bank: 'Falabella',
  };

  const transactions = [];
  if (headerIdx < 0) return { cardInfo, transactions, source: 'CMR Falabella' };

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c === '')) continue;
    const date = toISODate(String(dateCol >= 0 ? row[dateCol] : row[0]));
    if (!date) continue;
    const description = String(descCol >= 0 ? row[descCol] : row[1] || '').trim();
    const amount = parseAmt(amountCol >= 0 ? row[amountCol] : row[2]);
    if (!description || !amount || amount <= 0) continue;
    const cat = guessCategory(description);
    if (cat === null) continue;

    transactions.push({
      date,
      description: cleanDescription(description),
      amount,
      category: cat,
    });
  }

  return { cardInfo, transactions, source: 'CMR Falabella' };
}

function parseGenericExcel(rows) {
  // Try to auto-detect column positions
  let headerIdx = -1, dateCol = 0, descCol = 1, amountCol = 2;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i].map(c => String(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const dIdx = row.findIndex(c => /fecha|date/.test(c));
    const descIdx = row.findIndex(c => /descripcion|detalle|glosa|concepto|description/.test(c));
    const amtIdx = row.findIndex(c => /monto|cargo|importe|amount/.test(c));
    if (dIdx >= 0) {
      headerIdx = i;
      dateCol = dIdx;
      descCol = descIdx >= 0 ? descIdx : (dIdx + 1);
      amountCol = amtIdx >= 0 ? amtIdx : (dIdx + 2);
      break;
    }
  }

  const cardInfo = {
    name: 'Tarjeta importada',
    type: 'credit',
    last4: '0000',
    creditLimit: 0,
    usedAmount: 0,
    bank: 'Desconocido',
  };

  const transactions = [];
  const start = headerIdx >= 0 ? headerIdx + 1 : 1;
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c === '')) continue;
    const date = toISODate(String(row[dateCol]));
    if (!date) continue;
    const description = String(row[descCol] || '').trim();
    const amount = parseAmt(row[amountCol]);
    if (!description || !amount || amount <= 0) continue;
    const cat = guessCategory(description);
    if (cat === null) continue;

    transactions.push({
      date,
      description: cleanDescription(description),
      amount,
      category: cat,
    });
  }

  return { cardInfo, transactions, source: 'Excel (formato genérico)' };
}

// ════════════════════════════════════════════════════════════════════════════
// PDF PARSERS (pdfjs-dist)
// ════════════════════════════════════════════════════════════════════════════

export async function parsePDFFile(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map(i => i.str).join(' ') + '\n';
  }

  // Detect bank
  if (/santander/i.test(fullText)) return parseSantanderPDF(fullText);
  if (/falabella|cmr/i.test(fullText)) return parseFalaballaPDF(fullText);

  return { cardInfo: null, transactions: [], source: 'PDF (banco no reconocido)' };
}

function parseSantanderPDF(text) {
  // Card number: XXXX XXXX XXXX DDDD
  const cardMatch = text.match(/XXXX\s+XXXX\s+XXXX\s+(\d{4})/i);
  const last4 = cardMatch ? cardMatch[1] : '0000';
  const cardTypeMatch = text.match(/MASTERCARD\s+(\w+)/i);
  const cardType = cardTypeMatch ? `Mastercard ${cardTypeMatch[1]}` : 'Mastercard';

  // Cupo total
  const cupoMatch = text.match(/CUPO TOTAL[^$]*\$?\s*([\d.]+)/i);
  const creditLimit = cupoMatch ? parseAmt(cupoMatch[1]) || 500000 : 500000;

  const cardInfo = {
    name: `Santander ${cardType} ${last4}`,
    type: 'credit',
    last4,
    creditLimit,
    usedAmount: 0,
    bank: 'Santander',
  };

  const transactions = [];
  // Pattern: DD/MM/YY DESCRIPTION $XX.XXX or without $
  // Lines with date pattern followed by description and amount
  const lines = text.split(/\n/);
  for (const line of lines) {
    // Match: date description amount (amount at end)
    const m = line.match(/(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+\$?([\d.]+)\s*$/);
    if (!m) continue;
    const date = toISODate(m[1]);
    if (!date) continue;
    const description = m[2].trim();
    const amount = parseAmt(m[3]);
    if (!amount || amount <= 0) continue;
    // Skip negative entries (payments)
    if (description.toLowerCase().includes('cancelado') || description.toLowerCase().includes('pago')) continue;
    const cat = guessCategory(description);
    if (cat === null) continue;

    transactions.push({
      date,
      description: cleanDescription(description),
      amount,
      category: cat,
    });
  }

  return { cardInfo, transactions, source: 'Santander PDF' };
}

function parseFalaballaPDF(text) {
  // Contract: 999920******8901
  const contractMatch = text.match(/\d{6}\*+(\d{4})/);
  const last4 = contractMatch ? contractMatch[1] : '8901';

  // Cupo total
  const cupoMatch = text.match(/Cupo Total\*?\s+([\d.]+)/i);
  const creditLimit = cupoMatch ? parseAmt(cupoMatch[1]) || 400000 : 400000;

  const cardInfo = {
    name: `CMR Falabella ${last4}`,
    type: 'credit',
    last4,
    creditLimit,
    usedAmount: 0,
    bank: 'Falabella',
  };

  const transactions = [];
  const lines = text.split(/\n/);

  for (const line of lines) {
    // Pattern: DD/MM/YYYY Description Amount [TotalToPay] [Cuotas] ...
    const m = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.]+)\s/);
    if (!m) continue;
    const date = toISODate(m[1]);
    if (!date) continue;
    const description = m[2].trim();
    const amount = parseAmt(m[3]);
    if (!amount || amount <= 0) continue;
    // Skip interest/commission lines
    const cat = guessCategory(description);
    if (cat === null) continue;

    transactions.push({
      date,
      description: cleanDescription(description),
      amount,
      category: cat,
    });
  }

  return { cardInfo, transactions, source: 'CMR Falabella PDF' };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanDescription(str) {
  return str
    .replace(/^COMPRA NACIONAL\s+/i, '')
    .replace(/^E-COMMERCE\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
