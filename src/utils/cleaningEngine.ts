/**
 * Core Data Cleaning, Normalization, Deduplication and Restructuring Engine
 */

import {
  CleaningRuleConfig,
  CleanedDataset,
  ColumnStat,
  ColumnType,
  FuzzyDuplicatePair,
  HeaderCasing,
  RestructureAction,
  TransformationMetric
} from '../types/dataCleaner';

export const DEFAULT_CLEANING_CONFIG: CleaningRuleConfig = {
  // Structure & Headers
  autoDetectHeader: true,
  skipRowsCount: 0,
  headerCase: 'clean_title',
  removeEmptyRows: true,
  removeEmptyCols: true,

  // Whitespace & Sanitization
  trimWhitespace: true,
  collapseInnerWhitespace: true,
  stripControlChars: true,

  // Normalization
  normalizeEmails: true,
  normalizePhones: true,
  phoneFormatTarget: 'US_STANDARD',
  normalizeDates: true,
  dateFormatTarget: 'YYYY-MM-DD',
  normalizeNumbers: true,
  normalizeBooleans: true,
  standardizeNulls: true,
  nullTokens: ['N/A', 'NA', 'n/a', 'na', 'null', 'NULL', 'None', 'NONE', 'nil', '-', '--', '?', 'undefined', '#N/A', 'NaN', 'unknown'],
  nullReplacement: '',

  // Deduplication
  deduplicate: true,
  deduplicateMode: 'case_insensitive',
  deduplicateKeys: [], // empty means all columns
  deduplicateKeep: 'first',
  fuzzyDeduplicate: true,
  fuzzyThreshold: 0.85,
  fuzzyKey: '',

  // Restructuring
  restructureRules: []
};

// ----------------------------------------------------
// Header Detection & Formatting
// ----------------------------------------------------

export function detectHeaderRowIndex(matrix: any[][]): number {
  if (!matrix || matrix.length === 0) return 0;
  if (matrix.length === 1) return 0;

  const maxCheckRows = Math.min(12, matrix.length);
  let bestIndex = 0;
  let highestScore = -100;

  for (let r = 0; r < maxCheckRows; r++) {
    const row = matrix[r] || [];
    const nonBlankCells = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '');

    if (nonBlankCells.length === 0) continue;

    let score = nonBlankCells.length * 10;
    
    // Check if values in this row look like header names (strings, <= 45 chars, no giant paragraphs)
    let stringCount = 0;
    let reasonableLengthCount = 0;
    let distinctValues = new Set<string>();

    for (const cell of nonBlankCells) {
      const str = String(cell).trim();
      distinctValues.add(str.toLowerCase());
      if (typeof cell === 'string' || isNaN(Number(str))) {
        stringCount++;
      }
      if (str.length >= 2 && str.length <= 45) {
        reasonableLengthCount++;
      }
      // Penalize huge disclaimers or title banners with asterisk/confidential
      if (str.includes('***') || str.toLowerCase().includes('confidential') || str.toLowerCase().includes('export date')) {
        score -= 40;
      }
    }

    score += (stringCount / nonBlankCells.length) * 20;
    score += (reasonableLengthCount / nonBlankCells.length) * 25;
    score += (distinctValues.size / nonBlankCells.length) * 15;

    // Check next row: if next row has data, this is very likely the header
    if (r + 1 < matrix.length) {
      const nextRow = matrix[r + 1] || [];
      const nextNonBlanks = nextRow.filter((c) => c !== null && c !== undefined && String(c).trim() !== '');
      if (nextNonBlanks.length >= nonBlankCells.length * 0.7) {
        score += 25;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestIndex = r;
    }
  }

  return bestIndex;
}

