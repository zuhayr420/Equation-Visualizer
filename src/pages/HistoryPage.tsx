import React, { useEffect, useState } from 'react';
import {
  History,
  Trash2,
  Download,
  Search,
  Clock,
  Copy,
  Check,
  Calculator,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MathView } from '../components/common/MathView';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ExportService } from '../services/export/exportService';

export const HistoryPage: React.FC = () => {
  const { history, loadHistory, clearHistory, deleteHistoryItem } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.input.toLowerCase().includes(q) ||
      item.result.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <History className="w-4 h-4 text-text-main" />
            Calculation History
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit log of all symbolic and numerical calculations stored in your browser's IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ExportService.exportHistoryCSV(history)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={clearHistory}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Clear All</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter calculations by expression, operation or result..."
          className="w-full rounded-md border border-border bg-panel pl-9 pr-3 py-1.5 text-xs text-text-main placeholder-text-muted/60 focus:border-text-main focus:outline-none focus:ring-1 focus:ring-border"
        />
      </div>

      {/* History Items List */}
      <div className="space-y-2.5">
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center rounded-md border border-dashed border-border p-6">
            <Calculator className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-text-main">No calculations recorded</h3>
            <p className="text-xs text-text-muted mt-0.5 max-w-sm mx-auto">
              Any computations evaluated in the Equation Solver or Calculus Lab are automatically logged here.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-panel p-3.5 transition-colors hover:border-text-muted/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="text-[10px]">
                    {item.category}
                  </Badge>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-text-main overflow-x-auto py-0.5">
                  Input: <span className="text-text-main font-semibold">{item.input}</span>
                </div>

                <div className="overflow-x-auto py-0.5">
                  <span className="text-xs text-text-muted mr-1.5">Result:</span>
                  <MathView math={item.latex || item.result} className="text-xs font-semibold text-text-main" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  onClick={() => handleCopy(item.id, item.result)}
                  className="p-1 rounded-sm hover:bg-border/60 text-text-muted hover:text-text-main transition-colors"
                  title="Copy result"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-text-main" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => deleteHistoryItem(item.id)}
                  className="p-1 rounded-sm hover:bg-panel-hover text-text-muted hover:text-text-main transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
