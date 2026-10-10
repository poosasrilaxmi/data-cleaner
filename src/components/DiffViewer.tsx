import React, { useState } from 'react';
import { CleanedDataset, RawFileDataset } from '../types/dataCleaner';
import { CheckCircle2, Wand2 } from 'lucide-react';

interface DiffViewerProps {
  rawDataset: RawFileDataset;
  cleanedDataset: CleanedDataset;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ rawDataset, cleanedDataset }) => {
  const [viewMode, setViewMode] = useState<'side_by_side' | 'raw_only' | 'clean_only'>('side_by_side');
  const [maxPreviewRows] = useState(15);

  const rawRowsSlice = rawDataset.rawMatrix.slice(0, maxPreviewRows);
  const cleanRowsSlice = cleanedDataset.rows.slice(0, maxPreviewRows);

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header & Mode Switcher */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-[#7C3AED]" />
            <span>Before vs. After Cleaning Audit</span>
          </h3>
          <p className="text-xs text-slate-500">
            Compare original unformatted spreadsheet data against automated cleaned results.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-purple-200 bg-white p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('side_by_side')}
            className={`px-3 py-1.5 rounded-md transition ${
              viewMode === 'side_by_side'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw_only')}
            className={`px-3 py-1.5 rounded-md transition ${
              viewMode === 'raw_only'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original Messy Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('clean_only')}
            className={`px-3 py-1.5 rounded-md transition ${
              viewMode === 'clean_only'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clean Normalized Only
          </button>
        </div>
      </div>

      {/* Transformations Summary Cards */}
      <div className="p-4 bg-purple-50/40 border-b border-purple-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cleanedDataset.metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg p-2.5 border border-purple-100 shadow-xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate" title={metric.label}>
              {metric.label}
            </div>
            <div className="text-lg font-extrabold text-[#7C3AED] mt-0.5">
              {metric.count}
            </div>
            <p className="text-[10px] text-slate-500 truncate" title={metric.description}>
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Data Comparison Grids */}
      <div className="p-4">
        {viewMode === 'side_by_side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Raw Messy Left Panel */}
            <div className="border border-rose-200/80 rounded-lg overflow-hidden bg-white">
              <div className="bg-rose-50 px-3 py-2 border-b border-rose-200 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Original Raw Data ({rawDataset.rawMatrix.length} rows)</span>
                </span>
                <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-mono">
                  Header detected at row #{rawDataset.detectedHeaderRowIndex + 1}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <tbody className="divide-y divide-rose-100">
                    {rawRowsSlice.map((row, rIdx) => {
                      const isHeader = rIdx === rawDataset.detectedHeaderRowIndex;
                      const isJunkPreHeader = rIdx < rawDataset.detectedHeaderRowIndex;
                      const isBlank = row.every((c) => c === null || c === undefined || String(c).trim() === '');

                      return (
                        <tr
                          key={rIdx}
                          className={`${
                            isHeader
                              ? 'bg-rose-100/70 font-bold text-rose-900'
                              : isJunkPreHeader
                              ? 'bg-rose-50/50 text-rose-400 italic line-through'
                              : isBlank
                              ? 'bg-amber-50/50 text-amber-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-2 w-8 text-center text-slate-400 select-none bg-rose-50/30">
                            {rIdx + 1}
                          </td>
                          {row.slice(0, 6).map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="p-2 border-r border-rose-50 whitespace-nowrap max-w-[140px] truncate">
                              {cell === null || cell === undefined || String(cell).trim() === '' ? (
                                <span className="text-slate-300 italic">Ø</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cleaned Right Panel */}
            <div className="border border-purple-200/80 rounded-lg overflow-hidden bg-white">
              <div className="bg-purple-50 px-3 py-2 border-b border-purple-200 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Cleaned &amp; Normalized ({cleanedDataset.cleanedRowCount} rows)</span>
                </span>
                <span className="text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded font-mono">
                  {cleanedDataset.cellChangeCount} cell fixes applied
                </span>
              </div>
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-[#26133B] text-white">
                    <tr>
                      <th className="p-2 w-8 text-center text-purple-300">#</th>
                      {cleanedDataset.headers.slice(0, 6).map((h) => (
                        <th key={h} className="p-2 font-semibold whitespace-nowrap text-purple-100">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {cleanRowsSlice.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-purple-50/40">
                        <td className="p-2 w-8 text-center text-purple-400 font-mono select-none bg-purple-50/30">
                          {rIdx + 1}
                        </td>
                        {cleanedDataset.headers.slice(0, 6).map((h) => {
                          const val = row[h];
                          return (
                            <td key={h} className="p-2 border-r border-purple-50 whitespace-nowrap max-w-[140px] truncate text-slate-800">
                              {val === null || val === undefined || val === '' ? (
                                <span className="text-slate-300 italic font-mono text-[10px]">empty</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : viewMode === 'raw_only' ? (
          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <tbody className="divide-y divide-slate-100">
                {rawDataset.rawMatrix.slice(0, 40).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    <td className="p-2 w-10 text-center text-slate-400 bg-slate-50">{rIdx + 1}</td>
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="p-2 border-r border-slate-100 whitespace-nowrap">
                        {String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-purple-100 rounded-lg overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#26133B] text-white">
                <tr>
                  <th className="p-2.5 text-center text-purple-300 w-10">#</th>
                  {cleanedDataset.headers.map((h) => (
                    <th key={h} className="p-2.5 font-bold whitespace-nowrap text-purple-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {cleanedDataset.rows.slice(0, 40).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-purple-50/40">
                    <td className="p-2 text-center text-purple-400 font-mono bg-purple-50/30">{rIdx + 1}</td>
                    {cleanedDataset.headers.map((h) => (
                      <td key={h} className="p-2 border-r border-purple-50 whitespace-nowrap">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
