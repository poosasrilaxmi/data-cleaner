import React from 'react';
import { CleanedDataset } from '../types/dataCleaner';
import { ShieldCheck, CopySlash, Wand2, Layers } from 'lucide-react';

interface MetricsBannerProps {
  dataset: CleanedDataset;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ dataset }) => {
  const qualityDiff = dataset.qualityScoreAfter - dataset.qualityScoreBefore;
  const duplicateMetric = dataset.metrics.find((m) => m.id === 'duplicates_purged');
  const emptyRowsMetric = dataset.metrics.find((m) => m.id === 'empty_rows_removed');

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* 1. Quality Score Jump */}
      <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Data Quality Score
          </span>
          <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dataset.qualityScoreAfter}%
          </span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            +{qualityDiff}%
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Raw baseline: {dataset.qualityScoreBefore}%
        </p>
        <div className="w-full bg-purple-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-[#7C3AED] h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, dataset.qualityScoreAfter)}%` }}
          />
        </div>
      </div>

      {/* 2. Deduplication */}
      <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Duplicates Purged
          </span>
          <CopySlash className="w-4 h-4 text-[#7C3AED]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {duplicateMetric?.count || 0}
          </span>
          <span className="text-xs text-slate-500">records</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {dataset.fuzzyDuplicates.length > 0 ? (
            <span className="text-amber-600 font-medium">
              {dataset.fuzzyDuplicates.length} potential fuzzy matches found
            </span>
          ) : (
            'Exact & case duplicates eliminated'
          )}
        </p>
      </div>

      {/* 3. Row Retention & Structure */}
      <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rows &amp; Columns
          </span>
          <Layers className="w-4 h-4 text-[#7C3AED]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dataset.cleanedRowCount}
          </span>
          <span className="text-xs text-slate-500">
            / {dataset.originalRowCount} rows
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {dataset.cleanedColCount} active clean columns
          {emptyRowsMetric ? ` · ${emptyRowsMetric.count} blank purged` : ''}
        </p>
      </div>

      {/* 4. Cell Transformations */}
      <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Normalizations
          </span>
          <Wand2 className="w-4 h-4 text-[#7C3AED]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dataset.cellChangeCount}
          </span>
          <span className="text-xs text-slate-500">cells modified</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 truncate">
          Whitespace, dates, phones, currency, booleans
        </p>
      </div>
    </div>
  );
};
