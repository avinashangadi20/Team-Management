import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Eye, ShieldAlert, Table, ChevronRight, Lock } from 'lucide-react';
import { api } from '../services/api';

export const DatabaseView: React.FC = () => {
  const [activeTable, setActiveTable] = useState<string>('users');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const tables = [
    { key: 'users', label: 'users (Users)' },
    { key: 'employees', label: 'employees (Employee Master)' },
    { key: 'teams', label: 'teams (Operational Units)' },
    { key: 'productivity', label: 'productivity_records (Productivity)' },
    { key: 'acd_calls', label: 'acd_call_records (ACD Calls)' },
    { key: 'feedback', label: 'feedback_records (Feedback)' },
    { key: 'attendance', label: 'attendance_records (Attendance & Adherence)' },
    { key: 'daily_performance', label: 'daily_performance (Performance Rollups)' },
    { key: 'weekly_performance', label: 'weekly_performance (Weekly Rollups)' },
    { key: 'monthly_performance', label: 'monthly_performance (Monthly Rollups)' },
    { key: 'coaching', label: 'coaching_records (Coaching Lifecycles)' },
    { key: 'tl_activities', label: 'tl_activity_records (TL Operations)' },
    { key: 'uploaded_reports', label: 'uploaded_reports (Report Ingestion)' },
    { key: 'kpi_targets', label: 'kpi_targets (KPI Benchmarks)' },
    { key: 'email_logs', label: 'email_logs (Scorecard Transmission)' },
    { key: 'audit_logs', label: 'audit_logs (Immutable Security Trail)' }
  ];

  const fetchTableRecords = async () => {
    try {
      setLoading(true);
      let records: any[] = [];
      if (activeTable === 'users') {
        const res = await api.getUsers({ limit: 100 });
        records = res.users;
      } else if (activeTable === 'employees') {
        const res = await api.getUsers({ role: 'AGENT', limit: 100 });
        records = res.users;
      } else if (activeTable === 'teams') {
        records = await api.getTeams();
      } else if (activeTable === 'productivity') {
        records = await api.getDailyPerformance({});
      } else if (activeTable === 'acd_calls') {
        records = await api.getACDCalls({});
      } else if (activeTable === 'feedback') {
        records = await api.getFeedback({});
      } else if (activeTable === 'attendance') {
        records = await api.getAttendance({});
      } else if (activeTable === 'daily_performance') {
        records = await api.getDailyPerformance({});
      } else if (activeTable === 'weekly_performance') {
        records = await api.getWeeklyPerformance({});
      } else if (activeTable === 'monthly_performance') {
        records = await api.getMonthlyPerformance({});
      } else if (activeTable === 'coaching') {
        records = await api.getCoaching({});
      } else if (activeTable === 'tl_activities') {
        records = await api.getTLActivities();
      } else if (activeTable === 'uploaded_reports') {
        records = await api.getReportHistory();
      } else if (activeTable === 'kpi_targets') {
        records = await api.getKPITargets();
      } else if (activeTable === 'email_logs') {
        records = await api.getEmailLogs();
      } else if (activeTable === 'audit_logs') {
        records = await api.getAuditLogs({});
      }

      setTableData(records);
      setStats((prev) => ({ ...prev, [activeTable]: records.length }));
    } catch (err: any) {
      console.error('Failed to load table records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableRecords();
  }, [activeTable]);

  const filteredData = tableData.filter((item) => {
    if (!search) return true;
    return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Database className="w-4 h-4" /> Relational Database Inspector
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Enterprise Persistence &amp; Storage Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Direct real-time inspection of database entities, schemas, relations, and indexed foreign key references.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Security Notice: Destructive raw operations restricted to root admin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Selector Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Active Tables ({tables.length})
          </div>
          {tables.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTable(t.key);
                setSelectedRecord(null);
                setSearch('');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeTable === t.key
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{t.label}</span>
              {stats[t.key] !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    activeTable === t.key ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {stats[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Records Table & Viewer */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search records in ${activeTable}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <button
              onClick={fetchTableRecords}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Primary Identifier</th>
                    <th className="p-3">Core Reference</th>
                    <th className="p-3">Summary Data</th>
                    <th className="p-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {loading ? 'Querying persistent table...' : 'No records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => {
                      const idVal = row.id || row.employee_id || row.call_id || row.team_id || `rec-${idx}`;
                      const refVal = row.employee_id || row.user_id || row.name || row.call_id || row.username || '-';
                      const summary = Object.entries(row)
                        .filter(([k]) => !['id', 'password_hash', 'content_html'].includes(k))
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ');

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{idVal}</td>
                          <td className="p-3 font-semibold text-blue-700">{refVal}</td>
                          <td className="p-3 text-slate-600 max-w-[320px] truncate">{summary}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedRecord(row)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View JSON
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Entity Record Inspector</h3>
                <p className="text-xs text-slate-500 font-mono">Table: {activeTable}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