export function formatHeaderName(rawName: string, casing: HeaderCasing, colIndex: number): string {
  let clean = String(rawName || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!clean || clean.startsWith('__EMPTY') || /^Column[_\s]?\d+$/i.test(clean)) {
    clean = `Column_${colIndex + 1}`;
  }

  // Remove trailing colons, semicolons, brackets if messy
  clean = clean.replace(/[:;]+$/, '').trim();

  switch (casing) {
    case 'clean_title':
      return clean
        .replace(/[_\-]+/g, ' ')
        .split(/\s+/)
        .map((w) => {
          if (w.toUpperCase() === 'ID' || w.toUpperCase() === 'SKU' || w.toUpperCase() === 'CRM') return w.toUpperCase();
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        })
        .join(' ');
    case 'snake_case':
      return clean
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
    case 'camelCase':
      const words = clean.replace(/[^\w\s-]/g, '').trim().split(/[\s_\-]+/);
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join('');
    case 'UPPERCASE':
      return clean
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s\-]+/g, '_')
        .toUpperCase();
    case 'kebab_case':
      return clean
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    case 'original':
    default:
      return clean.replace(/\s+/g, ' ');
  }
}

// ----------------------------------------------------
// String & Cell Sanitizers
// ----------------------------------------------------

export function cleanTextCell(val: any, config: CleaningRuleConfig): { value: any; changed: boolean } {
  if (val === null || val === undefined) {
    return { value: '', changed: false };
  }

  let original = String(val);
  let cleaned = original;

  if (config.stripControlChars) {
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  if (config.collapseInnerWhitespace) {
    cleaned = cleaned.replace(/[ \t\r\n]+/g, ' ');
  }

  if (config.trimWhitespace) {
    cleaned = cleaned.trim();
  }

  if (config.standardizeNulls) {
    const isNullToken = config.nullTokens.some((t) => t.toLowerCase() === cleaned.toLowerCase());
    if (isNullToken) {
      cleaned = config.nullReplacement;
    }
  }

  return { value: cleaned, changed: cleaned !== original };
}

// ----------------------------------------------------
// Normalizers: Dates, Phones, Emails, Currencies, Booleans
// ----------------------------------------------------

export function normalizeEmail(val: string): { value: string; changed: boolean } {
  const trimmed = val.trim();
  if (!trimmed) return { value: '', changed: false };
  // Check if string looks like email
  if (trimmed.includes('@') && trimmed.includes('.')) {
    const lower = trimmed.toLowerCase();
    return { value: lower, changed: lower !== val };
  }
  return { value: val, changed: false };
}

export function normalizePhone(val: string, targetFormat: CleaningRuleConfig['phoneFormatTarget']): { value: string; changed: boolean } {
  if (!val) return { value: '', changed: false };

  // Check if text has phone features
  const digitMatches = val.replace(/\D/g, '');
  if (digitMatches.length < 7 || digitMatches.length > 15) {
    return { value: val, changed: false };
  }

  // Format 10 digit (or 11 digit with leading 1) US/CAN style
  let digits = digitMatches;
  let countryCode = '';
  if (digits.length === 11 && digits.startsWith('1')) {
    countryCode = '1';
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const end = digits.slice(6, 10);

    let formatted = val;
    switch (targetFormat) {
      case 'US_STANDARD':
        formatted = countryCode ? `+1 (${area}) ${mid}-${end}` : `(${area}) ${mid}-${end}`;
        break;
      case 'E164':
        formatted = `+1${digits}`;
        break;
      case 'DOT_SEPARATED':
        formatted = `${area}.${mid}.${end}`;
        break;
      case 'DIGITS_ONLY':
        formatted = countryCode ? `1${digits}` : digits;
        break;
    }
    return { value: formatted, changed: formatted !== val };
  }

  return { value: val, changed: false };
}

export function normalizeDate(val: string | number, targetFormat: CleaningRuleConfig['dateFormatTarget']): { value: string; changed: boolean } {
  if (val === null || val === undefined || String(val).trim() === '') {
    return { value: '', changed: false };
  }

  const str = String(val).trim();

  // Excel serial date detection (e.g., 44927 is 2022-12-18)
  const numericVal = Number(str);
  if (!isNaN(numericVal) && numericVal >= 25000 && numericVal <= 65000 && !str.includes('-') && !str.includes('/') && !str.includes('.')) {
    try {
      const utcDays = Math.floor(numericVal - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (!isNaN(dateInfo.getTime())) {
        const formatted = formatDateTarget(dateInfo.getUTCFullYear(), dateInfo.getUTCMonth() + 1, dateInfo.getUTCDate(), targetFormat);
        return { value: formatted, changed: true };
      }
    } catch {
      // continue to standard parser
    }
  }

  // ISO format check: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})(?:T.*)?$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const formatted = formatDateTarget(y, m, d, targetFormat);
      return { value: formatted, changed: formatted !== str };
    }
  }

  // US format check: MM/DD/YYYY or MM-DD-YYYY
  const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    const p1 = parseInt(usMatch[1], 10);
    const p2 = parseInt(usMatch[2], 10);
    const y = parseInt(usMatch[3], 10);

    // If p1 > 12, it must be DD/MM/YYYY
    let m = p1;
    let d = p2;
    if (p1 > 12 && p2 <= 12) {
      d = p1;
      m = p2;
    }

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const formatted = formatDateTarget(y, m, d, targetFormat);
      return { value: formatted, changed: formatted !== str };
    }
  }

  // Text month format check: "Jan 15, 2023", "15 January 2023", "June 30, 2023"
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp) && /[a-zA-Z]{3,}/.test(str)) {
    const dObj = new Date(parsedTimestamp);
    if (!isNaN(dObj.getTime())) {
      const formatted = formatDateTarget(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate(), targetFormat);
      return { value: formatted, changed: formatted !== str };
    }
  }

  return { value: str, changed: false };
}

