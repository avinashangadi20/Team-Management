import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Clock,
  PhoneCall,
  Award,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet,
  Mail,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Send,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TLDashboardViewProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const TLDashboardView: React.FC<TLDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchRoster, setSearchRoster] = useState('');

  const fetchTLDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTLDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Team Leader Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTLDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Team Operational Matrix...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs text-rose-700 font-medium">{error || 'Unable to retrieve TL data'}</span>
          </div>
          <button
            onClick={fetchTLDashboard}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const roster = (data.agentRoster || []).filter((a: any) =>
    a.full_name.toLowerCase().includes(searchRoster.toLowerCase()) ||
    a.employee_id.toLowerCase().includes(searchRoster.toLowerCase())
  );

  const exceptions = data.recentExceptions || [];
  const coaching = data.recentCoaching || [];
  const activities = data.recentActivities || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-teal-900/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-[11px] font-bold text-teal-300 uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" /> Team Leadership Dashboard &bull; {data.teamName}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {user?.full_name} &bull; Frontline Command
          </h1>
          <p className="text-xs text-teal-200 mt-1.5 max-w-2xl leading-relaxed">
            Active supervision of {data.teamSize} assigned agents. Live productivity monitoring, handling time control, shift attendance reconciliation, exception intervention, and coaching lifecycle management.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('upload-reports')}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Upload Report
          </button>
          <button
            onClick={() => onNavigate('tl-activities')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" /> Log Activity
          </button>
          <button
            onClick={() => onNavigate('feedback-coaching', { action: 'new-coaching' })}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Coaching
          </button>
          <button
            onClick={fetchTLDashboard}
            title="Refresh Metrics"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Team</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{data.teamSize} Agents</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
            {data.presentAgents} Present Today
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Productivity</span>
          <div className="text-2xl font-black text-teal-700 mt-1">{data.avgProductivity}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &ge; 85%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Team Avg AHT</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{data.avgAht}s</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &le; 360s</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Quality</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{data.avgQuality}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &ge; 92%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg CSAT</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{data.avgCsat}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &ge; 88%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exceptions</span>
          <div className={`text-2xl font-black mt-1 ${data.exceptionsCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {data.exceptionsCount} Alerts
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Requires coaching</span>
        </div>
      </div>

      {/* 3. Team Agent Roster & Live Daily Performance Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Team Agent Live Operational Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live scorecards, calls handled, productivity benchmark status, and 1-on-1 coaching triggers.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agent name or ID..."
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Shift &amp; Status</th>
                <th className="py-3 px-4 text-center">Calls</th>
                <th className="py-3 px-4 text-center">Productivity</th>
                <th className="py-3 px-4 text-center">AHT</th>
                <th className="py-3 px-4 text-center">Quality</th>
                <th className="py-3 px-4 text-center">CSAT</th>
                <th className="py-3 px-4 text-center">Adherence</th>
                <th className="py-3 px-4">Exceptions</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((agent: any) => (
                <tr key={agent.employee_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {agent.full_name}
                    <span className="block text-[11px] font-normal text-slate-400">{agent.email}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-semibold">{agent.employee_id}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      agent.attendance_status === 'PRESENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : agent.attendance_status === 'LATE_LOGIN'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {agent.attendance_status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                      {agent.login_time} - {agent.logout_time}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {agent.calls}
                    <span className="block text-[10px] text-slate-400">{agent.connected_calls} conn</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      agent.productivity_pct >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {agent.productivity_pct}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                    {agent.aht}s
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-teal-600">{agent.quality_score}%</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{agent.csat_score}%</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">{agent.adherence_pct}%</td>
                  <td className="py-3.5 px-4">
                    {agent.exceptions && agent.exceptions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {agent.exceptions.map((ex: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                            {ex}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Clean
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onNavigate('feedback-coaching', { employee_id: agent.employee_id, action: 'coach' })}
                        title="Start 1-on-1 Coaching"
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg cursor-pointer"
                      >
                        Coach
                      </button>
                      <button
                        onClick={() => onNavigate('my-profile', { employee_id: agent.employee_id })}
                        title="View 360 Profile"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                      >
                        360&deg;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Required: Performance Exceptions & Coaching Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Exceptions Center */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Performance Exceptions &amp; Threshold Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Threshold violations requiring TL intervention today</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
              {exceptions.length} Alerts
            </span>
          </div>

          <div className="space-y-3">
            {exceptions.length > 0 ? (
              exceptions.map((ex: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-slate-900 font-bold">
                      {ex.employee_name || ex.employee_id} <span className="font-mono text-[10px] text-slate-500">[{ex.employee_id}]</span>
                    </strong>
                    <span className="text-[10px] font-bold text-rose-700">{ex.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(ex.exceptions || []).map((err: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        {err}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onNavigate('feedback-coaching', { employee_id: ex.employee_id, action: 'coach' })}
                      className="text-xs font-bold text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Initiate 1-on-1 Coaching Session &rarr;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-700 font-bold">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Zero exceptions detected for your team today!
              </div>
            )}
          </div>
        </div>

        {/* Coaching & Partner Feedback Status */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" /> Coaching Action Plans &amp; Partner Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Scheduled sessions and follow-ups due</p>
              </div>
              <button
                onClick={() => onNavigate('feedback-coaching')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Center &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Open Partner Feedback</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{data.feedbackPending}</div>
              </div>
              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 text-center">
                <span className="text-[10px] uppercase font-bold text-teal-600">Active Coaching Plans</span>
                <div className="text-2xl font-black text-teal-700 mt-1">{data.coachingPending}</div>
              </div>
            </div>

            <div className="space-y-2">
              {coaching.length > 0 ? (
                coaching.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 font-bold block">{c.employee_id} &bull; {c.focus_area}</strong>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">{c.action_plan}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold uppercase shrink-0">
                      {c.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No active coaching plans currently open.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Record morning briefing or coaching touchpoint</span>
            <button
              onClick={() => onNavigate('tl-activities')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Log Daily TL Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
