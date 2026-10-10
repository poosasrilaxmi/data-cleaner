import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { RawFileDataset } from '../types/dataCleaner';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (name: 'crm' | 'inventory' | 'financial') => void;
  rawDataset: RawFileDataset | null;
  onSheetChange: (sheetName: string) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  onSampleSelected,
  rawDataset,
  onSheetChange,
  isLoading
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Drop Area (7 cols) */}
        <div className="lg:col-span-7">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-[#7C3AED] bg-purple-50/70 scale-[1.01]'
                : 'border-purple-200/80 hover:border-[#7C3AED] bg-purple-50/20 hover:bg-purple-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 text-[#7C3AED] flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isLoading ? 'Parsing and Analyzing...' : 'Upload Messy Excel or CSV File'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 max-w-md mx-auto">
              Drag &amp; drop your spreadsheet here or click to browse. Supports <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong>, and <strong className="text-slate-700">.csv</strong>. 100% processed securely in your browser.
            </p>

            <div className="inline-flex items-center space-x-2 text-[11px] font-semibold text-[#7C3AED] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-detects headers, trims spaces, unifies formats &amp; drops duplicates</span>
            </div>
          </div>

          {/* Multi-sheet selector if Excel file loaded */}
          {rawDataset && rawDataset.sheets && rawDataset.sheets.length > 1 && (
            <div className="mt-3 flex items-center space-x-3 bg-purple-50/60 p-2.5 rounded-lg border border-purple-200">
              <Layers className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-semibold text-slate-700">Excel Worksheet:</span>
              <div className="flex flex-wrap gap-1.5">
                {rawDataset.sheets.map((sheet) => (
                  <button
                    key={sheet}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSheetChange(sheet);
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                      rawDataset.activeSheet === sheet
                        ? 'bg-[#7C3AED] text-white'
                        : 'bg-white text-slate-700 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right / Try Sample Datasets (5 cols) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or try instant messy samples</span>
            </span>
            <span className="text-[11px] text-purple-600 font-medium">1-click demo</span>
          </div>

          <div className="space-y-2.5">
            {/* Sample 1 */}
            <div
              onClick={() => onSampleSelected('crm')}
              className="group p-3 rounded-lg border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                    Messy Customer CRM &amp; Leads
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-9">
                Junk banner rows, erratic phone formats, casing chaos, duplicate leads, negative parentheses.
              </p>
            </div>

            {/* Sample 2 */}
            <div
              onClick={() => onSampleSelected('inventory')}
              className="group p-3 rounded-lg border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                    Messy E-Commerce Inventory
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-9">
                SKU duplicates, mixed category casing, blank prices as &apos;N/A&apos; / &apos;-&apos;, currency symbols in cost.
              </p>
            </div>

            {/* Sample 3 */}
            <div
              onClick={() => onSampleSelected('financial')}
              className="group p-3 rounded-lg border border-purple-100 hover:border-[#7C3AED] hover:bg-purple-50/40 cursor-pointer transition text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition">
                    Global Invoices &amp; Currencies
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-9">
                Multi-currency symbols, EU date slashes vs US dates, trailing whitespace, empty lines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
