import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Cpu,
  Brain,
  Zap,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { CleanedDataset, RawFileDataset } from '../types/dataCleaner';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  rawDataset: RawFileDataset | null;
  cleanedDataset: CleanedDataset | null;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  rawDataset,
  cleanedDataset
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text:
        'Hello! I am your **DataClean AI Copilot** powered by Gemini. ' +
        'I can inspect your spreadsheet headers, analyze formatting anomalies, generate Excel/Sheets formulas, or write custom regex cleaning rules. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [systemRole, setSystemRole] = useState<'architect' | 'regex' | 'auditor' | 'custom'>('architect');
  const [customInstruction, setCustomInstruction] = useState('');
  const [attachDatasetContext, setAttachDatasetContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const roleInstructions = {
    architect:
      'You are DataClean Architect, an expert in data modeling, database normalization, and spreadsheet restructuring. Provide strategic, step-by-step guidance on transforming messy datasets.',
    regex:
      'You are a Regex & Formula Specialist. Provide precise, copy-pasteable Regular Expressions and Excel/Google Sheets formulas (e.g., REGEXREPLACE, TEXT, INDEX/MATCH, ARRAYFORMULA) to clean data.',
    auditor:
      'You are an Anomaly & Compliance Auditor. Scrutinize spreadsheet data for formatting inconsistencies, duplicate risk factors, missing data patterns, and outliers.',
    custom: customInstruction || 'You are an intelligent data assistant.'
  };

  const getDatasetSummary = (): string => {
    if (!cleanedDataset) return 'No active spreadsheet loaded.';
    const cols = cleanedDataset.headers.join(', ');
    const metrics = cleanedDataset.metrics.map((m) => `${m.label}: ${m.count}`).join('; ');
    const preview = cleanedDataset.rows.slice(0, 3).map((r) => JSON.stringify(r)).join('\n');

    return (
      `File: ${rawDataset?.fileName || 'dataset'}\n` +
      `Original Rows: ${cleanedDataset.originalRowCount}, Cleaned Rows: ${cleanedDataset.cleanedRowCount}\n` +
      `Active Columns: [${cols}]\n` +
      `Quality Score: ${cleanedDataset.qualityScoreAfter}%\n` +
      `Summary of transformations: ${metrics}\n` +
      `Top 3 Sample Rows:\n${preview}`
    );
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          systemInstruction: roleInstructions[systemRole],
          datasetContext: attachDatasetContext ? getDatasetSummary() : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: data.response || 'No response returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `Error: ${err.message || 'Unable to communicate with Gemini.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedPrompts = [
    'How can I extract first and last name from full name in Excel?',
    'Suggest regex to validate international phone numbers.',
    'What are the best strategies to resolve fuzzy duplicates in customer CRM data?'
  ];

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden flex flex-col h-[650px] mb-6">
      {/* Top Configuration Toolbar */}
      <div className="p-3.5 border-b border-purple-100 bg-purple-50/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Gemini DataClean Assistant</h3>
            <span className="text-[11px] text-purple-700">Multi-turn AI Assistant</span>
          </div>
        </div>

        {/* Model Selection and Role Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model picker */}
          <div className="flex items-center space-x-1.5 bg-white border border-purple-200 rounded-lg px-2 py-1">
            <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="text-[11px] font-semibold text-slate-600">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
            </select>
          </div>

          {/* Role selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-purple-200 rounded-lg px-2 py-1">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11px] font-semibold text-slate-600">Role:</span>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as any)}
              className="text-xs bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="architect">Data Architect</option>
              <option value="regex">Formula &amp; Regex Specialist</option>
              <option value="auditor">Anomaly Auditor</option>
              <option value="custom">Custom Persona</option>
            </select>
          </div>

          {/* Context toggle */}
          <button
            type="button"
            onClick={() => setAttachDatasetContext(!attachDatasetContext)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center space-x-1 transition ${
              attachDatasetContext
                ? 'bg-purple-100 text-[#7C3AED] border-purple-300'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Attach current spreadsheet headers, columns, and quality metrics"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>{attachDatasetContext ? 'Dataset Attached' : 'Attach Dataset'}</span>
          </button>

          {/* Clear chat */}
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: 'cleared',
                  role: 'model',
                  text: 'Conversation thread cleared. How can I help you next?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ])
            }
            className="p-1.5 rounded-lg border border-purple-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom role input if custom selected */}
      {systemRole === 'custom' && (
        <div className="px-4 py-2 bg-purple-50/70 border-b border-purple-100">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="Type custom persona instructions for Gemini..."
            className="w-full text-xs bg-white border border-purple-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#26133B] text-purple-200 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs shadow-xs relative group ${
                  isUser
                    ? 'bg-[#7C3AED] text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-purple-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</div>
                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-purple-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-slate-600"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#26133B] text-purple-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-purple-100 rounded-2xl p-3 text-xs text-slate-500 rounded-tl-none flex items-center space-x-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
              <span>Gemini is generating response with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3.5 py-1.5 bg-white border-t border-purple-50 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Try:</span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap transition shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-purple-100 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask Gemini about your spreadsheet (${selectedModel})...`}
          className="flex-1 text-xs bg-purple-50/30 border border-purple-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
