import Papa from 'papaparse';
import { ColumnMapping, Transaction, UserOverrides } from '../types/finance';
import { normalizeMerchantAndClassify } from './categories';

export interface ParsedCsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  suggestedMapping: ColumnMapping;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export function detectDateOrder(dateStrings: string[]): 'DMY' | 'MDY' {
  // Scan all slash/dash dates to see if part 1 or part 2 exceeds 12
  for (const raw of dateStrings) {
    if (!raw) continue;
    const m = raw.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      const p1 = parseInt(m[1], 10);
      const p2 = parseInt(m[2], 10);
      if (p1 > 12 && p2 <= 12) return 'DMY';
      if (p2 > 12 && p1 <= 12) return 'MDY';
    }
  }
  // Default to DMY (NZ/AU/UK/ISO preference)
  return 'DMY';
}

export function parseFlexibleDate(raw: string, order: 'DMY' | 'MDY' = 'DMY'): string | null {
  if (!raw) return null;
  const str = raw.trim();

  // 1. ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 2. Slash or hyphen DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    let y = parseInt(slashMatch[3], 10);
    if (y < 100) y += 2000;

    let d = order === 'DMY' ? p1 : p2;
    let m = order === 'DMY' ? p2 : p1;
    // Fallback if invalid month
    if (m > 12 && d <= 12) {
      const tmp = d;
      d = m;
      m = tmp;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 3. Text month e.g. "14 Jul 2026" or "Jul 14, 2026"
  const dmyText = str.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3,9})[\s\-,]+(\d{2,4})/);
  if (dmyText) {
    const d = parseInt(dmyText[1], 10);
    const mName = dmyText[2].toLowerCase().slice(0, 3);
    let y = parseInt(dmyText[3], 10);
    if (y < 100) y += 2000;
    const m = MONTH_MAP[mName];
    if (m && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  const mdyText = str.match(/^([A-Za-z]{3,9})[\s\-]+(\d{1,2})[\s\-,]+(\d{2,4})/);
  if (mdyText) {
    const mName = mdyText[1].toLowerCase().slice(0, 3);
    const d = parseInt(mdyText[2], 10);
    let y = parseInt(mdyText[3], 10);
    if (y < 100) y += 2000;
    const m = MONTH_MAP[mName];
    if (m && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export function parseCurrencyNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  // Handle accounting parentheses e.g. (45.20) -> -45.20 or CR/DR suffixes
  let isNegative = false;
  if (/^\(.*\)$/.test(s)) {
    isNegative = true;
    s = s.slice(1, -1);
  }
  if (/\bDR$/i.test(s) || /-$/.test(s)) {
    isNegative = true;
  }

  const cleaned = s.replace(/[^0-9.\-+]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return null;
  if (isNegative && num > 0) return -num;
  return num;
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const findCol = (patterns: RegExp[]): string => {
    for (const pat of patterns) {
      const hit = headers.find((h) => pat.test(h.trim()));
      if (hit) return hit;
    }
    return '';
  };

  const dateCol = findCol([
    /^date$/i,
    /transaction\s*date/i,
    /processed\s*date/i,
    /value\s*date/i,
    /date/i,
  ]) || headers[0] || '';

  const debitCol = findCol([
    /^debit$/i,
    /debit\s*amount/i,
    /withdrawal/i,
    /money\s*out/i,
    /paid\s*out/i,
    /^outflow$/i,
  ]);

  const creditCol = findCol([
    /^credit$/i,
    /credit\s*amount/i,
    /deposit/i,
    /money\s*in/i,
    /paid\s*in/i,
    /^inflow$/i,
  ]);

  const amountCol = findCol([
    /^amount$/i,
    /transaction\s*amount/i,
    /^value$/i,
    /amount\s*\(/i,
    /amount/i,
  ]);

  const amountMode = debitCol && creditCol && !amountCol ? 'split' : 'single';

  const merchantCol = findCol([
    /^payee$/i,
    /^merchant$/i,
    /other\s*party/i,
    /^name$/i,
    /counterparty/i,
    /description/i,
    /details/i,
  ]);

  const descriptionCol = findCol([
    /^particulars$/i,
    /^description$/i,
    /^memo$/i,
    /^details$/i,
    /^narrative$/i,
    /^type$/i,
  ]);

  const referenceCol = findCol([
    /^reference$/i,
    /^code$/i,
    /tran\s*type/i,
    /^category$/i,
  ]);

  const balanceCol = findCol([
    /^balance$/i,
    /running\s*balance/i,
    /account\s*balance/i,
  ]);

  return {
    dateCol,
    amountMode,
    amountCol: amountCol || headers[1] || '',
    debitCol,
    creditCol,
    merchantCol: merchantCol || descriptionCol || headers[2] || '',
    descriptionCol: descriptionCol !== merchantCol ? descriptionCol : '',
    referenceCol,
    balanceCol,
    invertSign: false,
    currencySymbol: '$',
  };
}

export function parseCsvToPreview(csvText: string): ParsedCsvPreview {
  const result = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = result.meta.fields || [];
  const rows = result.data || [];
  const suggestedMapping = autoDetectMapping(headers);

  return {
    headers,
    rows,
    suggestedMapping,
  };
}

export function buildTransactionsFromRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  overrides: UserOverrides
): Transaction[] {
  const rawDates = rows.map((r) => r[mapping.dateCol] || '');
  const dateOrder = detectDateOrder(rawDates);

  const parsedList: Transaction[] = [];

  rows.forEach((row, idx) => {
    const isoDate = parseFlexibleDate(row[mapping.dateCol] || '', dateOrder);
    if (!isoDate) return;

    let amount: number | null = null;
    if (mapping.amountMode === 'split') {
      const debitVal = parseCurrencyNumber(row[mapping.debitCol]);
      const creditVal = parseCurrencyNumber(row[mapping.creditCol]);
      if (debitVal !== null && Math.abs(debitVal) > 0) {
        amount = -Math.abs(debitVal);
      } else if (creditVal !== null && Math.abs(creditVal) > 0) {
        amount = Math.abs(creditVal);
      } else if (debitVal === 0 || creditVal === 0) {
        amount = 0;
      }
    } else {
      const singleVal = parseCurrencyNumber(row[mapping.amountCol]);
      if (singleVal !== null) {
        amount = mapping.invertSign ? -singleVal : singleVal;
      }
    }

    if (amount === null) return;

    const rawMerchant = (row[mapping.merchantCol] || '').trim();
    const description = mapping.descriptionCol ? (row[mapping.descriptionCol] || '').trim() : '';
    const reference = mapping.referenceCol ? (row[mapping.referenceCol] || '').trim() : '';
    const balanceAfter = mapping.balanceCol ? parseCurrencyNumber(row[mapping.balanceCol]) : null;

    const id = `tx-${isoDate}-${idx}-${Math.round(amount * 100)}`;
    if (overrides.txExcludedOverrides[id]) return;

    const classified = normalizeMerchantAndClassify(
      rawMerchant,
      description,
      reference,
      amount,
      overrides.merchantCategoryRules
    );

    const finalCategory = overrides.txCategoryOverrides[id] || classified.category;

    let txType: Transaction['type'] = 'expense';
    if (finalCategory === 'transfer') {
      txType = 'transfer';
    } else if (amount > 0) {
      if (
        finalCategory !== 'income' &&
        /refund|reversal|return/i.test(`${rawMerchant} ${description} ${reference}`)
      ) {
        txType = 'refund';
      } else {
        txType = 'income';
      }
    } else {
      txType = 'expense';
    }

    const absAmount = Math.abs(amount);
    const dt = new Date(`${isoDate}T12:00:00Z`);
    const timestamp = dt.getTime();
    const monthKey = isoDate.slice(0, 7);
    const dayOfWeek = dt.getUTCDay();
    const dayOfMonth = dt.getUTCDate();

    const isMicroSpend =
      txType === 'expense' &&
      absAmount > 0 &&
      absAmount <= 18 &&
      [
        'coffee_snacks',
        'dining_takeout',
        'shopping',
        'entertainment',
        'gambling_gaming',
        'general',
        'uncategorized',
      ].includes(finalCategory);

    parsedList.push({
      id,
      date: isoDate,
      timestamp,
      monthKey,
      dayOfWeek,
      dayOfMonth,
      rawMerchant: rawMerchant || description || 'Transaction',
      normalizedMerchant: classified.normalizedMerchant,
      description,
      reference,
      amount,
      absAmount,
      balanceAfter,
      type: txType,
      category: finalCategory,
      matchSource: overrides.txCategoryOverrides[id]
        ? 'user_rule'
        : classified.matchSource,
      matchReason: overrides.txCategoryOverrides[id]
        ? 'Manual category override'
        : classified.matchReason,
      functionalSubgroup: classified.functionalGroup,
      isRecurring: false,
      isOutlier: Boolean(overrides.txOutlierOverrides[id]),
      isBNPL: classified.isBNPL || finalCategory === 'bnpl',
      isFee: classified.isFee || finalCategory === 'fees_interest',
      isMicroSpend,
      daysSincePayday: null,
      userOverriddenCategory: overrides.txCategoryOverrides[id],
      userMarkedOutlier: overrides.txOutlierOverrides[id],
    });
  });

  // Sort chronologically ascending
  parsedList.sort((a, b) => a.timestamp - b.timestamp);

  // If CSV did not have a running balance column, synthesize a realistic trajectory starting from $1,850
  const hasAnyBalance = parsedList.some((t) => t.balanceAfter !== null);
  if (!hasAnyBalance && parsedList.length > 0) {
    let running = 1850;
    for (const tx of parsedList) {
      running = Math.round((running + tx.amount) * 100) / 100;
      tx.balanceAfter = running;
    }
  }

  return parsedList;
}
