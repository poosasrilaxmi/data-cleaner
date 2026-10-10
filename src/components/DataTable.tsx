import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Scissors,
  CaseSensitive,
  Trash2,
  Edit2,
  Calendar,
  Hash,
  Mail,
  Phone,
  CheckSquare,
  Type
} from 'lucide-react';
import { CleanedDataset, ColumnType } from '../types/dataCleaner';

interface DataTableProps {
  dataset: CleanedDataset;
  onQuickRename: (oldCol: string, newCol: string) => void;
  onQuickDrop: (col: string) => void;
  onQuickCase: (col: string, casing: 'title' | 'upper' | 'lower') => void;
  onOpenSplitModal: (col: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  dataset,
  onQuickRename,
  onQuickDrop,
  onQuickCase,
  onOpenSplitModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeMenuCol, setActiveMenuCol] = useState<string | null>(null);
  const [renamingCol, setRenamingCol] = useState<string | null>(null);
  const [renameInputVal, setRenameInputVal] = useState('');

  // Column types map
  const colTypesMap = useMemo(() => {
    const map: Record<string, ColumnType> = {};
    dataset.columnStats.forEach((cs) => {
      map[cs.name] = cs.detectedType;
    });
    return map;
  }, [dataset.columnStats]);

  // Filtering and Sorting
  const filteredAndSortedRows = useMemo(() => {
    let rows = dataset.rows;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((row) => {
        return dataset.headers.some((header) => {
          const val = row[header];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      });
    }

    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined || valA === '') return 1;
        if (valB === null || valB === undefined || valB === '') return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortDir === 'asc' ? comp : -comp;
      });
    }

    return rows;
  }, [dataset.rows, dataset.headers, searchTerm, sortCol, sortDir]);

  // Pagination
  const totalRows = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const getColIcon = (type: ColumnType | undefined) => {
    switch (type) {
      case 'number':
      case 'currency':
        return <Hash className="w-3 h-3 text-purple-300" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-pink-300" />;
      case 'email':
        return <Mail className="w-3 h-3 text-emerald-300" />;
      case 'phone':
        return <Phone className="w-3 h-3 text-violet-300" />;
      case 'boolean':
        return <CheckSquare className="w-3 h-3 text-amber-300" />;
      default:
        return <Type className="w-3 h-3 text-purple-200" />;
    }
  };

  const submitRename = (oldCol: string) => {
    if (renameInputVal.trim() && renameInputVal.trim() !== oldCol) {
      onQuickRename(oldCol, renameInputVal.trim());
    }
    setRenamingCol(null);
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-purple-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-purple-50/30 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition"
          />
        </div>

        {/* Info & Page Size */}
        <div className="flex items-center space-x-3 text-xs text-slate-600 self-end sm:self-auto">
          <span>
            Showing <strong className="text-slate-900">{totalRows}</strong> records
          </span>
          <span className="text-purple-200">|</span>
          <div className="flex items-center space-x-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs bg-purple-50/50 border border-purple-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto max-h-[580px] relative">
        <table className="w-full text-left text-xs border-collapse">
          {/* Deep Lavender Header */}
          <thead className="bg-[#26133B] text-white sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="py-3 px-3 w-12 text-center text-purple-300 font-semibold border-b border-[#3D1F5E] bg-[#26133B]">
                #
              </th>
              {dataset.headers.map((header) => {
                const colType = colTypesMap[header];
                return (
                  <th
                    key={header}
                    className="py-3 px-4 font-semibold text-purple-50 border-b border-[#3D1F5E] whitespace-nowrap bg-[#26133B] group relative select-none"
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <div
                        className="flex items-center space-x-1.5 cursor-pointer hover:text-purple-300 transition"
                        onClick={() => handleSort(header)}
                      >
                        <span title={`Type: ${colType}`}>{getColIcon(colType)}</span>
                        {renamingCol === header ? (
                          <input
                            type="text"
                            value={renameInputVal}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenameInputVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename(header);
                              if (e.key === 'Escape') setRenamingCol(null);
                            }}
                            onBlur={() => submitRename(header)}
                            className="bg-[#3D1F5E] text-white text-xs px-1.5 py-0.5 rounded border border-purple-400 focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold tracking-wide">{header}</span>
                        )}

                        {sortCol === header ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-purple-300" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-purple-300" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </div>

                      {/* Header quick actions menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuCol(activeMenuCol === header ? null : header);
                          }}
                          className="p-1 rounded text-purple-300 hover:text-white hover:bg-[#3D1F5E] transition"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {activeMenuCol === header && (
                          <div
                            className="absolute right-0 mt-1 w-44 bg-[#2D1648] border border-purple-700/60 rounded-lg shadow-xl py-1 z-30 text-xs font-normal"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setRenameInputVal(header);
                                setRenamingCol(header);
                                setActiveMenuCol(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-purple-100 hover:bg-[#3B1C5D] flex items-center space-x-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-purple-300" />
                              <span>Rename column</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onOpenSplitModal(header);
                                setActiveMenuCol(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-purple-100 hover:bg-[#3B1C5D] flex items-center space-x-2"
                            >
                              <Scissors className="w-3.5 h-3.5 text-pink-300" />
                              <span>Split column...</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onQuickCase(header, 'title');
                                setActiveMenuCol(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-purple-100 hover:bg-[#3B1C5D] flex items-center space-x-2"
                            >
                              <CaseSensitive className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Convert to Title Case</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onQuickCase(header, 'upper');
                                setActiveMenuCol(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-purple-100 hover:bg-[#3B1C5D] flex items-center space-x-2"
                            >
                              <CaseSensitive className="w-3.5 h-3.5 text-violet-300" />
                              <span>Convert to UPPERCASE</span>
                            </button>
                            <div className="border-t border-purple-800/60 my-1"></div>
                            <button
                              type="button"
                              onClick={() => {
                                onQuickDrop(header);
                                setActiveMenuCol(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-rose-300 hover:bg-rose-950/40 flex items-center space-x-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete column</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-purple-50 bg-white">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={dataset.headers.length + 1} className="py-12 text-center text-slate-400">
                  No records match your query.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => {
                const actualIndex = (currentPage - 1) * pageSize + rowIdx + 1;
                return (
                  <tr
                    key={actualIndex}
                    className="hover:bg-purple-50/50 transition-colors duration-150 odd:bg-purple-50/20"
                  >
                    <td className="py-2.5 px-3 text-center text-purple-400 font-mono text-[11px] select-none">
                      {actualIndex}
                    </td>
                    {dataset.headers.map((header) => {
                      const val = row[header];
                      const colType = colTypesMap[header];
                      const isMonospace = colType === 'number' || colType === 'currency' || colType === 'date';

                      return (
                        <td
                          key={header}
                          className={`py-2.5 px-4 text-slate-800 whitespace-nowrap ${
                            isMonospace ? 'font-mono text-[11.5px]' : ''
                          }`}
                        >
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-300 italic font-mono text-[11px]">empty</span>
                          ) : typeof val === 'boolean' ? (
                            <span
                              className={`font-semibold ${
                                val ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {val ? 'TRUE' : 'FALSE'}
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-purple-100 bg-purple-50/30 flex items-center justify-between text-xs text-slate-600">
        <div>
          Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
          <strong className="text-slate-900">{totalPages}</strong>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-purple-200 bg-white text-slate-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">{currentPage} / {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-purple-200 bg-white text-slate-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
