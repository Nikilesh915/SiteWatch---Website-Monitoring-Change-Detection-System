import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import api from './services/api';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import MonitorCard from './components/MonitorCard';
import AddMonitorModal from './components/AddMonitorModal';
import DiffViewerModal from './components/DiffViewerModal';
import SandboxPlayground from './components/SandboxPlayground';
import NotificationDrawer from './components/NotificationDrawer';
import AuthModal from './components/AuthModal';

import { 
  Plus, 
  Search, 
  RotateCw, 
  Globe, 
  Play, 
} from 'lucide-react';

const FILTER_STATUSES = [
  { label: 'All Monitors', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Updated', value: 'changed' },
  { label: 'Paused', value: 'paused' },
  { label: 'Errors', value: 'error' },
];

function App() {
  const { user, isAuthenticated, loading: authLoading, demoLogin } = useAuth();
  
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'sandbox'
  const [monitors, setMonitors] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [checkingIds, setCheckingIds] = useState(new Set());
  const [checkingAll, setCheckingAll] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editMonitor, setEditMonitor] = useState(null);
  const [selectedDiffMonitor, setSelectedDiffMonitor] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMonitors = useCallback(async (quiet = false) => {
    if (!isAuthenticated) return;
    if (!quiet) setLoading(true);

    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedTag !== 'All') params.tag = selectedTag;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await api.get('/monitors', { params });
      if (res.data.success) {
        setMonitors(res.data.data);
        setMetrics(res.data.metrics);
      }

      // Fetch unread notifications count
      const notifRes = await api.get('/notifications?limit=1');
      if (notifRes.data.success) {
        setUnreadAlertsCount(notifRes.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [isAuthenticated, searchQuery, selectedTag, selectedStatus]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // Periodic polling every 12 seconds to catch background cron updates seamlessly
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchMonitors(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchMonitors]);

  // Extract all unique tags
  const allTags = ['All', ...new Set(monitors.flatMap(m => m.tags || []))];

  const handleCheckNow = async (monitorId) => {
    setCheckingIds(prev => new Set(prev).add(monitorId));
    try {
      const res = await api.post(`/monitors/${monitorId}/check`);
      if (res.data.success) {
        const result = res.data.data;
        if (result.status === 'changed') {
          showToast(`Change detected on ${result.monitor.name}`, 'success');
        } else if (result.status === 'error') {
          showToast(`Check failed: ${result.message}`, 'error');
        } else {
          showToast(`Checked ${result.monitor.name}: No changes detected.`, 'info');
        }
        fetchMonitors(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Check failed', 'error');
    } finally {
      setCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(monitorId);
        return next;
      });
    }
  };

  const handleCheckAll = async () => {
    if (monitors.length === 0) return;
    setCheckingAll(true);
    showToast('Executing scraping checks for all active monitors...', 'info');

    try {
      const activeMonitors = monitors.filter(m => m.isActive);
      await Promise.allSettled(
        activeMonitors.map(m => api.post(`/monitors/${m._id}/check`))
      );
      fetchMonitors(true);
      showToast('Finished checking all monitors.', 'success');
    } catch (err) {
      showToast('Error running batch check', 'error');
    } finally {
      setCheckingAll(false);
    }
  };

  const handleToggleStatus = async (monitorId) => {
    try {
      const res = await api.post(`/monitors/${monitorId}/toggle`);
      if (res.data.success) {
        showToast(res.data.message, 'info');
        fetchMonitors(true);
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (monitorId, name) => {
    if (window.confirm(`Are you sure you want to delete monitor "${name}" and all historical snapshots?`)) {
      try {
        await api.delete(`/monitors/${monitorId}`);
        showToast(`Monitor "${name}" deleted`, 'info');
        fetchMonitors(true);
      } catch (err) {
        showToast('Failed to delete monitor', 'error');
      }
    }
  };

  const handleEdit = (monitor) => {
    setEditMonitor(monitor);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddModal={() => {
          setEditMonitor(null);
          setIsAddModalOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-xl border text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-800 shadow-md'
          }`}>
            <span>{toastMessage.msg}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Landing / Hero State for logged-out users */
          <div className="py-12 sm:py-20 text-center max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="inline-flex items-center space-x-2 bg-brand-50 border border-brand-200 px-4 py-1.5 rounded-full text-xs font-mono text-brand-700 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
              <span>Next-Gen Change Detection Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Monitor Any Website.<br />
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Detect Granular Changes.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Automated Cheerio web scraping, line-by-line diff computation, node-cron background scheduling, and instant Nodemailer alerts.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={demoLogin}
                className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-brand-600/25 transition-all"
              >
                <Play className="w-4 h-4 text-white fill-white" />
                <span>Launch Instant Demo with Live Monitors</span>
              </button>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl border border-slate-300 shadow-xs transition-all"
              >
                Sign In / Register
              </button>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-left">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-xs font-mono text-brand-600 font-bold mb-1">Frontend</p>
                <p className="text-sm font-bold text-slate-900">React + Tailwind</p>
                <p className="text-[11px] text-slate-500 mt-1">Interactive diff viewer & stats</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-xs font-mono text-emerald-600 font-bold mb-1">Scraper</p>
                <p className="text-sm font-bold text-slate-900">Axios + Cheerio</p>
                <p className="text-[11px] text-slate-500 mt-1">CSS selectors & SHA256 hashing</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-xs font-mono text-amber-600 font-bold mb-1">Scheduler</p>
                <p className="text-sm font-bold text-slate-900">node-cron</p>
                <p className="text-[11px] text-slate-500 mt-1">Recurring background checks</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-xs font-mono text-purple-600 font-bold mb-1">Alerts</p>
                <p className="text-sm font-bold text-slate-900">Nodemailer</p>
                <p className="text-[11px] text-slate-500 mt-1">HTML email diff reports</p>
              </div>
            </div>
          </div>
        ) : currentTab === 'sandbox' ? (
          /* Sandbox Playground Tab */
          <SandboxPlayground
            monitors={monitors}
            onCheckNow={handleCheckNow}
            onViewDiffs={(mon) => setSelectedDiffMonitor(mon)}
          />
        ) : (
          /* Dashboard Tab */
          <div className="space-y-6">
            
            {/* Top Metrics Cards */}
            <StatsOverview metrics={metrics} totalMonitorsCount={monitors.length} />

            {/* Controls Bar: Search, Tags, Filter, and Add Button */}
            <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search monitors by name or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    {FILTER_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>

                  {/* Batch Check All */}
                  <button
                    onClick={handleCheckAll}
                    disabled={checkingAll || monitors.length === 0}
                    className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
                    title="Scrape and evaluate all active monitors right now"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${checkingAll ? 'animate-spin text-brand-600' : ''}`} />
                    <span className="hidden sm:inline">Check All</span>
                  </button>

                  {/* Add Monitor */}
                  <button
                    onClick={() => {
                      setEditMonitor(null);
                      setIsAddModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Website</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters Pills */}
              {allTags.length > 1 && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Tags:</span>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                        selectedTag === tag
                          ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Monitors Grid */}
            {loading ? (
              <div className="py-24 flex items-center justify-center">
                <RotateCw className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            ) : monitors.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-slate-200 bg-white space-y-4 shadow-xs">
                <Globe className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Monitored Websites Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery || selectedStatus !== 'all' || selectedTag !== 'All'
                    ? 'No monitors match the current search filters. Try clearing your search.'
                    : 'Get started by adding your first URL to monitor. SiteWatch will immediately establish a baseline snapshot.'}
                </p>
                <button
                  onClick={() => {
                    setEditMonitor(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Website</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {monitors.map(monitor => (
                  <MonitorCard
                    key={monitor._id}
                    monitor={monitor}
                    onCheckNow={handleCheckNow}
                    onToggleStatus={handleToggleStatus}
                    onViewDiffs={(mon) => setSelectedDiffMonitor(mon)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isChecking={checkingIds.has(monitor._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={() => fetchMonitors(true)}
        editMonitor={editMonitor}
      />

      <DiffViewerModal
        isOpen={!!selectedDiffMonitor}
        onClose={() => setSelectedDiffMonitor(null)}
        monitor={selectedDiffMonitor}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onRefreshUnread={() => fetchMonitors(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <p>© 2026 SiteWatch • Website Monitoring & Change Detection System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
