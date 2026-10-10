/**
 * Data Cleaner Types & Interfaces
 */

export type HeaderCasing = 'original' | 'clean_title' | 'snake_case' | 'camelCase' | 'UPPERCASE' | 'kebab_case';
export type DateFormatTarget = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY/MM/DD';
export type PhoneFormatTarget = 'US_STANDARD' | 'E164' | 'DIGITS_ONLY' | 'DOT_SEPARATED';
export type DeduplicateMode = 'exact' | 'case_insensitive' | 'by_columns';
export type DeduplicateKeep = 'first' | 'last';
export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'email' | 'phone' | 'boolean' | 'mixed';

export interface CleaningRuleConfig {
  // Structure & Headers
  autoDetectHeader: boolean;
  skipRowsCount: number; // manual override if autoDetectHeader is false
  headerCase: HeaderCasing;
  removeEmptyRows: boolean;
  removeEmptyCols: boolean;
  
  // Whitespace & Sanitization
  trimWhitespace: boolean;
  collapseInnerWhitespace: boolean;
  stripControlChars: boolean;
  
  // Normalization
  normalizeEmails: boolean;
  normalizePhones: boolean;
  phoneFormatTarget: PhoneFormatTarget;
  normalizeDates: boolean;
  dateFormatTarget: DateFormatTarget;
  normalizeNumbers: boolean;
  normalizeBooleans: boolean;
  standardizeNulls: boolean;
  nullTokens: string[]; // e.g. ["N/A", "NA", "-", "null", "nil", "none", "?", "undefined"]
  nullReplacement: string; // usually ""
  
  // Deduplication
  deduplicate: boolean;
  deduplicateMode: DeduplicateMode;
  deduplicateKeys: string[]; // specific columns to check for duplicates
  deduplicateKeep: DeduplicateKeep;
  fuzzyDeduplicate: boolean;
  fuzzyThreshold: number; // 0.70 to 0.99
  fuzzyKey: string; // column to run fuzzy check on
  
  // Restructuring
  restructureRules: RestructureAction[];
}

export type RestructureAction = 
  | { id: string; type: 'split_column'; sourceCol: string; delimiter: string; newCols: string[] }
  | { id: string; type: 'merge_columns'; sourceCols: string[]; delimiter: string; targetCol: string }
  | { id: string; type: 'rename_column'; oldCol: string; newCol: string }
  | { id: string; type: 'drop_column'; col: string }
  | { id: string; type: 'change_case'; col: string; targetCase: 'title' | 'upper' | 'lower' | 'sentence' }
  | { id: string; type: 'filter_empty'; col: string }
  | { id: string; type: 'find_replace'; col: string; findText: string; replaceText: string; regex?: boolean };

export interface TransformationMetric {
  id: string;
  category: 'structure' | 'whitespace' | 'format' | 'dedup' | 'restructure';
  label: string;
  count: number;
  description: string;
}

export interface ColumnStat {
  name: string;
  detectedType: ColumnType;
  nonNullCount: number;
  nullCount: number;
  distinctCount: number;
  sampleValues: any[];
}

export interface FuzzyDuplicatePair {
  id: string;
  indexA: number;
  indexB: number;
  similarity: number;
  keyValA: string;
  keyValB: string;
  rowA: Record<string, any>;
  rowB: Record<string, any>;
  resolved?: 'kept_a' | 'kept_b' | 'kept_both' | 'merged';
}

export interface RawFileDataset {
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'xlsx' | 'xls';
  sheets: string[];
  activeSheet: string;
  sheetDataMap: Record<string, any[][]>; // sheetName -> raw 2D array
  detectedHeaderRowIndex: number;
  rawMatrix: any[][]; // active sheet raw 2D array
}

export interface CleanedDataset {
  headers: string[];
  rows: Record<string, any>[];
  originalHeaders: string[];
  originalRowCount: number;
  originalColCount: number;
  cleanedRowCount: number;
  cleanedColCount: number;
  cellChangeCount: number;
  metrics: TransformationMetric[];
  columnStats: ColumnStat[];
  fuzzyDuplicates: FuzzyDuplicatePair[];
  qualityScoreBefore: number;
  qualityScoreAfter: number;
  executedAt: string;
}