function formatDateTarget(year: number, month: number, day: number, target: CleaningRuleConfig['dateFormatTarget']): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const yyyy = String(year);

  switch (target) {
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'YYYY/MM/DD':
      return `${yyyy}/${mm}/${dd}`;
  }
}

export function normalizeNumberOrCurrency(val: any): { value: any; changed: boolean } {
  if (val === null || val === undefined) return { value: '', changed: false };
  const str = String(val).trim();
  if (!str) return { value: '', changed: false };

  // Accounting negative format: (450.00) or ($1,250.00)
  const parenMatch = str.match(/^\s*\(\s*[$€£¥R$CHF]*\s*([\d,]+\.?\d*)\s*\)\s*$/);
  if (parenMatch) {
    const cleanNum = parenMatch[1].replace(/,/g, '');
    const num = -parseFloat(cleanNum);
    return { value: isNaN(num) ? str : num, changed: true };
  }

  // Currency with symbol: $1,250.00, € 12.50, USD 450
  const currencyRegex = /^[$€£¥₹\s]*(?:USD|EUR|GBP|CAD|AUD|CHF|JPY|R\$)?\s*([\d,]+\.?\d*)\s*[$€£¥]*$/i;
  const match = str.match(currencyRegex);
  if (match && match[1] && /[$€£¥₹]|\b(USD|EUR|GBP|CAD|CHF)\b/i.test(str)) {
    const cleanNum = match[1].replace(/,/g, '');
    const num = parseFloat(cleanNum);
    if (!isNaN(num)) {
      return { value: num, changed: true };
    }
  }

  // Just commas in numbers: 1,234,567.89
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    const cleanNum = str.replace(/,/g, '');
    const num = parseFloat(cleanNum);
    if (!isNaN(num)) {
      return { value: num, changed: true };
    }
  }

  return { value: val, changed: false };
}

export function normalizeBoolean(val: any): { value: any; changed: boolean } {
  if (val === null || val === undefined) return { value: '', changed: false };
  const str = String(val).trim().toLowerCase();

  const truthy = ['true', 'yes', 'y', '1', 't', 'active'];
  const falsy = ['false', 'no', 'n', '0', 'f', 'inactive'];

  if (truthy.includes(str)) {
    return { value: 'TRUE', changed: str !== 'true' && str !== 'TRUE' };
  }
  if (falsy.includes(str)) {
    return { value: 'FALSE', changed: str !== 'false' && str !== 'FALSE' };
  }

  return { value: val, changed: false };
}

