import React, { useState } from 'react';
import { Scissors, X } from 'lucide-react';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  onConfirmSplit: (col: string, delimiter: string, newCols: string[]) => void;
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  columnName,
  onConfirmSplit
}) => {
  const [delimiter, setDelimiter] = useState(' ');
  const [col1Name, setCol1Name] = useState(`${columnName}_Part1`);
  const [col2Name, setCol2Name] = useState(`${columnName}_Part2`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!col1Name.trim() || !col2Name.trim()) return;
    onConfirmSplit(columnName, delimiter, [col1Name.trim(), col2Name.trim()]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-purple-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#26133B] text-white p-4 flex items-center justify-between border-b border-[#3D1F5E]">
          <div className="flex items-center space-x-2">
            <Scissors className="w-4 h-4 text-pink-300" />
            <h3 className="text-sm font-bold">Split Column: &quot;{columnName}&quot;</h3>
          </div>
          <button type="button" onClick={onClose} className="text-purple-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Split By Delimiter:
            </label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800"
            >
              <option value=" ">Space (&quot; &quot;)</option>
              <option value=",">Comma (&quot;,&quot;)</option>
              <option value="-">Hyphen (&quot;-&quot;)</option>
              <option value="/">Slash (&quot;/&quot;)</option>
              <option value="@">At Sign (&quot;@&quot;)</option>
              <option value="_">Underscore (&quot;_&quot;)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Output Column:</label>
              <input
                type="text"
                value={col1Name}
                onChange={(e) => setCol1Name(e.target.value)}
                className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Second Output Column:</label>
              <input
                type="text"
                value={col2Name}
                onChange={(e) => setCol2Name(e.target.value)}
                className="w-full text-xs bg-purple-50/30 border border-purple-200 rounded-lg p-2 text-slate-800"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg"
            >
              Split Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
