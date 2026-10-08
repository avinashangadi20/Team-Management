import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCw,
  Sliders,
  Calendar,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EmailLog, SystemSettings, User } from '../types';

export const EmailSystemView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Trigger State
  const [triggerType, setTriggerType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [targetEmpId, setTargetEmpId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-10-01');
  const [sending, setSending] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  // Email Preview Modal
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsData, settingsData, usersData] = await Promise.all([
        api.getEmailLogs().catch((err) => {
          console.warn('Failed to load email logs:', err);
          return [];
        }),
        api.getEmailSettings().catch((err) => {
          console.warn('Failed to load email settings:', err);
          return null;
        }),
        api.getUsers({ role: 'AGENT', status: 'APPROVED', limit: 100 }).catch((err) => {
          console.warn('Failed to load agents:', err);
          return { users: [], total: 0, page: 1, totalPages: 1 };
        })
      ]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      if (settingsData) setSettings(settingsData);
      setAgents(usersData?.users || []);
    } catch (err: any) {
      console.warn('Notice loading email system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSetting = async (key: keyof SystemSettings, val: any) => {
    if (!settings) return;
    try {
      const updated = { ...settings, [key]: val };
      setSettings(updated);
      await api.updateEmailSettings({ [key]: val });
    } catch (err: any) {
      alert(`Settings update failed: ${err.message}`);
    }
  };

  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      setDispatchMsg(null);
      const res = await api.sendPerformanceEmail({
        employee_id: targetEmpId || undefined,
        report_type: triggerType,
        target_date: targetDate
      });
      setDispatchMsg(res.message);
      fetchData();
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleRetryEmail = async (logId: string) => {
    try {
      await api.retryEmail(logId);
      fetchData();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Automated Performance Email System</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official performance scorecard generator delivering verified daily, weekly, and monthly appraisal emails directly to registered agent inboxes.
          </p>
        </div>
      </div>

      {/* Admin Settings & Dispatch Controls */}
      {isAdmin && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Automated Schedule Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-blue-600" /> Automated Schedules
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Daily Performance Email</div>
                  <div className="text-[11px] text-slate-500">Dispatches at {settings.email_send_hour}:00 daily</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.daily_email_enabled}
                  onChange={(e) => handleToggleSetting('daily_email_enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Weekly Scorecard Email</div>
                  <div className="text-[11px] text-slate-500">Dispatches Friday EOD</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weekly_email_enabled}
                  onChange={(e) => handleToggleSetting('weekly_email_enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Monthly Appraisal Report</div>
                  <div className="text-[11px] text-slate-500">Dispatches 1st of every month</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.monthly_email_enabled}
                  onChange={(e) => handleToggleSetting('monthly_email_enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Manual Dispatch Trigger Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              <Send className="w-4 h-4 text-blue-600" /> Manual / Immediate Dispatch Trigger
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Trigger instant email report compilation and transmission to an individual agent or the entire approved organization.
            </p>

            {dispatchMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dispatchMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualDispatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Frequency</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="DAILY">Daily Performance Report</option>
                    <option value="WEEKLY">Weekly Performance Scorecard</option>
                    <option value="MONTHLY">Monthly Appraisal Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Agent</label>
                  <select
                    value={targetEmpId}
                    onChange={(e) => setTargetEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="">All Approved Agents (Batch Send)</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.employee_id}>
                        {ag.full_name} [{ag.employee_id}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? 'Dispatching...' : 'Dispatch Performance Email Now'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Transmission Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Performance Email Delivery Logs ({logs.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Agents receive strictly their own performance metrics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Recipient Official Email</th>
                <th className="p-3.5">Employee ID</th>
                <th className="p-3.5">Report Type</th>
                <th className="p-3.5">Email Subject Line</th>
                <th className="p-3.5">Sent Timestamp</th>
                <th className="p-3.5">Delivery Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No email logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{log.recipient_email}</td>
                    <td className="p-3.5 font-mono text-slate-600">{log.employee_id}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {log.report_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-800 max-w-[280px] truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(log.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          log.delivery_status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.delivery_status === 'RETRY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview HTML
                        </button>
                        {log.delivery_status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryEmail(log.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rendered HTML Email Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Rendered Email Scorecard Preview</h3>
                <p className="text-xs text-slate-500 font-mono">To: {previewLog.recipient_email} &bull; Subject: {previewLog.subject}</p>
              </div>
              <button onClick={() => setPreviewLog(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div
                className="bg-white rounded-xl shadow-xs overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewLog.content_html }}
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setPreviewLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
