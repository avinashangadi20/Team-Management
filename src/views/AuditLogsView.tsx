import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Download } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        username: userFilter || undefined
      });
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, userFilter]);

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Username', 'Role', 'Module', 'Action', 'Record ID', 'New Value', 'IP Address'];
    const rows = logs.map((l) => [
      l.created_at,
      `"${l.username}"`,
      l.role,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.record_id || ''}"`,
      `"${(l.new_value || '').replace(/"/g, '""')}"`,
      l.ip_address
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Security &amp; Operational Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system logs tracing administrative status transitions, TL coaching updates, report ingestions, and IP origins.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Audit Log CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All System Modules</option>
          <option value="Authentication">Authentication</option>
          <option value="User Management">User Management</option>
          <option value="Team Management">Team Management</option>
          <option value="Report Processing">Report Processing</option>
          <option value="Feedback">Feedback</option>
          <option value="Coaching">Coaching</option>
          <option value="Attendance">Attendance</option>
          <option value="Email System">Email System</option>
        </select>

        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
        />

        <input
          type="text"
          placeholder="Filter by username..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
        />

        <button
          onClick={fetchLogs}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Record ID</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-600 font-normal">
                      {new Date(l.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{l.username}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {l.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-blue-700 font-sans">{l.module}</td>
                    <td className="p-3.5 font-bold text-slate-800">{l.action}</td>
                    <td className="p-3.5 text-slate-500">{l.record_id || '-'}</td>
                    <td className="p-3.5 text-slate-500 font-normal">{l.ip_address}</td>
                    <td className="p-3.5 text-slate-600 max-w-[280px] truncate font-normal font-sans" title={l.new_value}>
                      {l.new_value || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
