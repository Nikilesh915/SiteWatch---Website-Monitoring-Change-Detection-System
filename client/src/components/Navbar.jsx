import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  Bell, 
  Plus, 
  LogOut, 
  Play, 
  Layers, 
  Activity, 
  Terminal,
  ShieldCheck
} from 'lucide-react';

const Navbar = ({ 
  currentTab, 
  setCurrentTab, 
  onOpenAddModal, 
  onOpenNotifications, 
  unreadAlertsCount = 0,
  onOpenAuthModal 
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                    Site<span className="text-brand-600">Watch</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Website Monitoring & Change Detection</p>
              </div>
            </button>

            {/* Navigation Tabs */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'dashboard'
                      ? 'bg-slate-100 text-brand-700 border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-brand-600" />
                  <span>Monitors & Stats</span>
                </button>

                <button
                  onClick={() => setCurrentTab('sandbox')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'sandbox'
                      ? 'bg-slate-100 text-brand-700 border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span>Interactive Sandbox</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">Live</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-3">
            {/* Scheduler Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-mono text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">Cron Scheduler Active</span>
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                  title="View Dispatched Alerts & Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                      {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                    </span>
                  )}
                </button>

                {/* Add Monitor Button */}
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg shadow-sm shadow-brand-600/20 transition-all transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Website</span>
                </button>

                {/* User Info & Logout */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={demoLogin}
                  className="flex items-center space-x-1.5 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  <Play className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
                  <span>Instant Demo</span>
                </button>

                <button
                  onClick={onOpenAuthModal}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
