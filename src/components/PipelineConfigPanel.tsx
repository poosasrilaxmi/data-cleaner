import React from 'react';
import {
  CleaningRuleConfig,
  DateFormatTarget,
  HeaderCasing,
  PhoneFormatTarget,
  DeduplicateMode,
  DeduplicateKeep
} from '../types/dataCleaner';
import {
  Sliders,
  RotateCcw,
  Heading,
  Calendar,
  Copy
} from 'lucide-react';

interface PipelineConfigPanelProps {
  config: CleaningRuleConfig;
  availableColumns: string[];
  onChangeConfig: (newConfig: CleaningRuleConfig) => void;
  onResetDefaults: () => void;
}

export const PipelineConfigPanel: React.FC<PipelineConfigPanelProps> = ({
  config,
  availableColumns,
  onChangeConfig,
  onResetDefaults
}) => {
  const update = (partial: Partial<CleaningRuleConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const toggleKey = (col: string) => {
    const current = config.deduplicateKeys;
    if (current.includes(col)) {
      update({ deduplicateKeys: current.filter((c) => c !== col) });
    } else {
      update({ deduplicateKeys: [...current, col] });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#7C3AED]" />
          <h3 className="text-sm font-bold text-slate-900">Automated Cleaning Pipeline Settings</h3>
          <span className="text-[11px] text-purple-600 font-medium">· Real-time reactive re-processing</span>
        </div>
        <button
          type="button"
          onClick={onResetDefaults}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold flex items-center space-x-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section 1: Structure & Headers */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-purple-100">
            <Heading className="w-4 h-4 text-[#7C3AED]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Headers &amp; Structure
            </h4>
          </div>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoDetectHeader}
              onChange={(e) => update({ autoDetectHeader: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Auto-Detect Header Row</span>
              <p className="text-[11px] text-slate-500">Skips junk banner, disclaimer, or metadata preamble rows.</p>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.removeEmptyRows}
              onChange={(e) => update({ removeEmptyRows: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Purge Blank Rows</span>
              <p className="text-[11px] text-slate-500">Drops completely empty rows and trailing padding.</p>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.removeEmptyCols}
              onChange={(e) => update({ removeEmptyCols: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Purge Blank Columns</span>
              <p className="text-[11px] text-slate-500">Eliminates columns containing 100% empty values.</p>
            </div>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Header Casing Style:
            </label>
            <select
              value={config.headerCase}
              onChange={(e) => update({ headerCase: e.target.value as HeaderCasing })}
              className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="clean_title">Title Case (e.g. &quot;Customer ID&quot;, &quot;First Name&quot;)</option>
              <option value="snake_case">snake_case (e.g. &quot;customer_id&quot;, &quot;first_name&quot;)</option>
              <option value="camelCase">camelCase (e.g. &quot;customerId&quot;, &quot;firstName&quot;)</option>
              <option value="UPPERCASE">UPPERCASE (e.g. &quot;CUSTOMER_ID&quot;, &quot;FIRST_NAME&quot;)</option>
              <option value="kebab_case">kebab-case (e.g. &quot;customer-id&quot;, &quot;first-name&quot;)</option>
              <option value="original">Keep Original Spelling</option>
            </select>
          </div>
        </div>

        {/* Section 2: Normalization */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-purple-100">
            <Calendar className="w-4 h-4 text-[#7C3AED]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Data Normalization
            </h4>
          </div>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.trimWhitespace}
              onChange={(e) => update({ trimWhitespace: e.target.checked, collapseInnerWhitespace: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Trim &amp; Collapse Whitespace</span>
              <p className="text-[11px] text-slate-500">Strips trailing/leading spaces and interior duplicate spaces.</p>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.normalizeEmails}
              onChange={(e) => update({ normalizeEmails: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Normalize Emails</span>
              <p className="text-[11px] text-slate-500">Lowercases and sanitizes email addresses.</p>
            </div>
          </label>

          {/* Date Normalization & Target */}
          <div className="space-y-1.5">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.normalizeDates}
                onChange={(e) => update({ normalizeDates: e.target.checked })}
                className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
              />
              <span className="text-xs font-semibold text-slate-800">Standardize Date Formats</span>
            </label>
            {config.normalizeDates && (
              <select
                value={config.dateFormatTarget}
                onChange={(e) => update({ dateFormatTarget: e.target.value as DateFormatTarget })}
                className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="YYYY-MM-DD">ISO standard: YYYY-MM-DD (2024-03-15)</option>
                <option value="MM/DD/YYYY">US standard: MM/DD/YYYY (03/15/2024)</option>
                <option value="DD/MM/YYYY">UK/EU standard: DD/MM/YYYY (15/03/2024)</option>
                <option value="YYYY/MM/DD">YYYY/MM/DD (2024/03/15)</option>
              </select>
            )}
          </div>

          {/* Phone Normalization & Target */}
          <div className="space-y-1.5">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.normalizePhones}
                onChange={(e) => update({ normalizePhones: e.target.checked })}
                className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
              />
              <span className="text-xs font-semibold text-slate-800">Unify Phone Numbers</span>
            </label>
            {config.normalizePhones && (
              <select
                value={config.phoneFormatTarget}
                onChange={(e) => update({ phoneFormatTarget: e.target.value as PhoneFormatTarget })}
                className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="US_STANDARD">(555) 234-5678</option>
                <option value="E164">+15552345678 (E.164)</option>
                <option value="DOT_SEPARATED">555.234.5678</option>
                <option value="DIGITS_ONLY">5552345678 (Clean digits)</option>
              </select>
            )}
          </div>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.normalizeNumbers}
              onChange={(e) => update({ normalizeNumbers: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Clean Currencies &amp; Numbers</span>
              <p className="text-[11px] text-slate-500">Strips $, €, £, converts (100.00) accounting parenthesis to -100.</p>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.normalizeBooleans}
              onChange={(e) => update({ normalizeBooleans: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Normalize Booleans</span>
              <p className="text-[11px] text-slate-500">Converts yes/no, 1/0, y/n to TRUE / FALSE.</p>
            </div>
          </label>
        </div>

        {/* Section 3: Deduplication */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-purple-100">
            <Copy className="w-4 h-4 text-[#7C3AED]" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Deduplication Engine
            </h4>
          </div>

          <label className="flex items-start space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.deduplicate}
              onChange={(e) => update({ deduplicate: e.target.checked })}
              className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Enable Deduplication</span>
              <p className="text-[11px] text-slate-500">Purges redundant rows across the dataset.</p>
            </div>
          </label>

          {config.deduplicate && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matching Mode:
                </label>
                <select
                  value={config.deduplicateMode}
                  onChange={(e) => update({ deduplicateMode: e.target.value as DeduplicateMode })}
                  className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value="case_insensitive">Case-Insensitive Match (Recommended)</option>
                  <option value="exact">Exact Match (Strict)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  When Duplicates Occur, Keep:
                </label>
                <select
                  value={config.deduplicateKeep}
                  onChange={(e) => update({ deduplicateKeep: e.target.value as DeduplicateKeep })}
                  className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value="first">Keep First Occurrence</option>
                  <option value="last">Keep Most Recent / Last Occurrence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Columns to Check (Optional):
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Leave unselected to check full row, or pick unique keys like Email/ID:
                </p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-purple-50/30 rounded border border-purple-200">
                  {availableColumns.map((col) => {
                    const isSelected = config.deduplicateKeys.includes(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => toggleKey(col)}
                        className={`text-[11px] px-2 py-0.5 rounded transition ${
                          isSelected
                            ? 'bg-[#7C3AED] text-white font-semibold'
                            : 'bg-white text-slate-600 border border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fuzzy Similarity */}
              <div className="pt-2 border-t border-purple-100">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.fuzzyDeduplicate}
                    onChange={(e) => update({ fuzzyDeduplicate: e.target.checked })}
                    className="mt-0.5 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Fuzzy Typo Detection</span>
                    <p className="text-[11px] text-slate-500">Flags near-matches like &quot;Jonathon&quot; vs &quot;Jonathan&quot;.</p>
                  </div>
                </label>

                {config.fuzzyDeduplicate && (
                  <div className="mt-2 pl-6">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Similarity Threshold:</span>
                      <strong className="text-[#7C3AED]">{Math.round(config.fuzzyThreshold * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={98}
                      value={Math.round(config.fuzzyThreshold * 100)}
                      onChange={(e) => update({ fuzzyThreshold: Number(e.target.value) / 100 })}
                      className="w-full accent-[#7C3AED] h-1.5 bg-purple-200 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
