import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Terminal, 
  Sliders, 
  RotateCw, 
  ExternalLink, 
  CheckCircle, 
  TrendingDown, 
  PackageX, 
  RefreshCcw,
  Eye,
  ArrowRight
} from 'lucide-react';

const SandboxPlayground = ({ monitors, onCheckNow, onViewDiffs }) => {
  const [sandboxState, setSandboxState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [customPrice, setCustomPrice] = useState('₹1,24,900.00');

  // Find if user already has the sandbox monitor
  const sandboxMonitor = monitors.find(m => m.url.includes('/api/sandbox/page'));

  const fetchState = async () => {
    try {
      const res = await api.get('/sandbox/state');
      if (res.data.success) {
        setSandboxState(res.data.state);
      }
    } catch (err) {
      console.warn('Sandbox state fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleSimulate = async (action, extraData = {}) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.post('/sandbox/simulate-change', { action, ...extraData });
      if (res.data.success) {
        setSandboxState(res.data.state);
        setStatusMsg(res.data.message);
      }
    } catch (err) {
      setStatusMsg('Failed to update sandbox state: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAndInspect = async () => {
    if (!sandboxMonitor) return;
    setLoading(true);
    try {
      await onCheckNow(sandboxMonitor._id);
      // Wait a moment then open diff viewer
      setTimeout(() => {
        onViewDiffs(sandboxMonitor);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Hero */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 bg-white shadow-xs relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-brand-600 font-mono text-xs uppercase tracking-wider mb-2 font-bold">
            <Terminal className="w-4 h-4" />
            <span>Interactive Testing Laboratory</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Live Web Target Sandbox
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Test SiteWatch's scraping and change detection pipelines without waiting for third-party websites. Simulate price changes, stock fluctuations, and content edits, then trigger immediate detection to view side-by-side diffs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simulated Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              <span>Simulate Web Page Updates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleSimulate('price_drop')}
                disabled={loading}
                className="flex items-center space-x-2 p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 active:scale-95 border border-amber-200 text-left text-xs text-amber-900 transition-all font-semibold disabled:opacity-50"
              >
                <TrendingDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Simulate Price Drop</div>
                  <div className="text-[11px] text-amber-700">₹1,49,900 → ₹1,19,900 (Flash Sale)</div>
                </div>
              </button>

              <button
                onClick={() => handleSimulate('out_of_stock')}
                disabled={loading}
                className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50/80 hover:bg-rose-100/90 active:scale-95 border border-rose-200 text-left text-xs text-rose-900 transition-all font-semibold disabled:opacity-50"
              >
                <PackageX className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Simulate Out of Stock</div>
                  <div className="text-[11px] text-rose-700">Inventory depleted</div>
                </div>
              </button>
            </div>

            {/* Custom Input Simulation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mb-4">
              <label className="block text-[11px] font-semibold uppercase text-slate-600">
                Custom Price Override
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="₹1,24,900.00"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-500 shadow-xs"
                />
                <button
                  onClick={() => handleSimulate('custom', { customPrice })}
                  disabled={loading}
                  className="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => handleSimulate('reset')}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-all font-semibold"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Sandbox to Baseline</span>
            </button>

            {statusMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{statusMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Box */}
          <div className="glass-card rounded-2xl p-5 border border-brand-200 bg-brand-50/50 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Verify Change in SiteWatch
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              Trigger an immediate scrape check against the sandbox monitor to calculate the text diff and record a snapshot.
            </p>

            {sandboxMonitor ? (
              <button
                onClick={handleCheckAndInspect}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Trigger Scrape & View Instant Diff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Tip: Add a monitor with URL <code>http://localhost:5000/api/sandbox/page</code> to test it!
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Live Webpage Render Preview */}
        <div className="lg:col-span-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 text-xs">
              <span className="font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Target Page Rendering</span>
              </span>
              <a
                href="http://localhost:5000/api/sandbox/page"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline flex items-center space-x-1 font-medium"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Rendered Product Simulation Card */}
            <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
              {sandboxState ? (
                <div>
                  <span className="inline-block bg-brand-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3 shadow-xs">
                    {sandboxState.badge}
                  </span>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                    {sandboxState.productName}
                  </h3>

                  <div className="p-3 bg-brand-50 border-l-4 border-brand-500 rounded-r-lg text-xs text-brand-900 mb-4 font-medium">
                    {sandboxState.headline}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-xs">
                    <p className="text-2xl font-extrabold text-emerald-700 font-mono">
                      {sandboxState.price}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {sandboxState.stockStatus}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-mono">
                    <p>• NeuralCore X9 Architecture (16 Cores)</p>
                    <p>• 32GB Unified Ultra Memory</p>
                    <p>• 1TB NVMe PCIe 4.0 Storage</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <RotateCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}

              <div className="mt-6 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Revision: v{sandboxState?.revision || 1}</span>
                <span>Last updated: {sandboxState?.lastModified ? new Date(sandboxState.lastModified).toLocaleTimeString() : 'now'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxPlayground;
