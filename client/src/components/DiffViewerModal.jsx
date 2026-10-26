import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, 
  History, 
  ExternalLink, 
  Layers, 
  RotateCw, 
  CheckCircle, 
  MailCheck,
  Split,
} from 'lucide-react';

const DiffViewerModal = ({ isOpen, onClose, monitor }) => {
  const [activeTab, setActiveTab] = useState('diffs'); // 'diffs' | 'snapshots'
  const [diffMode, setDiffMode] = useState('unified'); // 'unified' | 'split'
  const [changes, setChanges] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedChange, setSelectedChange] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !monitor) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [changesRes, snapshotsRes] = await Promise.all([
          api.get(`/monitors/${monitor._id}/changes`),
          api.get(`/monitors/${monitor._id}/snapshots`),
        ]);

        if (changesRes.data.success) {
          setChanges(changesRes.data.data);
          if (changesRes.data.data.length > 0) {
            setSelectedChange(changesRes.data.data[0]);
          }
        }

        if (snapshotsRes.data.success) {
          setSnapshots(snapshotsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load monitor history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, monitor]);

  const handleSelectSnapshot = async (snapId) => {
    try {
      const res = await api.get(`/monitors/${monitor._id}/snapshots/${snapId}`);
      if (res.data.success) {
        setSelectedSnapshot(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load snapshot text:', err);
    }
  };

  if (!isOpen || !monitor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200 flex-shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 truncate">{monitor.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200 font-semibold">
                  {changes.length} change event(s)
                </span>
              </div>
              <a
                href={monitor.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:underline flex items-center space-x-1 truncate"
              >
                <span className="truncate">{monitor.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-slate-100/60 text-sm">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('diffs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                activeTab === 'diffs'
                  ? 'bg-white text-brand-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Visual Diff & Change Log ({changes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('snapshots')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                activeTab === 'snapshots'
                  ? 'bg-white text-brand-700 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Snapshot Archive ({snapshots.length})</span>
            </button>
          </div>

          {activeTab === 'diffs' && selectedChange && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">View:</span>
              <button
                onClick={() => setDiffMode('unified')}
                className={`px-2.5 py-1 rounded border font-mono ${
                  diffMode === 'unified' 
                    ? 'bg-white border-slate-300 text-slate-900 font-bold shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Unified
              </button>
              <button
                onClick={() => setDiffMode('split')}
                className={`px-2.5 py-1 rounded border font-mono ${
                  diffMode === 'split' 
                    ? 'bg-white border-slate-300 text-slate-900 font-bold shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <RotateCw className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : activeTab === 'diffs' ? (
            <>
              {/* Left Column: Timeline List of Changes */}
              <div className="w-full md:w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/70 p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2">
                  Change Timeline
                </p>

                {changes.length === 0 ? (
                  <div className="text-center py-8 px-4 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">Baseline captured!</p>
                    <p className="mt-1 text-[11px]">No differences detected yet. When this site updates, line-by-line diffs will record here.</p>
                  </div>
                ) : (
                  changes.map((change) => {
                    const isSelected = selectedChange?._id === change._id;
                    return (
                      <button
                        key={change._id}
                        onClick={() => setSelectedChange(change)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white border-brand-500 shadow-sm'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {new Date(change.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(change.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-semibold truncate mb-2">
                          {change.summary}
                        </p>

                        <div className="flex items-center space-x-2 text-[11px] font-mono">
                          {change.addedLinesCount > 0 && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                              +{change.addedLinesCount} lines
                            </span>
                          )}
                          {change.deletedLinesCount > 0 && (
                            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-semibold">
                              -{change.deletedLinesCount} lines
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Diff Visualizer */}
              <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-xs">
                {selectedChange ? (
                  <div>
                    {/* Header Summary for Selected Change */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-sans font-bold text-slate-900">
                            {selectedChange.summary}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                            {selectedChange.percentageChange}% modified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                          Detected on {new Date(selectedChange.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {selectedChange.notificationSent && (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
                          <MailCheck className="w-3.5 h-3.5" />
                          <span>Email Dispatched</span>
                        </div>
                      )}
                    </div>

                    {/* Diff Chunks Display */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold">Comparison of extracted webpage lines</span>
                        <div className="flex items-center space-x-3 font-semibold">
                          <span className="text-emerald-700">● Added</span>
                          <span className="text-rose-700">● Removed</span>
                          <span className="text-slate-500">● Unchanged</span>
                        </div>
                      </div>

                      <div className="p-3 divide-y divide-slate-100 overflow-x-auto max-h-[500px]">
                        {selectedChange.diffChunks && selectedChange.diffChunks.map((chunk, idx) => {
                          const lines = chunk.content.split('\n').filter(l => l.length > 0);
                          
                          if (chunk.type === 'added') {
                            return lines.map((line, lIdx) => (
                              <div key={`${idx}-${lIdx}`} className="diff-line-added px-3 py-1 flex items-start space-x-2 text-[12px]">
                                <span className="text-emerald-600 font-bold select-none">+</span>
                                <span className="whitespace-pre-wrap break-all">{line}</span>
                              </div>
                            ));
                          }

                          if (chunk.type === 'removed') {
                            return lines.map((line, lIdx) => (
                              <div key={`${idx}-${lIdx}`} className="diff-line-removed px-3 py-1 flex items-start space-x-2 text-[12px]">
                                <span className="text-rose-600 font-bold select-none">-</span>
                                <span className="whitespace-pre-wrap break-all line-through opacity-80">{line}</span>
                              </div>
                            ));
                          }

                          return lines.slice(0, 15).map((line, lIdx) => (
                            <div key={`${idx}-${lIdx}`} className="diff-line-unchanged px-3 py-1 flex items-start space-x-2 text-[12px]">
                              <span className="text-slate-400 select-none"> </span>
                              <span className="whitespace-pre-wrap break-all text-slate-600">{line}</span>
                            </div>
                          ));
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-slate-400 py-12">
                    <p>Select a change event from the timeline to view diff analysis</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Snapshots Archive Tab */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 border-r border-slate-200 overflow-y-auto p-4 space-y-2 bg-slate-50/70">
                <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2">
                  Captured Snapshots ({snapshots.length})
                </p>
                {snapshots.map((snap) => (
                  <button
                    key={snap._id}
                    onClick={() => handleSelectSnapshot(snap._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedSnapshot?._id === snap._id
                        ? 'bg-white border-brand-500 shadow-sm'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-900">
                      <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                      <span className={snap.statusCode === 200 ? 'text-emerald-700' : 'text-amber-700'}>
                        {snap.statusCode} OK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {snap.responseTime}ms latency • {snap.contentLength} chars
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      Hash: {snap.contentHash?.slice(0, 12)}...
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-xs">
                {selectedSnapshot ? (
                  <div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-sans font-bold text-slate-900">{selectedSnapshot.pageTitle || 'Snapshot Data'}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">SHA256: {selectedSnapshot.contentHash}</p>
                      </div>
                      <span className="text-xs text-brand-700 bg-brand-50 px-2 py-1 rounded font-semibold border border-brand-200">
                        {selectedSnapshot.contentLength} characters
                      </span>
                    </div>

                    <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap break-all text-slate-800 font-mono text-xs leading-relaxed max-h-[480px] overflow-y-auto">
                      {selectedSnapshot.extractedText}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-slate-400 py-12">
                    <p>Select any snapshot on the left to read its extracted text</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Target Selector: <code className="text-brand-700 font-semibold">{monitor.selector || 'Full Body'}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffViewerModal;
