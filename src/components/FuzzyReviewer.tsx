import React from 'react';
import { FuzzyDuplicatePair } from '../types/dataCleaner';
import { Check, Combine, AlertTriangle } from 'lucide-react';

interface FuzzyReviewerProps {
  fuzzyDuplicates: FuzzyDuplicatePair[];
  headers: string[];
  onResolveFuzzy: (pairId: string, action: 'keep_a' | 'keep_b' | 'keep_both' | 'merge') => void;
}

export const FuzzyReviewer: React.FC<FuzzyReviewerProps> = ({
  fuzzyDuplicates,
  headers,
  onResolveFuzzy
}) => {
  if (fuzzyDuplicates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-8 text-center shadow-sm mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">No Fuzzy Duplicates Detected</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          All distinct records have been verified. No near-duplicate typos or slight variations were identified above the similarity threshold.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-amber-50/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-amber-950">
            Fuzzy Duplicate Review ({fuzzyDuplicates.length} near-matches detected)
          </h3>
        </div>
        <span className="text-xs text-amber-800 font-medium">
          Review potential typos or duplicate entities
        </span>
      </div>

      <div className="p-5 space-y-4">
        {fuzzyDuplicates.map((pair) => {
          const matchPercent = Math.round(pair.similarity * 100);

          return (
            <div
              key={pair.id}
              className="border border-purple-100 rounded-xl p-4 bg-purple-50/20 hover:border-[#7C3AED] transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 bg-white border border-purple-200 px-2.5 py-0.5 rounded-full">
                    {matchPercent}% Match
                  </span>
                  <span className="text-xs text-slate-500">
                    Comparing values: <strong className="text-slate-800 font-mono">&quot;{pair.keyValA}&quot;</strong> vs <strong className="text-slate-800 font-mono">&quot;{pair.keyValB}&quot;</strong>
                  </span>
                </div>

                {/* Resolution buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => onResolveFuzzy(pair.id, 'keep_a')}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition"
                  >
                    Keep Record A
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveFuzzy(pair.id, 'keep_b')}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition"
                  >
                    Keep Record B
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveFuzzy(pair.id, 'merge')}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center space-x-1"
                  >
                    <Combine className="w-3 h-3" />
                    <span>Merge Both</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveFuzzy(pair.id, 'keep_both')}
                    className="text-xs font-medium px-2 py-1 rounded bg-white text-slate-600 border border-purple-200 hover:bg-purple-50 transition"
                  >
                    Keep Both
                  </button>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Record A */}
                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Record A (Row #{pair.indexA + 1})
                  </div>
                  <div className="space-y-1">
                    {headers.slice(0, 5).map((h) => (
                      <div key={h} className="flex justify-between py-0.5 border-b border-purple-50">
                        <span className="text-slate-500 font-medium">{h}:</span>
                        <span className="text-slate-900 font-mono">{String(pair.rowA[h] ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Record B */}
                <div className="bg-white p-3 rounded-lg border border-purple-100">
                  <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Record B (Row #{pair.indexB + 1})
                  </div>
                  <div className="space-y-1">
                    {headers.slice(0, 5).map((h) => (
                      <div key={h} className="flex justify-between py-0.5 border-b border-purple-50">
                        <span className="text-slate-500 font-medium">{h}:</span>
                        <span className="text-slate-900 font-mono">{String(pair.rowB[h] ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