// ----------------------------------------------------
// Deduplication & Fuzzy Similarity
// ----------------------------------------------------

export function calculateLevenshteinSimilarity(s1: string, s2: string): number {
  const str1 = (s1 || '').trim().toLowerCase();
  const str2 = (s2 || '').trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0;

  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = dp[len1][len2];
  return 1 - distance / maxLen;
}

export function detectColumnType(values: any[]): ColumnType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNulls.length === 0) return 'text';

  let emailCount = 0;
  let phoneCount = 0;
  let dateCount = 0;
  let numberCount = 0;
  let booleanCount = 0;

  for (const v of nonNulls) {
    const s = String(v).trim();
    if (s.includes('@') && s.includes('.')) emailCount++;
    if (/^\+?[\d\s\-.()]{8,18}$/.test(s) && (s.match(/\d/g) || []).length >= 7) phoneCount++;
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s) || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(s)) dateCount++;
    if (!isNaN(Number(s)) || /^[$€£¥]/.test(s)) numberCount++;
    if (['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(s.toLowerCase())) booleanCount++;
  }

  const threshold = nonNulls.length * 0.6;
  if (emailCount >= threshold) return 'email';
  if (phoneCount >= threshold) return 'phone';
  if (dateCount >= threshold) return 'date';
  if (booleanCount >= threshold) return 'boolean';
  if (numberCount >= threshold) return 'number';

  return 'text';
}

// ----------------------------------------------------
// Quality Score Calculator
// ----------------------------------------------------

export function calculateQualityScore(rows: any[], headers: string[]): number {
  if (rows.length === 0 || headers.length === 0) return 0;

  let totalCells = rows.length * headers.length;
  let missingCount = 0;
  let whitespaceIssueCount = 0;
  let duplicateCount = 0;
  const seenRows = new Set<string>();

  for (const row of rows) {
    const serialized = headers.map((h) => String(row[h] || '').trim().toLowerCase()).join('||');
    if (seenRows.has(serialized)) {
      duplicateCount++;
    } else {
      seenRows.add(serialized);
    }

    for (const h of headers) {
      const val = row[h];
      const str = String(val ?? '');
      if (val === null || val === undefined || str.trim() === '' || ['n/a', 'null', '-', 'none'].includes(str.toLowerCase().trim())) {
        missingCount++;
      }
      if (str !== str.trim() || /\s{2,}/.test(str)) {
        whitespaceIssueCount++;
      }
    }
  }

  const missingPenalty = (missingCount / totalCells) * 35;
  const whitespacePenalty = (whitespaceIssueCount / totalCells) * 25;
  const duplicatePenalty = (duplicateCount / rows.length) * 40;

  const score = Math.max(5, Math.min(100, Math.round(100 - missingPenalty - whitespacePenalty - duplicatePenalty)));
  return score;
}

// ----------------------------------------------------
// Main Pipeline Execution
// ----------------------------------------------------

