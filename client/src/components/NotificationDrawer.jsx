import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  X, 
  Bell, 
  Mail, 
  CheckCircle, 
  ExternalLink, 
  Send, 
  RotateCw, 
  CheckCheck,
} from 'lucide-react';

const NotificationDrawer = ({ isOpen, onClose, onRefreshUnread }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onRefreshUnread) onRefreshUnread();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTestEmail = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.post('/notifications/test', {});
      if (res.data.success) {
        setTestResult(res.data);
        fetchNotifications();
        if (onRefreshUnread) onRefreshUnread();
      }
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message });
    } finally {
      setTestSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dispatched Alerts</h3>
              <p className="text-[11px] text-slate-500">Nodemailer delivery logs & in-app alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={handleMarkAllRead}
            className="text-slate-600 hover:text-brand-600 flex items-center space-x-1 font-semibold transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>

          <button
            onClick={handleSendTestEmail}
            disabled={testSending}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 transition-all font-semibold disabled:opacity-50"
          >
            {testSending ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
            ) : (
              <Send className="w-3.5 h-3.5 text-brand-600" />
            )}
            <span>Send Test Alert</span>
          </button>
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div className={`mx-6 mt-3 p-3 rounded-xl text-xs border ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <p className="font-semibold">{testResult.message}</p>
            {testResult.previewUrl && (
              <a
                href={testResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center space-x-1 text-emerald-700 underline font-mono text-[11px] font-bold"
              >
                <span>Open Ethereal Mailbox Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RotateCw className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400">
              <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No notifications logged yet.</p>
              <p className="mt-1 text-[11px] text-slate-500">Change alerts will be recorded here when detected.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notif.read
                    ? 'bg-white border-slate-200 text-slate-500'
                    : 'bg-white border-brand-300 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {notif.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mb-2 font-medium">
                  {notif.summary}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                  <span className="truncate max-w-[170px]">To: {notif.recipient}</span>
                  {notif.previewUrl && (
                    <a
                      href={notif.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <span>Preview Email</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
