import React, { useState } from 'react';
import { RestructureAction } from '../types/dataCleaner';
import { Scissors, Combine, Edit3, Trash2, Search, Plus, X, Layers } from 'lucide-react';

interface RestructureStudioProps {
  columns: string[];
  activeRules: RestructureAction[];
  onAddRule: (rule: RestructureAction) => void;
  onRemoveRule: (ruleId: string) => void;
  preselectedSplitCol?: string | null;
}

export const RestructureStudio: React.FC<RestructureStudioProps> = ({
  columns,
  activeRules,
  onAddRule,
  onRemoveRule,
  preselectedSplitCol
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'merge' | 'rename' | 'drop' | 'replace'>('split');

  // Split state
  const [splitCol, setSplitCol] = useState(preselectedSplitCol || columns[0] || '');
  const [splitDelimiter, setSplitDelimiter] = useState(' ');
  const [splitNewCol1, setSplitNewCol1] = useState('First Name');
  const [splitNewCol2, setSplitNewCol2] = useState('Last Name');

  // Merge state
  const [mergeCols, setMergeCols] = useState<string[]>([]);
  const [mergeDelimiter, setMergeDelimiter] = useState(' ');
  const [mergeTargetCol, setMergeTargetCol] = useState('Combined_Column');

  // Rename state
  const [renameOldCol, setRenameOldCol] = useState(columns[0] || '');
  const [renameNewCol, setRenameNewCol] = useState('');

  // Drop state
  const [dropCol, setDropCol] = useState(columns[0] || '');

  // Replace state
  const [replaceCol, setReplaceCol] = useState(columns[0] || '');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleApplySplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitCol || !splitNewCol1.trim() || !splitNewCol2.trim()) return;

    onAddRule({
      id: `split_${Date.now()}`,
      type: 'split_column',
      sourceCol: splitCol,
      delimiter: splitDelimiter,
      newCols: [splitNewCol1.trim(), splitNewCol2.trim()]
    });
  };

  const handleApplyMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (mergeCols.length < 2 || !mergeTargetCol.trim()) return;

    onAddRule({
      id: `merge_${Date.now()}`,
      type: 'merge_columns',
      sourceCols: mergeCols,
      delimiter: mergeDelimiter,
      targetCol: mergeTargetCol.trim()
    });
  };

  const handleApplyRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameOldCol || !renameNewCol.trim()) return;

    onAddRule({
      id: `rename_${Date.now()}`,
      type: 'rename_column',
      oldCol: renameOldCol,
      newCol: renameNewCol.trim()
    });
    setRenameNewCol('');
  };

  const handleApplyDrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropCol) return;

    onAddRule({
      id: `drop_${Date.now()}`,
      type: 'drop_column',
      col: dropCol
    });
  };

  const handleApplyReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceCol || !findText) return;

    onAddRule({
      id: `replace_${Date.now()}`,
      type: 'find_replace',
      col: replaceCol,
      findText,
      replaceText
    });
    setFindText('');
    setReplaceText('');
  };

  const toggleMergeCol = (col: string) => {
    if (mergeCols.includes(col)) {
      setMergeCols(mergeCols.filter((c) => c !== col));
    } else {
      setMergeCols([...mergeCols, col]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#7C3AED]" />
          <h3 className="text-sm font-bold text-slate-900">Spreadsheet Restructure Studio</h3>
        </div>
        <span className="text-xs text-purple-700 font-medium">
          Split, merge, rename, and transform columns
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Action Builder (7 cols) */}
        <div className="lg:col-span-7">
          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-purple-50/60 rounded-lg mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'split' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Split Column</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('merge')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'merge' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Combine className="w-3.5 h-3.5" />
              <span>Merge Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rename')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'rename' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('replace')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'replace' ? 'bg-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find &amp; Replace</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                activeTab === 'drop' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Column</span>
            </button>
          </div>

          {/* Tab 1: Split */}
          {activeTab === 'split' && (
            <form onSubmit={handleApplySplit} className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Column to Split:</label>
                  <select
                    value={splitCol}
                    onChange={(e) => setSplitCol(e.target.value)}
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Split Delimiter:</label>
                  <select
                    value={splitDelimiter}
                    onChange={(e) => setSplitDelimiter(e.target.value)}
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                  >
                    <option value=" ">Space (&quot; &quot;)</option>
                    <option value=",">Comma (&quot;,&quot;)</option>
                    <option value="-">Hyphen (&quot;-&quot;)</option>
                    <option value="/">Slash (&quot;/&quot;)</option>
                    <option value="@">At Sign (&quot;@&quot;)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Column 1 Name:</label>
                  <input
                    type="text"
                    value={splitNewCol1}
                    onChange={(e) => setSplitNewCol1(e.target.value)}
                    placeholder="e.g. First Name"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Column 2 Name:</label>
                  <input
                    type="text"
                    value={splitNewCol2}
                    onChange={(e) => setSplitNewCol2(e.target.value)}
                    placeholder="e.g. Last Name"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Apply Column Split</span>
              </button>
            </form>
          )}

          {/* Tab 2: Merge */}
          {activeTab === 'merge' && (
            <form onSubmit={handleApplyMerge} className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Columns to Merge (Pick 2+):</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-purple-200 max-h-28 overflow-y-auto">
                  {columns.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleMergeCol(c)}
                      className={`text-xs px-2.5 py-1 rounded transition ${
                        mergeCols.includes(c)
                          ? 'bg-[#7C3AED] text-white font-semibold'
                          : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Join Separator:</label>
                  <input
                    type="text"
                    value={mergeDelimiter}
                    onChange={(e) => setMergeDelimiter(e.target.value)}
                    placeholder="e.g. space or comma"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Target Column Name:</label>
                  <input
                    type="text"
                    value={mergeTargetCol}
                    onChange={(e) => setMergeTargetCol(e.target.value)}
                    placeholder="e.g. Full Address"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={mergeCols.length < 2}
                className="w-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Apply Column Merge</span>
              </button>
            </form>
          )}

          {/* Tab 3: Rename */}
          {activeTab === 'rename' && (
            <form onSubmit={handleApplyRename} className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Column:</label>
                  <select
                    value={renameOldCol}
                    onChange={(e) => setRenameOldCol(e.target.value)}
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Column Title:</label>
                  <input
                    type="text"
                    value={renameNewCol}
                    onChange={(e) => setRenameNewCol(e.target.value)}
                    placeholder="e.g. User Email"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Apply Rename</span>
              </button>
            </form>
          )}

          {/* Tab 4: Replace */}
          {activeTab === 'replace' && (
            <form onSubmit={handleApplyReplace} className="space-y-4 bg-purple-50/30 p-4 rounded-xl border border-purple-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Column:</label>
                <select
                  value={replaceCol}
                  onChange={(e) => setReplaceCol(e.target.value)}
                  className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Find Value:</label>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="e.g. &apos;old_value&apos;"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Replace With:</label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="e.g. &apos;new_value&apos;"
                    className="w-full text-xs bg-white border border-purple-200 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Apply Find &amp; Replace</span>
              </button>
            </form>
          )}

          {/* Tab 5: Drop */}
          {activeTab === 'drop' && (
            <form onSubmit={handleApplyDrop} className="space-y-4 bg-rose-50/60 p-4 rounded-xl border border-rose-200">
              <div>
                <label className="block text-xs font-semibold text-rose-900 mb-1">Column to Remove:</label>
                <select
                  value={dropCol}
                  onChange={(e) => setDropCol(e.target.value)}
                  className="w-full text-xs bg-white border border-rose-300 rounded-lg p-2 text-slate-800"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 py-2.5 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected Column</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Active Restructuring Rules Pipeline (5 cols) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active Restructure Steps ({activeRules.length})
            </h4>
            <span className="text-[11px] text-purple-600">Executed sequentially</span>
          </div>

          {activeRules.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/20">
              <Layers className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No custom restructuring rules added.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Use the tools on the left to split, merge, or re-title columns.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      {rule.type === 'split_column' && (
                        <span>
                          Split <strong className="text-[#7C3AED]">{rule.sourceCol}</strong> → [{rule.newCols.join(', ')}]
                        </span>
                      )}
                      {rule.type === 'merge_columns' && (
                        <span>
                          Merge [{rule.sourceCols.join(', ')}] → <strong className="text-[#7C3AED]">{rule.targetCol}</strong>
                        </span>
                      )}
                      {rule.type === 'rename_column' && (
                        <span>
                          Rename {rule.oldCol} → <strong className="text-[#7C3AED]">{rule.newCol}</strong>
                        </span>
                      )}
                      {rule.type === 'drop_column' && (
                        <span className="text-rose-700">
                          Drop column <strong className="line-through">{rule.col}</strong>
                        </span>
                      )}
                      {rule.type === 'find_replace' && (
                        <span>
                          In {rule.col}: &quot;{rule.findText}&quot; → &quot;{rule.replaceText}&quot;
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveRule(rule.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove rule"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