export function cleanAndRestructureDataset(
  rawMatrix: any[][],
  config: CleaningRuleConfig = DEFAULT_CLEANING_CONFIG
): CleanedDataset {
  if (!rawMatrix || rawMatrix.length === 0) {
    return {
      headers: [],
      rows: [],
      originalHeaders: [],
      originalRowCount: 0,
      originalColCount: 0,
      cleanedRowCount: 0,
      cleanedColCount: 0,
      cellChangeCount: 0,
      metrics: [],
      columnStats: [],
      fuzzyDuplicates: [],
      qualityScoreBefore: 0,
      qualityScoreAfter: 100,
      executedAt: new Date().toISOString()
    };
  }

  const metrics: TransformationMetric[] = [];
  let totalCellChanges = 0;

  // Step 1: Detect header row
  const headerRowIdx = config.autoDetectHeader ? detectHeaderRowIndex(rawMatrix) : config.skipRowsCount;
  const rawHeaderRow = rawMatrix[headerRowIdx] || [];
  const rawDataRows = rawMatrix.slice(headerRowIdx + 1);

  // Quality score before
  const initialHeaders = rawHeaderRow.map((c, i) => String(c || `Col_${i + 1}`).trim());
  const initialRowsMapped = rawDataRows.map((r) => {
    const obj: Record<string, any> = {};
    initialHeaders.forEach((h, i) => {
      obj[h] = r[i];
    });
    return obj;
  });
  const qualityScoreBefore = calculateQualityScore(initialRowsMapped, initialHeaders);

  // Step 2: Clean header names
  const seenHeaderCounts: Record<string, number> = {};
  const cleanHeaders: string[] = [];

  rawHeaderRow.forEach((h, colIdx) => {
    let name = formatHeaderName(h, config.headerCase, colIdx);
    if (seenHeaderCounts[name]) {
      seenHeaderCounts[name]++;
      name = `${name}_${seenHeaderCounts[name]}`;
    } else {
      seenHeaderCounts[name] = 1;
    }
    cleanHeaders.push(name);
  });

  // Track header metrics
  if (headerRowIdx > 0) {
    metrics.push({
      id: 'preamble_skipped',
      category: 'structure',
      label: 'Junk Header Rows Skipped',
      count: headerRowIdx,
      description: `Automatically removed ${headerRowIdx} non-data header/banner row(s) before actual column titles.`
    });
  }

  // Step 3: Remove empty rows
  let emptyRowsCount = 0;
  const filteredDataRows = rawDataRows.filter((r) => {
    if (!config.removeEmptyRows) return true;
    const isBlank = r.every((c) => c === null || c === undefined || String(c).trim() === '');
    if (isBlank) emptyRowsCount++;
    return !isBlank;
  });

  if (emptyRowsCount > 0) {
    metrics.push({
      id: 'empty_rows_removed',
      category: 'structure',
      label: 'Empty Rows Purged',
      count: emptyRowsCount,
      description: `Removed ${emptyRowsCount} blank rows with no data content.`
    });
  }

  // Step 4: Normalization (Whitespace, Casing, Formats)
  let whitespaceFixes = 0;
  let emailFixes = 0;
  let phoneFixes = 0;
  let dateFixes = 0;
  let numberFixes = 0;
  let booleanFixes = 0;
  let nullFixes = 0;

  let processedRows: Record<string, any>[] = filteredDataRows.map((rowArr) => {
    const rowObj: Record<string, any> = {};

    cleanHeaders.forEach((header, colIdx) => {
      const rawVal = rowArr[colIdx];
      let currentVal = rawVal;

      // Whitespace and text sanitization
      const textCleanResult = cleanTextCell(currentVal, config);
      if (textCleanResult.changed) {
        whitespaceFixes++;
        totalCellChanges++;
        currentVal = textCleanResult.value;
      }

      // Check if standard null token
      if (config.standardizeNulls && config.nullTokens.some((t) => t.toLowerCase() === String(rawVal).trim().toLowerCase())) {
        nullFixes++;
      }

      const strVal = String(currentVal);

      // Email normalization
      if (config.normalizeEmails && strVal.includes('@')) {
        const emailResult = normalizeEmail(strVal);
        if (emailResult.changed) {
          emailFixes++;
          totalCellChanges++;
          currentVal = emailResult.value;
        }
      }

      // Phone normalization
      if (config.normalizePhones && (header.toLowerCase().includes('phone') || header.toLowerCase().includes('contact') || /^\+?[\d\s\-.()]{8,18}$/.test(strVal))) {
        const phoneResult = normalizePhone(strVal, config.phoneFormatTarget);
        if (phoneResult.changed) {
          phoneFixes++;
          totalCellChanges++;
          currentVal = phoneResult.value;
        }
      }

      // Date normalization
      if (
        config.normalizeDates &&
        (header.toLowerCase().includes('date') ||
          header.toLowerCase().includes('time') ||
          header.toLowerCase().includes('dob') ||
          /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(strVal) ||
          /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(strVal) ||
          /[a-zA-Z]{3,}\s+\d{1,2},\s+\d{4}/.test(strVal))
      ) {
        const dateResult = normalizeDate(currentVal, config.dateFormatTarget);
        if (dateResult.changed) {
          dateFixes++;
          totalCellChanges++;
          currentVal = dateResult.value;
        }
      }

      // Number/Currency normalization
      if (
        config.normalizeNumbers &&
        (header.toLowerCase().includes('amount') ||
          header.toLowerCase().includes('spend') ||
          header.toLowerCase().includes('price') ||
          header.toLowerCase().includes('cost') ||
          header.toLowerCase().includes('qty') ||
          header.toLowerCase().includes('total') ||
          header.toLowerCase().includes('gross') ||
          /[$€£¥₹]/.test(strVal) ||
          /^\s*\(\s*[\d,.]+\s*\)\s*$/.test(strVal))
      ) {
        const numResult = normalizeNumberOrCurrency(currentVal);
        if (numResult.changed) {
          numberFixes++;
          totalCellChanges++;
          currentVal = numResult.value;
        }
      }

      // Boolean normalization
      if (
        config.normalizeBooleans &&
        (header.toLowerCase().includes('is_') ||
          header.toLowerCase().includes('active') ||
          header.toLowerCase().includes('status') ||
          header.toLowerCase().includes('discontinued') ||
          header.toLowerCase().includes('paid') ||
          ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'].includes(strVal.toLowerCase()))
      ) {
        const boolResult = normalizeBoolean(currentVal);
        if (boolResult.changed) {
          booleanFixes++;
          totalCellChanges++;
          currentVal = boolResult.value;
        }
      }

      rowObj[header] = currentVal;
    });

    return rowObj;
  });

  if (whitespaceFixes > 0) {
    metrics.push({
      id: 'whitespace_cleaned',
      category: 'whitespace',
      label: 'Whitespace & Bad Chars Cleared',
      count: whitespaceFixes,
      description: `Trimmed extra spaces, resolved non-breaking & control characters across ${whitespaceFixes} cells.`
    });
  }

  if (emailFixes > 0) {
    metrics.push({
      id: 'emails_normalized',
      category: 'format',
      label: 'Emails Standardized',
      count: emailFixes,
      description: `Lowercased and trimmed ${emailFixes} email addresses.`
    });
  }

  if (phoneFixes > 0) {
    metrics.push({
      id: 'phones_normalized',
      category: 'format',
      label: 'Phone Numbers Unified',
      count: phoneFixes,
      description: `Formatted ${phoneFixes} phone numbers to ${config.phoneFormatTarget}.`
    });
  }

  if (dateFixes > 0) {
    metrics.push({
      id: 'dates_normalized',
      category: 'format',
      label: 'Dates ISO-Standardized',
      count: dateFixes,
      description: `Standardized ${dateFixes} dates to ${config.dateFormatTarget}.`
    });
  }

  if (numberFixes > 0) {
    metrics.push({
      id: 'numbers_normalized',
      category: 'format',
      label: 'Currencies & Numbers Cleaned',
      count: numberFixes,
      description: `Sanitized ${numberFixes} numbers, removing stray currency symbols & accounting brackets.`
    });
  }

  if (booleanFixes > 0) {
    metrics.push({
      id: 'booleans_normalized',
      category: 'format',
      label: 'Booleans Standardized',
      count: booleanFixes,
      description: `Converted ${booleanFixes} inconsistent boolean/flag entries to standard TRUE / FALSE.`
    });
  }

  // Step 5: Deduplication
  let duplicateRowsCount = 0;
  if (config.deduplicate) {
    const keysToCheck = config.deduplicateKeys.length > 0 ? config.deduplicateKeys : cleanHeaders;
    const seenMap = new Map<string, number>();
    const deduplicatedRows: Record<string, any>[] = [];

    // Reverse if keeping last
    const rowsIter = config.deduplicateKeep === 'last' ? [...processedRows].reverse() : processedRows;

    for (const r of rowsIter) {
      let keyStr = keysToCheck
        .map((k) => {
          const v = String(r[k] ?? '');
          return config.deduplicateMode === 'case_insensitive' ? v.trim().toLowerCase() : v.trim();
        })
        .join('###');

      if (seenMap.has(keyStr)) {
        duplicateRowsCount++;
      } else {
        seenMap.set(keyStr, 1);
        deduplicatedRows.push(r);
      }
    }

    processedRows = config.deduplicateKeep === 'last' ? deduplicatedRows.reverse() : deduplicatedRows;

    if (duplicateRowsCount > 0) {
      metrics.push({
        id: 'duplicates_purged',
        category: 'dedup',
        label: 'Duplicate Rows Purged',
        count: duplicateRowsCount,
        description: `Eliminated ${duplicateRowsCount} duplicate records using ${config.deduplicateMode} comparison.`
      });
    }
  }

  // Step 6: Fuzzy Duplicates Detection (Side-by-side matches)
  const fuzzyDuplicates: FuzzyDuplicatePair[] = [];
  if (config.fuzzyDeduplicate && processedRows.length > 1) {
    // Determine key column: either user chosen, or first email / name / id column
    let fuzzyKeyCol = config.fuzzyKey;
    if (!fuzzyKeyCol || !cleanHeaders.includes(fuzzyKeyCol)) {
      fuzzyKeyCol = cleanHeaders.find((h) => /name|email|title|customer|client|company/i.test(h)) || cleanHeaders[0];
    }

    if (fuzzyKeyCol) {
      const sampleLimit = Math.min(processedRows.length, 120); // compare up to 120 rows for sub-second performance
      for (let i = 0; i < sampleLimit; i++) {
        const valA = String(processedRows[i][fuzzyKeyCol] || '').trim();
        if (valA.length < 3) continue;

        for (let j = i + 1; j < sampleLimit; j++) {
          const valB = String(processedRows[j][fuzzyKeyCol] || '').trim();
          if (valB.length < 3) continue;

          // Don't flag exact matches (already handled by deduplicator)
          if (valA.toLowerCase() === valB.toLowerCase()) continue;

          const similarity = calculateLevenshteinSimilarity(valA, valB);
          if (similarity >= config.fuzzyThreshold) {
            fuzzyDuplicates.push({
              id: `fuzzy_${i}_${j}`,
              indexA: i,
              indexB: j,
              similarity: Math.round(similarity * 100) / 100,
              keyValA: valA,
              keyValB: valB,
              rowA: processedRows[i],
              rowB: processedRows[j]
            });
          }
        }
      }
    }
  }

  // Step 7: Apply Restructure Actions
  let currentHeaders = [...cleanHeaders];
  for (const action of config.restructureRules) {
    if (action.type === 'split_column') {
      const { sourceCol, delimiter, newCols } = action;
      if (currentHeaders.includes(sourceCol) && newCols.length > 0) {
        // Add new columns right after source column
        const sourceIdx = currentHeaders.indexOf(sourceCol);
        currentHeaders.splice(sourceIdx + 1, 0, ...newCols);

        processedRows.forEach((row) => {
          const sourceVal = String(row[sourceCol] || '');
          const parts = sourceVal.split(delimiter);
          newCols.forEach((colName, idx) => {
            row[colName] = (parts[idx] || '').trim();
          });
        });

        metrics.push({
          id: `split_${sourceCol}`,
          category: 'restructure',
          label: `Split Column '${sourceCol}'`,
          count: processedRows.length,
          description: `Split '${sourceCol}' into [${newCols.join(', ')}] using delimiter '${delimiter}'.`
        });
      }
    } else if (action.type === 'merge_columns') {
      const { sourceCols, delimiter, targetCol } = action;
      if (!currentHeaders.includes(targetCol)) {
        currentHeaders.push(targetCol);
      }
      processedRows.forEach((row) => {
        row[targetCol] = sourceCols
          .map((col) => String(row[col] || '').trim())
          .filter(Boolean)
          .join(delimiter);
      });
      metrics.push({
        id: `merge_${targetCol}`,
        category: 'restructure',
        label: `Merged into '${targetCol}'`,
        count: processedRows.length,
        description: `Merged [${sourceCols.join(', ')}] into '${targetCol}'.`
      });
    } else if (action.type === 'rename_column') {
      const { oldCol, newCol } = action;
      const idx = currentHeaders.indexOf(oldCol);
      if (idx !== -1 && newCol) {
        currentHeaders[idx] = newCol;
        processedRows.forEach((row) => {
          row[newCol] = row[oldCol];
          delete row[oldCol];
        });
      }
    } else if (action.type === 'drop_column') {
      const { col } = action;
      currentHeaders = currentHeaders.filter((h) => h !== col);
      processedRows.forEach((row) => {
        delete row[col];
      });
    } else if (action.type === 'change_case') {
      const { col, targetCase } = action;
      if (currentHeaders.includes(col)) {
        processedRows.forEach((row) => {
          const str = String(row[col] || '');
          if (targetCase === 'title') {
            row[col] = str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          } else if (targetCase === 'upper') {
            row[col] = str.toUpperCase();
          } else if (targetCase === 'lower') {
            row[col] = str.toLowerCase();
          } else if (targetCase === 'sentence') {
            row[col] = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
          }
        });
      }
    } else if (action.type === 'find_replace') {
      const { col, findText, replaceText, regex } = action;
      if (currentHeaders.includes(col)) {
        processedRows.forEach((row) => {
          const str = String(row[col] || '');
          if (regex) {
            try {
              const reg = new RegExp(findText, 'g');
              row[col] = str.replace(reg, replaceText);
            } catch {
              // fallback
              row[col] = str.replaceAll(findText, replaceText);
            }
          } else {
            row[col] = str.replaceAll(findText, replaceText);
          }
        });
      }
    }
  }

  // Step 8: Remove empty columns if requested
  let emptyColsCount = 0;
  if (config.removeEmptyCols) {
    const finalHeaders: string[] = [];
    currentHeaders.forEach((h) => {
      const hasAnyValue = processedRows.some((r) => r[h] !== null && r[h] !== undefined && String(r[h]).trim() !== '');
      if (hasAnyValue) {
        finalHeaders.push(h);
      } else {
        emptyColsCount++;
        processedRows.forEach((r) => delete r[h]);
      }
    });
    currentHeaders = finalHeaders;

    if (emptyColsCount > 0) {
      metrics.push({
        id: 'empty_cols_removed',
        category: 'structure',
        label: 'Empty Columns Removed',
        count: emptyColsCount,
        description: `Purged ${emptyColsCount} columns that had 100% empty cells.`
      });
    }
  }

  // Calculate Column Stats
  const columnStats: ColumnStat[] = currentHeaders.map((col) => {
    const values = processedRows.map((r) => r[col]);
    const detectedType = detectColumnType(values);
    const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    const distinctSet = new Set(nonNulls.map((v) => String(v).trim()));
    const samples = nonNulls.slice(0, 3);

    return {
      name: col,
      detectedType,
      nonNullCount: nonNulls.length,
      nullCount: processedRows.length - nonNulls.length,
      distinctCount: distinctSet.size,
      sampleValues: samples
    };
  });

  const qualityScoreAfter = calculateQualityScore(processedRows, currentHeaders);

  return {
    headers: currentHeaders,
    rows: processedRows,
    originalHeaders: rawHeaderRow.map((h, i) => String(h || `Column ${i + 1}`)),
    originalRowCount: rawDataRows.length,
    originalColCount: rawHeaderRow.length,
    cleanedRowCount: processedRows.length,
    cleanedColCount: currentHeaders.length,
    cellChangeCount: totalCellChanges,
    metrics,
    columnStats,
    fuzzyDuplicates,
    qualityScoreBefore,
    qualityScoreAfter,
    executedAt: new Date().toISOString()
  };
}
