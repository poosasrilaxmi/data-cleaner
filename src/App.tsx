/**
 * DataClean - Automated Excel & CSV Data Cleaner
 * Features White & Lavender color aesthetic with full automated cleaning, normalization,
 * deduplication, restructuring pipeline, Gemini Chatbot, Google Maps Grounding, and Veo 3 Video.
 */

import React, { useState, useEffect, useTransition } from 'react';
import {
  CleaningRuleConfig,
  CleanedDataset,
  RawFileDataset,
  RestructureAction
} from './types/dataCleaner';
import {
  DEFAULT_CLEANING_CONFIG,
  cleanAndRestructureDataset
} from './utils/cleaningEngine';
import { parseUploadedFile, loadSampleDataset } from './utils/fileParser';
import {
  SAMPLE_MESSY_CRM,
  SAMPLE_MESSY_INVENTORY,
  SAMPLE_MESSY_FINANCIAL
} from './utils/sampleData';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { MetricsBanner } from './components/MetricsBanner';
import { DataTable } from './components/DataTable';
import { DiffViewer } from './components/DiffViewer';
import { PipelineConfigPanel } from './components/PipelineConfigPanel';
import { RestructureStudio } from './components/RestructureStudio';
import { FuzzyReviewer } from './components/FuzzyReviewer';
import { GeminiChatbot } from './components/GeminiChatbot';
import { MapsGroundingPanel } from './components/MapsGroundingPanel';
import { VeoVideoGenerator } from './components/VeoVideoGenerator';
import { ExportModal } from './components/ExportModal';
import { SplitModal } from './components/SplitModal';
import {
  Table2,
  GitCompare,
  Sliders,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Download,
  MessageSquare,
  MapPin,
  Video
} from 'lucide-react';

