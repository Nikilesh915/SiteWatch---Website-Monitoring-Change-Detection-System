import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, 
  Globe, 
  Target, 
  Clock, 
  Mail, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  RotateCw,
} from 'lucide-react';

const PRESET_TAGS = ['Competitor', 'E-Commerce', 'Blog', 'Infrastructure', 'SaaS', 'API', 'News'];

const AddMonitorModal = ({ isOpen, onClose, onSaved, editMonitor = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    selector: '',
    interval: '15m',
    notifyEmail: '',
    notifyEnabled: true,
    ignoreWhitespace: true,
    tags: ['General'],
  });

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editMonitor) {
      setFormData({
        name: editMonitor.name || '',
        url: editMonitor.url || '',
        selector: editMonitor.selector || '',
        interval: editMonitor.interval || '15m',
        notifyEmail: editMonitor.notifyEmail || '',
        notifyEnabled: editMonitor.notifyEnabled !== false,
        ignoreWhitespace: editMonitor.ignoreWhitespace !== false,
        tags: editMonitor.tags && editMonitor.tags.length > 0 ? editMonitor.tags : ['General'],
      });
    } else {
      setFormData({
        name: '',
        url: '',
        selector: '',
        interval: '15m',
        notifyEmail: '',
        notifyEnabled: true,
        ignoreWhitespace: true,
        tags: ['General'],
      });
    }
    setPreviewResult(null);
    setPreviewError(null);
  }, [editMonitor, isOpen]);

  if (!isOpen) return null;

  const handleTestScrape = async () => {
    if (!formData.url) {
      setPreviewError('Please provide a URL to test');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);

    try {
      const res = await api.post('/monitors/preview-scrape', {
        url: formData.url,
        selector: formData.selector,
        ignoreWhitespace: formData.ignoreWhitespace,
      });

      if (res.data.success && res.data.data.success) {
        setPreviewResult(res.data.data);
        if (!formData.name && res.data.data.title) {
          setFormData(prev => ({ ...prev, name: res.data.data.title }));
        }
      } else {
        setPreviewError(res.data.data?.error || 'Failed to extract content');
      }
    } catch (err) {
      setPreviewError(err.response?.data?.message || err.message || 'Scrape test failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleToggleTag = (tag) => {
    setFormData(prev => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;

    setSaving(true);
    try {
      if (editMonitor) {
        await api.put(`/monitors/${editMonitor._id}`, formData);
      } else {
        await api.post('/monitors', formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save monitor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editMonitor ? 'Edit Monitor' : 'Add New Web Page Monitor'}
              </h3>
              <p className="text-xs text-slate-500">Configure URL, CSS selector targeting, and check frequency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Target URL with Live Preview Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Website URL <span className="text-rose-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="https://example.com/pricing"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleTestScrape}
                disabled={previewLoading || !formData.url}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
              >
                {previewLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin text-brand-600" />
                ) : (
                  <Search className="w-4 h-4 text-brand-600" />
                )}
                <span>Test Scrape</span>
              </button>
            </div>
          </div>

          {/* Name & Interval Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Friendly Monitor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe Pricing Plans"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Monitoring Interval
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="1m">Every 1 Minute (High frequency)</option>
                  <option value="5m">Every 5 Minutes (Standard)</option>
                  <option value="15m">Every 15 Minutes (Recommended)</option>
                  <option value="30m">Every 30 Minutes</option>
                  <option value="1h">Every 1 Hour</option>
                  <option value="6h">Every 6 Hours</option>
                  <option value="24h">Once a Day (24 Hours)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CSS Selector Targeting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                CSS Selector Filter (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Leave blank to monitor the entire document</span>
            </div>
            <div className="relative">
              <Target className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. #pricing, .article-content, #main-table"
                value={formData.selector}
                onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Scrape Preview Banner if tested */}
          {previewResult && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Scrape Successful • {previewResult.statusCode} OK • {previewResult.responseTime}ms latency</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-700">{previewResult.contentLength} chars</span>
              </div>
              <p className="text-slate-800 font-semibold truncate">Title: {previewResult.title}</p>
              <div className="max-h-24 overflow-y-auto bg-white p-2 rounded border border-emerald-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                {previewResult.extractedText ? previewResult.extractedText.slice(0, 400) + '...' : '(No text extracted with this selector)'}
              </div>
            </div>
          )}

          {previewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Email Notification Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-slate-800">Email Notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyEnabled}
                  onChange={(e) => setFormData({ ...formData, notifyEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {formData.notifyEnabled && (
              <input
                type="email"
                placeholder="Alert recipient email (defaults to your account email)"
                value={formData.notifyEmail}
                onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Category Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(tag => {
                const isSelected = formData.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-md shadow-brand-600/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editMonitor ? 'Update Monitor' : 'Start Monitoring'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMonitorModal;
