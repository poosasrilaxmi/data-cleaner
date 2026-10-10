/**
 * File Parser for Excel (.xlsx, .xls) and CSV / TSV files
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { RawFileDataset } from '../types/dataCleaner';
import { detectHeaderRowIndex } from './cleaningEngine';

export async function parseUploadedFile(file: File): Promise<RawFileDataset> {
  const fileName = file.name;
  const fileSize = file.size;
  const lowerName = fileName.toLowerCase();
  const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames || ['Sheet1'];
    const sheetDataMap: Record<string, any[][]> = {};

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: ''
      });
      sheetDataMap[sheetName] = matrix;
    });

    const activeSheet = sheetNames[0];
    const rawMatrix = sheetDataMap[activeSheet] || [];
    const detectedHeaderRowIndex = detectHeaderRowIndex(rawMatrix);

    return {
      fileName,
      fileSize,
      fileType: lowerName.endsWith('.xlsx') ? 'xlsx' : 'xls',
      sheets: sheetNames,
      activeSheet,
      sheetDataMap,
      detectedHeaderRowIndex,
      rawMatrix
    };
  } else {
    // CSV or Delimited text
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: false,
        complete: (results) => {
          const rawMatrix: any[][] = results.data as any[][];
          const detectedHeaderRowIndex = detectHeaderRowIndex(rawMatrix);

          resolve({
            fileName,
            fileSize,
            fileType: 'csv',
            sheets: ['Default'],
            activeSheet: 'Default',
            sheetDataMap: { Default: rawMatrix },
            detectedHeaderRowIndex,
            rawMatrix
          });
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }
}

export function loadSampleDataset(name: 'crm' | 'inventory' | 'financial', sampleMatrix: any[][]): RawFileDataset {
  const detectedHeaderRowIndex = detectHeaderRowIndex(sampleMatrix);
  const titles = {
    crm: 'messy_customer_leads.xlsx',
    inventory: 'messy_warehouse_inventory.csv',
    financial: 'messy_global_invoices.xlsx'
  };

  return {
    fileName: titles[name],
    fileSize: 42 * 1024,
    fileType: titles[name].endsWith('.xlsx') ? 'xlsx' : 'csv',
    sheets: ['Sheet1'],
    activeSheet: 'Sheet1',
    sheetDataMap: { Sheet1: sampleMatrix },
    detectedHeaderRowIndex,
    rawMatrix: sampleMatrix
  };
}
