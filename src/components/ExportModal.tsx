import React, { useState } from 'react';
import { CleanedDataset, CleaningRuleConfig } from '../types/dataCleaner';
import {
  exportToExcel,
  exportToCSV,
  exportToJSON,
  exportAuditRecipe,
  copyToClipboardTSV
} from '../utils/exportUtils';
import {
  X,
  FileSpreadsheet,
  FileText,
  Code2,
  Copy,
  Check,
  FileCheck,
  Download
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: CleanedDataset;
  config: CleaningRuleConfig;
  originalFileName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dataset,
  config,
  originalFileName
}) => {
  const defaultBaseName = originalFileName.replace(/\.[^/.]+$/, '') + '_cleaned';
  const [fileName, setFileName] = useState(defaultBaseName);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboardTSV(dataset);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-purple-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Lavender Modal Header */}
        <div className="bg-[#26133B] text-white p-5 flex items-center justify-between border-b border-[#3D1F5E]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6B21A8] flex items-center justify-center border border-purple-400/40">
              <Download className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Export Cleaned Dataset</h3>
              <p className="text-xs text-purple-200/80">
                {dataset.cleanedRowCount} records · {dataset.cleanedColCount} columns · Quality: {dataset.qualityScoreAfter}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-purple-300 hover:text-white hover:bg-[#3D1F5E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* File Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target File Base Name:
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white"
            />
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Excel */}
            <div
              onClick={() => {
                exportToExcel(dataset, `${fileName || 'cleaned'}.xlsx`);
                onClose();
              }}
              className="group p-4 rounded-xl border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                  Microsoft Excel (.xlsx)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formatted spreadsheet with dynamic column auto-widths.
                </p>
              </div>
            </div>

            {/* CSV */}
            <div
              onClick={() => {
                exportToCSV(dataset, `${fileName || 'cleaned'}.csv`);
                onClose();
              }}
              className="group p-4 rounded-xl border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                  Standard CSV (.csv)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  UTF-8 BOM encoded for direct compatibility with any tool.
                </p>
              </div>
            </div>

            {/* JSON */}
            <div
              onClick={() => {
                exportToJSON(dataset, `${fileName || 'cleaned'}.json`);
                onClose();
              }}
              className="group p-4 rounded-xl border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-200 group-hover:scale-105 transition">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                  JSON Array (.json)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Structured records array for API and developer pipelines.
                </p>
              </div>
            </div>

            {/* Copy Clipboard */}
            <div
              onClick={handleCopy}
              className="group p-4 rounded-xl border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition flex items-start space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition">
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard (TSV)'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ready to paste directly into Google Sheets or Excel.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Report Recipe */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center space-x-1.5">
              <FileCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Need audit compliance?</span>
            </span>
            <button
              type="button"
              onClick={() => {
                exportAuditRecipe(config, dataset, `${fileName || 'cleaned'}_audit_report.json`);
                onClose();
              }}
              className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-bold underline transition"
            >
              Download Transformation Audit Recipe (.json)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
