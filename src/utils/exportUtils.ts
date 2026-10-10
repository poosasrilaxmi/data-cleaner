/**
 * Export and File Generation Utilities
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { CleanedDataset, CleaningRuleConfig } from '../types/dataCleaner';

export function exportToExcel(dataset: CleanedDataset, filename: string = 'cleaned_data.xlsx'): void {
  // Convert rows array of objects to sheet format
  const worksheet = XLSX.utils.json_to_sheet(dataset.rows, {
    header: dataset.headers
  });

  // Calculate dynamic column widths based on maximum content length
  const colWidths = dataset.headers.map((header) => {
    let maxLen = header.length;
    // Check first 100 rows for length
    const sampleLimit = Math.min(dataset.rows.length, 100);
    for (let i = 0; i < sampleLimit; i++) {
      const val = dataset.rows[i][header];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data');

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

export function exportToCSV(dataset: CleanedDataset, filename: string = 'cleaned_data.csv'): void {
  const csvContent = Papa.unparse({
    fields: dataset.headers,
    data: dataset.rows
  });

  // Prepend UTF-8 BOM for flawless Excel encoding support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(dataset: CleanedDataset, filename: string = 'cleaned_data.json'): void {
  const jsonStr = JSON.stringify(dataset.rows, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAuditRecipe(
  config: CleaningRuleConfig,
  dataset: CleanedDataset,
  filename: string = 'cleaning_audit_report.json'
): void {
  const auditReport = {
    generatedAt: new Date().toISOString(),
    metrics: {
      originalRows: dataset.originalRowCount,
      originalCols: dataset.originalColCount,
      cleanedRows: dataset.cleanedRowCount,
      cleanedCols: dataset.cleanedColCount,
      qualityScoreBefore: dataset.qualityScoreBefore,
      qualityScoreAfter: dataset.qualityScoreAfter,
      cellTransformations: dataset.cellChangeCount
    },
    transformationSummary: dataset.metrics,
    pipelineConfig: config
  };

  const jsonStr = JSON.stringify(auditReport, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboardTSV(dataset: CleanedDataset): Promise<boolean> {
  try {
    const headerRow = dataset.headers.join('\t');
    const dataRows = dataset.rows.map((row) => {
      return dataset.headers.map((h) => String(row[h] ?? '').replace(/\t/g, ' ')).join('\t');
    });
    const tsv = [headerRow, ...dataRows].join('\n');
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}
