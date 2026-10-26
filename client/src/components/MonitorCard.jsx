import React from 'react';
import { 
  ExternalLink, 
  Clock, 
  RotateCw, 
  History, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Target
} from 'lucide-react';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Never checked';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const MonitorCard = ({ 
  monitor, 
  onCheckNow, 
  onToggleStatus, 
  onViewDiffs, 
  onEdit, 
  onDelete,
  isChecking = false 
}) => {
  const getStatusBadge = () => {
    if (!monitor.isActive) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>Paused</span>
        </span>
      );
    }

    if (monitor.status === 'checking' || isChecking) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <RotateCw className="w-3 h-3 animate-spin text-indigo-600" />
          <span>Scraping...</span>
        </span>
      );
    }

    if (monitor.status === 'changed') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>Updated</span>
        </span>
      );
    }

    if (monitor.status === 'error') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-500" />
          <span>Error</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Monitoring</span>
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white flex flex-col justify-between relative group hover:border-brand-400 shadow-xs hover:shadow-md transition-all duration-300">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
              {monitor.name}
            </h4>

            <a 
              href={monitor.url} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-brand-600 flex items-center space-x-1 truncate mt-0.5"
              title={monitor.url}
            >
              <span className="truncate">{monitor.url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70" />
            </a>
          </div>

          <div className="flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Tags & CSS Selector */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {monitor.selector ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
              <Target className="w-3 h-3 text-indigo-500" />
              <span className="truncate max-w-[130px]">{monitor.selector}</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Full Document
            </span>
          )}

          <span className="inline-flex items-center space-x-1 text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Every {monitor.interval}</span>
          </span>

          {monitor.tags && monitor.tags.map((tag, i) => (
            <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* Error notice if present */}
        {monitor.status === 'error' && monitor.errorMessage && (
          <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="truncate">{monitor.errorMessage}</span>
          </div>
        )}

        {/* Vital Metrics Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Response</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
              {monitor.lastResponseTime ? `${monitor.lastResponseTime}ms` : '—'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Status</p>
            <p className={`text-xs font-bold mt-0.5 font-mono ${
              monitor.lastStatusCode === 200 ? 'text-emerald-600' : 'text-slate-700'
            }`}>
              {monitor.lastStatusCode ? `${monitor.lastStatusCode} OK` : '—'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Changes</p>
            <p className="text-xs font-bold text-amber-600 mt-0.5 font-mono">
              {monitor.changeCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          Checked: <strong className="text-slate-700 font-semibold">{formatTimeAgo(monitor.lastCheckedAt)}</strong>
        </span>

        <div className="flex items-center space-x-1.5">
          {/* Check Now Trigger */}
          <button
            onClick={() => onCheckNow(monitor._id)}
            disabled={isChecking || monitor.status === 'checking'}
            className="flex items-center space-x-1 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-all disabled:opacity-50 font-medium"
            title="Trigger Immediate Scrape"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Check</span>
          </button>

          {/* View Diffs & History */}
          <button
            onClick={() => onViewDiffs(monitor)}
            className="flex items-center space-x-1 bg-brand-50 hover:bg-brand-100 active:scale-95 text-brand-700 text-xs px-2.5 py-1.5 rounded-lg border border-brand-200 transition-all font-semibold"
            title="Inspect Visual Diffs & Snapshots"
          >
            <History className="w-3.5 h-3.5 text-brand-600" />
            <span>Diffs</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => onToggleStatus(monitor._id)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              monitor.isActive 
                ? 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50' 
                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
            title={monitor.isActive ? 'Pause Monitoring' : 'Resume Monitoring'}
          >
            {monitor.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(monitor)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
            title="Edit Monitor"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(monitor._id, monitor.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
            title="Delete Monitor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitorCard;