export default function App() {
  const [rawDataset, setRawDataset] = useState<RawFileDataset | null>(null);
  const [config, setConfig] = useState<CleaningRuleConfig>(DEFAULT_CLEANING_CONFIG);
  const [cleanedDataset, setCleanedDataset] = useState<CleanedDataset | null>(null);
  const [activeTab, setActiveTab] = useState<
    'table' | 'diff' | 'pipeline' | 'restructure' | 'fuzzy' | 'chat' | 'maps' | 'video'
  >('table');
  const [isProcessing, startTransition] = useTransition();
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Split Modal state
  const [splitModalCol, setSplitModalCol] = useState<string | null>(null);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Re-run pipeline whenever raw data or config changes
  useEffect(() => {
    if (!rawDataset) return;

    startTransition(() => {
      const result = cleanAndRestructureDataset(rawDataset.rawMatrix, config);
      setCleanedDataset(result);
    });
  }, [rawDataset, config]);

  // Load Initial Sample on first mount so the user immediately sees a rich clean state
  useEffect(() => {
    const initialSample = loadSampleDataset('crm', SAMPLE_MESSY_CRM);
    setRawDataset(initialSample);
    const initialCleaned = cleanAndRestructureDataset(initialSample.rawMatrix, DEFAULT_CLEANING_CONFIG);
    setCleanedDataset(initialCleaned);
    showToast('Loaded Messy CRM sample: 7 transformations & duplicate cleanup automatically performed!');
  }, []);

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoadingFile(true);
      const parsed = await parseUploadedFile(file);
      setRawDataset(parsed);
      // reset restructuring rules for new file
      setConfig((prev) => ({ ...prev, restructureRules: [], deduplicateKeys: [] }));
      showToast(`Successfully uploaded "${file.name}". Automatically cleaned & normalized!`);
      setActiveTab('table');
    } catch (err: any) {
      alert(`Error reading spreadsheet: ${err.message || 'Unsupported format'}`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handle Sample Selection
  const handleLoadSample = (sampleType: 'crm' | 'inventory' | 'financial') => {
    let matrix: any[][] = [];
    if (sampleType === 'crm') matrix = SAMPLE_MESSY_CRM;
    if (sampleType === 'inventory') matrix = SAMPLE_MESSY_INVENTORY;
    if (sampleType === 'financial') matrix = SAMPLE_MESSY_FINANCIAL;

    const sample = loadSampleDataset(sampleType, matrix);
    setRawDataset(sample);
    setConfig((prev) => ({ ...prev, restructureRules: [], deduplicateKeys: [] }));
    showToast(`Loaded ${sample.fileName}. Automatically structured!`);
    setActiveTab('table');
  };

  // Handle Sheet switch
  const handleSheetChange = (sheetName: string) => {
    if (!rawDataset || !rawDataset.sheetDataMap[sheetName]) return;
    const newMatrix = rawDataset.sheetDataMap[sheetName];
    setRawDataset({
      ...rawDataset,
      activeSheet: sheetName,
      rawMatrix: newMatrix
    });
    showToast(`Switched to worksheet: ${sheetName}`);
  };

  // Quick Column Actions from Table
  const handleQuickRename = (oldCol: string, newCol: string) => {
    const newRule: RestructureAction = {
      id: `rename_${Date.now()}`,
      type: 'rename_column',
      oldCol,
      newCol
    };
    setConfig((prev) => ({
      ...prev,
      restructureRules: [...prev.restructureRules, newRule]
    }));
    showToast(`Renamed column "${oldCol}" to "${newCol}"`);
  };

  const handleQuickDrop = (col: string) => {
    const newRule: RestructureAction = {
      id: `drop_${Date.now()}`,
      type: 'drop_column',
      col
    };
    setConfig((prev) => ({
      ...prev,
      restructureRules: [...prev.restructureRules, newRule]
    }));
    showToast(`Removed column "${col}"`);
  };

  const handleQuickCase = (col: string, casing: 'title' | 'upper' | 'lower') => {
    const newRule: RestructureAction = {
      id: `case_${Date.now()}`,
      type: 'change_case',
      col,
      targetCase: casing
    };
    setConfig((prev) => ({
      ...prev,
      restructureRules: [...prev.restructureRules, newRule]
    }));
    showToast(`Converted "${col}" to ${casing} case`);
  };

  const handleConfirmSplit = (col: string, delimiter: string, newCols: string[]) => {
    const newRule: RestructureAction = {
      id: `split_${Date.now()}`,
      type: 'split_column',
      sourceCol: col,
      delimiter,
      newCols
    };
    setConfig((prev) => ({
      ...prev,
      restructureRules: [...prev.restructureRules, newRule]
    }));
    showToast(`Split column "${col}" into [${newCols.join(', ')}]`);
  };

  // Restructure Studio Rule management
  const handleAddRestructureRule = (rule: RestructureAction) => {
    setConfig((prev) => ({
      ...prev,
      restructureRules: [...prev.restructureRules, rule]
    }));
    showToast('Applied restructure step');
  };

  const handleRemoveRestructureRule = (ruleId: string) => {
    setConfig((prev) => ({
      ...prev,
      restructureRules: prev.restructureRules.filter((r) => r.id !== ruleId)
    }));
    showToast('Removed restructure step');
  };

  // Fuzzy resolution handler
  const handleResolveFuzzy = (
    pairId: string,
    action: 'keep_a' | 'keep_b' | 'keep_both' | 'merge'
  ) => {
    if (!cleanedDataset) return;
    const pair = cleanedDataset.fuzzyDuplicates.find((p) => p.id === pairId);
    if (!pair) return;

    if (action === 'keep_a') {
      const updatedRows = [...cleanedDataset.rows];
      updatedRows.splice(pair.indexB, 1);
      setCleanedDataset({
        ...cleanedDataset,
        rows: updatedRows,
        cleanedRowCount: updatedRows.length,
        fuzzyDuplicates: cleanedDataset.fuzzyDuplicates.filter((p) => p.id !== pairId)
      });
      showToast('Kept Record A; removed duplicate Record B');
    } else if (action === 'keep_b') {
      const updatedRows = [...cleanedDataset.rows];
      updatedRows.splice(pair.indexA, 1);
      setCleanedDataset({
        ...cleanedDataset,
        rows: updatedRows,
        cleanedRowCount: updatedRows.length,
        fuzzyDuplicates: cleanedDataset.fuzzyDuplicates.filter((p) => p.id !== pairId)
      });
      showToast('Kept Record B; removed Record A');
    } else if (action === 'merge') {
      const updatedRows = [...cleanedDataset.rows];
      const mergedRow = { ...updatedRows[pair.indexA] };
      Object.keys(updatedRows[pair.indexB] || {}).forEach((k) => {
        if (!mergedRow[k] && updatedRows[pair.indexB][k]) {
          mergedRow[k] = updatedRows[pair.indexB][k];
        }
      });
      updatedRows[pair.indexA] = mergedRow;
      updatedRows.splice(pair.indexB, 1);
      setCleanedDataset({
        ...cleanedDataset,
        rows: updatedRows,
        cleanedRowCount: updatedRows.length,
        fuzzyDuplicates: cleanedDataset.fuzzyDuplicates.filter((p) => p.id !== pairId)
      });
      showToast('Merged attributes from both records');
    } else {
      setCleanedDataset({
        ...cleanedDataset,
        fuzzyDuplicates: cleanedDataset.fuzzyDuplicates.filter((p) => p.id !== pairId)
      });
      showToast('Kept both records as distinct');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFE] flex flex-col font-sans text-slate-900 selection:bg-[#7C3AED] selection:text-white">
      {/* Deep Lavender Navigation Header */}
      <Header
        rawDataset={rawDataset}
        cleanedDataset={cleanedDataset}
        onOpenUpload={() => {
          const el = document.getElementById('uploader-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onExportClick={() => setIsExportModalOpen(true)}
        onLoadSample={handleLoadSample}
        isProcessing={isProcessing || isLoadingFile}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Zone & Sample Pickers */}
        <div id="uploader-section">
          <FileUploader
            onFileSelected={handleFileUpload}
            onSampleSelected={handleLoadSample}
            rawDataset={rawDataset}
            onSheetChange={handleSheetChange}
            isLoading={isLoadingFile}
          />
        </div>

        {/* Cleaned Dataset View */}
        {cleanedDataset && (
          <>
            {/* Top Metrics Cards */}
            <MetricsBanner dataset={cleanedDataset} />

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-purple-100 shadow-xs mb-4 p-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'table'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  <span>Cleaned Table</span>
                  <span className="text-[11px] font-mono bg-white/20 px-1.5 py-0.2 rounded">
                    {cleanedDataset.cleanedRowCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('diff')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'diff'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Before vs. After</span>
                  <span className="text-[11px] font-mono bg-emerald-600/20 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                    +{cleanedDataset.qualityScoreAfter - cleanedDataset.qualityScoreBefore}%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pipeline')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'pipeline'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Rules Pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('restructure')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'restructure'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Restructure</span>
                  {config.restructureRules.length > 0 && (
                    <span className="text-[10px] bg-purple-100 text-[#7C3AED] px-1.5 py-0.5 rounded font-bold">
                      {config.restructureRules.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fuzzy')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'fuzzy'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Fuzzy Duplicates</span>
                  {cleanedDataset.fuzzyDuplicates.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                      {cleanedDataset.fuzzyDuplicates.length}
                    </span>
                  )}
                </button>

                {/* Additional Feature 1: Gemini Chatbot */}
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'chat'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-purple-800 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Gemini Chatbot</span>
                </button>

                {/* Additional Feature 2: Google Maps Grounding */}
                <button
                  type="button"
                  onClick={() => setActiveTab('maps')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'maps'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50/50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>Google Maps Data</span>
                </button>

                {/* Additional Feature 3: Veo 3 Video Gen */}
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'video'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-pink-800 hover:text-pink-900 hover:bg-pink-50/50'
                  }`}
                >
                  <Video className="w-4 h-4 text-pink-500" />
                  <span>Veo 3 Video Gen</span>
                </button>
              </div>

              {/* Quick Export Trigger */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-3.5 py-2 rounded-lg shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dataset</span>
              </button>
            </div>

            {/* Active Tab Content */}
            {activeTab === 'table' && (
              <DataTable
                dataset={cleanedDataset}
                onQuickRename={handleQuickRename}
                onQuickDrop={handleQuickDrop}
                onQuickCase={handleQuickCase}
                onOpenSplitModal={(col) => setSplitModalCol(col)}
              />
            )}

            {activeTab === 'diff' && rawDataset && (
              <DiffViewer rawDataset={rawDataset} cleanedDataset={cleanedDataset} />
            )}

            {activeTab === 'pipeline' && (
              <PipelineConfigPanel
                config={config}
                availableColumns={cleanedDataset.headers}
                onChangeConfig={(newCfg) => setConfig(newCfg)}
                onResetDefaults={() => setConfig(DEFAULT_CLEANING_CONFIG)}
              />
            )}

            {activeTab === 'restructure' && (
              <RestructureStudio
                columns={cleanedDataset.headers}
                activeRules={config.restructureRules}
                onAddRule={handleAddRestructureRule}
                onRemoveRule={handleRemoveRestructureRule}
              />
            )}

            {activeTab === 'fuzzy' && (
              <FuzzyReviewer
                fuzzyDuplicates={cleanedDataset.fuzzyDuplicates}
                headers={cleanedDataset.headers}
                onResolveFuzzy={handleResolveFuzzy}
              />
            )}

            {activeTab === 'chat' && (
              <GeminiChatbot rawDataset={rawDataset} cleanedDataset={cleanedDataset} />
            )}

            {activeTab === 'maps' && (
              <MapsGroundingPanel cleanedDataset={cleanedDataset} />
            )}

            {activeTab === 'video' && (
              <VeoVideoGenerator cleanedDataset={cleanedDataset} />
            )}
          </>
        )}
      </main>

      {/* Floating Export Modal */}
      {cleanedDataset && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          dataset={cleanedDataset}
          config={config}
          originalFileName={rawDataset?.fileName || 'dataset.xlsx'}
        />
      )}

      {/* Column Split Modal */}
      {splitModalCol && (
        <SplitModal
          isOpen={Boolean(splitModalCol)}
          onClose={() => setSplitModalCol(null)}
          columnName={splitModalCol}
          onConfirmSplit={handleConfirmSplit}
        />
      )}

      {/* Bottom Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#26133B] text-white px-4 py-3 rounded-xl shadow-2xl border border-purple-500/40 flex items-center space-x-2.5 text-xs animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-purple-100 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#26133B]">DataClean</span>
            <span>—</span>
            <span>Automated In-Browser Excel &amp; CSV Data Sanitizer</span>
          </div>
          <div className="text-[11px] text-purple-600/70">
            No server uploads · Data remains 100% private in browser memory
          </div>
        </div>
      </footer>
    </div>
  );
}
