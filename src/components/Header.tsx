import React from 'react';
import { Sparkles, Download, FileSpreadsheet, RefreshCw, Upload, CheckCircle2 } from 'lucide-react';
import { CleanedDataset, RawFileDataset } from '../types/dataCleaner';

interface HeaderProps {
  rawDataset: RawFileDataset | null;
  cleanedDataset: CleanedDataset | null;
  onOpenUpload: () => void;
  onExportClick: () => void;
  onLoadSample: (name: 'crm' | 'inventory' | 'financial') => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  rawDataset,
  cleanedDataset,
  onOpenUpload,
  onExportClick,
  onLoadSample,
  isProcessing
}) => {
  return (
    <header className="bg-[#26133B] text-white border-b border-[#3D1F5E] shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#6B21A8] flex items-center justify-center shadow-inner border border-purple-400/40">
              <FileSpreadsheet className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  Data<span className="text-purple-300">Clean</span>
                </span>
              </div>
              <p className="text-xs text-purple-200/80 hidden sm:block">
                Clean · Normalize · Deduplicate · Restructure Excel &amp; CSV
              </p>
            </div>
          </div>

          {/* Center: File Status if loaded */}
          {rawDataset && (
            <div className="hidden lg:flex items-center space-x-3 bg-[#341852] px-3.5 py-1.5 rounded-lg border border-[#4E247A] text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-purple-100 font-medium truncate max-w-[140px]">{rawDataset.fileName}</span>
              </div>
              <span className="text-purple-300/40">|</span>
              <span className="text-purple-200/80">
                {rawDataset.rawMatrix.length} raw rows
              </span>
              <span className="text-purple-300/40">→</span>
              <span className="text-emerald-300 font-semibold">
                {cleanedDataset?.cleanedRowCount ?? 0} cleaned rows
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Sample Selector */}
            <div className="relative group hidden md:block">
              <button
                type="button"
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-purple-100 bg-[#3B1C5D] hover:bg-[#4E247A] border border-purple-700/60 px-3 py-2 rounded-md transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Load Sample</span>
              </button>
              <div className="absolute right-0 mt-1 w-60 bg-[#26133B] border border-[#4E247A] rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-purple-300 uppercase tracking-wider border-b border-purple-900/60">
                  Pre-loaded Messy Datasets
                </div>
                <button
                  type="button"
                  onClick={() => onLoadSample('crm')}
                  className="w-full text-left px-3 py-2 text-xs text-purple-100 hover:bg-[#3D1F5E] hover:text-white transition flex items-center justify-between"
                >
                  <span>Messy Customer CRM</span>
                  <span className="text-[10px] text-purple-300">Phones, Dates, Dupes</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('inventory')}
                  className="w-full text-left px-3 py-2 text-xs text-purple-100 hover:bg-[#3D1F5E] hover:text-white transition flex items-center justify-between"
                >
                  <span>Warehouse Inventory</span>
                  <span className="text-[10px] text-purple-300">SKUs, Prices, Nulls</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('financial')}
                  className="w-full text-left px-3 py-2 text-xs text-purple-100 hover:bg-[#3D1F5E] hover:text-white transition flex items-center justify-between"
                >
                  <span>Global Invoices</span>
                  <span className="text-[10px] text-purple-300">Currencies, Brackets</span>
                </button>
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] border border-purple-400/40 px-3.5 py-2 rounded-md shadow transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              disabled={!cleanedDataset || cleanedDataset.rows.length === 0 || isProcessing}
              onClick={onExportClick}
              className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-md shadow transition ${
                cleanedDataset && cleanedDataset.rows.length > 0 && !isProcessing
                  ? 'bg-[#9333EA] hover:bg-[#8B5CF6] text-white border border-purple-400 cursor-pointer'
                  : 'bg-purple-950/60 text-purple-400/50 border border-purple-900/50 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Clean Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
