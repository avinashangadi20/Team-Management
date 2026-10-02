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
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  UserX,
  Calendar,
  Layers,
  FileSpreadsheet,
  Mail,
  Filter,
  Check,
  X,
  Search,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AdminDashboardViewProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgTab, setOrgTab] = useState<'AM' | 'TL' | 'Team'>('AM');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [approvalActionLoading, setApprovalActionLoading] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Admin Dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApproveReject = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setApprovalActionLoading(userId);
      await api.updateUserStatus(userId, status, `User ${status.toLowerCase()} by Administrator`);
      setApprovalFeedback(`User registration successfully ${status.toLowerCase()}`);
      fetchDashboard();
      setTimeout(() => setApprovalFeedback(null), 4000);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setApprovalActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Compiling Enterprise Organization Intelligence...
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
            <span className="text-xs text-rose-700 font-medium">{error || 'Unable to retrieve admin data'}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data.topKPIs || {};
  const today = data.todayPerformance || {};
  const att = today.attendance || {};
  const repStatus = data.reportStatus || {};
  const fbCoaching = data.feedbackAndCoaching || {};
  const org = data.organizationPerformance || {};

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Admin Organization Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Organization Performance Master
          </h1>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
            Enterprise oversight across Assistant Managers, Team Leaders, frontline operational queues, multi-source ingestion pipelines, and automated performance delivery.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('upload-reports')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Upload Report
          </button>
          <button
            onClick={() => onNavigate('approvals')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer relative"
          >
            <UserCheck className="w-4 h-4" /> Approvals
            {kpis.pendingApprovals > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                {kpis.pendingApprovals}
              </span>
            )}
          </button>
          <button
            onClick={fetchDashboard}
            title="Refresh Metrics"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {approvalFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {approvalFeedback}
        </div>
      )}

      {/* 2. Top 8 KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Organization Core Key Performance Indicators
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">Live Telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: Total Employees */}
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total Staff
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
              {kpis.totalEmployees ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">All active roles</div>
          </div>

          {/* Card 2: Total Agents */}
          <div
            onClick={() => onNavigate('employees')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total Agents
            </span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {kpis.totalAgents ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Frontline ops</div>
          </div>

          {/* Card 3: Total TLs */}
          <div
            onClick={() => onNavigate('tl-management')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Team Leaders
            </span>
            <div className="text-2xl font-black text-teal-600 mt-1">
              {kpis.totalTLs ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Supervisors</div>
          </div>

          {/* Card 4: Total AMs */}
          <div
            onClick={() => onNavigate('am-management')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total AMs
            </span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {kpis.totalAMs ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Assistant Mgrs</div>
          </div>

          {/* Card 5: Total Teams */}
          <div
            onClick={() => onNavigate('teams')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total Teams
            </span>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {kpis.totalTeams ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Operational units</div>
          </div>

          {/* Card 6: Active Users */}
          <div
            onClick={() => onNavigate('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Active Users
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {kpis.activeUsers ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Verified accounts</div>
          </div>

          {/* Card 7: Pending Approvals */}
          <div
            onClick={() => onNavigate('approvals')}
            className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer group ${
              kpis.pendingApprovals > 0
                ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Pending Approvals
            </span>
            <div className={`text-2xl font-black mt-1 ${kpis.pendingApprovals > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {kpis.pendingApprovals ?? 0}
            </div>
            <div className="text-[10px] text-amber-700/80 font-bold mt-1 truncate">Action required &rarr;</div>
          </div>

          {/* Card 8: Reports Uploaded */}
          <div
            onClick={() => onNavigate('upload-reports')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Reports Total
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
              {kpis.reportsUploaded ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">Ingestion runs</div>
          </div>
        </div>
      </div>

      {/* 3. Today's Performance & Attendance Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Today's Performance &amp; Attendance Pulse
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live attendance reconciliation and key quality benchmarks across all frontline staff
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date: {selectedDate}
          </div>
        </div>

        {/* 2 Columns: Attendance Stats + Quality Benchmark Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Attendance Column */}
          <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Attendance Roster Status ({att.totalTracked || 0} Scheduled)
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Present</span>
                <div className="text-xl font-black text-emerald-600 mt-0.5">{att.present || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Absent</span>
                <div className="text-xl font-black text-rose-600 mt-0.5">{att.absent || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">On Leave</span>
                <div className="text-xl font-black text-amber-600 mt-0.5">{att.leave || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Late Login</span>
                <div className="text-xl font-black text-orange-600 mt-0.5">{att.lateLogin || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Early Logout</span>
                <div className="text-xl font-black text-purple-600 mt-0.5">{att.earlyLogout || 0}</div>
              </div>
              <div
                onClick={() => onNavigate('attendance')}
                className="bg-blue-50/80 hover:bg-blue-100/80 p-3 rounded-xl border border-blue-200 text-center flex flex-col justify-center cursor-pointer transition-colors"
              >
                <span className="text-[10px] font-black text-blue-700">Audit Roster</span>
                <span className="text-[10px] text-blue-600 font-semibold">View Details &rarr;</span>
              </div>
            </div>
          </div>

          {/* Quality Benchmarks Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Productivity</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{today.avgProductivity || 89.2}%</div>
              <span className="text-[10px] font-bold text-emerald-600 mt-2">&ge; 85% Target</span>
            </div>

            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Quality</span>
              <div className="text-2xl font-black text-teal-700 mt-1">{today.avgQuality || 94.6}%</div>
              <span className="text-[10px] font-bold text-teal-600 mt-2">&ge; 92% Target</span>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg CSAT</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{today.avgCsat || 91.8}%</div>
              <span className="text-[10px] font-bold text-emerald-600 mt-2">&ge; 88% Target</span>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Adherence</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">{today.avgAdherence || 93.4}%</div>
              <span className="text-[10px] font-bold text-indigo-600 mt-2">&ge; 90% Target</span>
            </div>

            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance</span>
              <div className="text-2xl font-black text-purple-700 mt-1">{today.avgCompliance || 98.4}%</div>
              <span className="text-[10px] font-bold text-purple-600 mt-2">Passed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Organization Performance with AM / TL / Team Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Organization Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-dimensional evaluation by Assistant Manager hierarchy, Team Leaders, and functional teams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Date */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setOrgTab('AM')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  orgTab === 'AM' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By AM
              </button>
              <button
                onClick={() => setOrgTab('TL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  orgTab === 'TL' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By TL
              </button>
              <button
                onClick={() => setOrgTab('Team')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  orgTab === 'Team' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Team
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: By AM */}
        {orgTab === 'AM' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Assistant Manager</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Teams</th>
                  <th className="py-3 px-4">Managed TLs</th>
                  <th className="py-3 px-4">Agents Headcount</th>
                  <th className="py-3 px-4 text-center">Avg Productivity</th>
                  <th className="py-3 px-4 text-center">Avg Quality</th>
                  <th className="py-3 px-4 text-center">Avg CSAT</th>
                  <th className="py-3 px-4 text-center">Avg AHT</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.byAM && org.byAM.length > 0 ? (
                  org.byAM.map((am: any) => (
                    <tr key={am.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {am.name}
                        <span className="block text-[11px] font-normal text-slate-400">{am.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{am.employee_id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{am.teams_count} Teams</td>
                      <td className="py-3.5 px-4 text-slate-700">{am.tls_count} TLs</td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">{am.agents_count} Agents</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{am.avg_productivity}%</td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600">{am.avg_quality}%</td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{am.avg_csat}%</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">{am.avg_aht}s</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('am-management')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg cursor-pointer"
                        >
                          Manage AM &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No Assistant Managers configured. Use 'Add AM' action to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: By TL */}
        {orgTab === 'TL' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Team Leader</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4">Agents Headcount</th>
                  <th className="py-3 px-4">Present Today</th>
                  <th className="py-3 px-4 text-center">Avg Productivity</th>
                  <th className="py-3 px-4 text-center">Avg Quality</th>
                  <th className="py-3 px-4 text-center">Avg CSAT</th>
                  <th className="py-3 px-4 text-center">Avg AHT</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.byTL && org.byTL.map((tl: any) => (
                  <tr key={tl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tl.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{tl.employee_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{tl.team_name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{tl.agents_count} Agents</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{tl.present_count} Present</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{tl.avg_productivity}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{tl.avg_quality}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{tl.avg_csat}%</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{tl.avg_aht}s</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('tl-management')}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg cursor-pointer"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: By Team */}
        {orgTab === 'Team' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Team Leader</th>
                  <th className="py-3 px-4">Assistant Manager</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4 text-center">Avg Productivity</th>
                  <th className="py-3 px-4 text-center">Avg Quality</th>
                  <th className="py-3 px-4 text-center">Avg CSAT</th>
                  <th className="py-3 px-4 text-center">Avg AHT</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.byTeam && org.byTeam.map((team: any) => (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{team.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                        {team.process}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{team.tl_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{team.am_name}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{team.agents_count} Agents</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{team.avg_productivity}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{team.avg_quality}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{team.avg_csat}%</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{team.avg_aht}s</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('teams')}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg cursor-pointer"
                      >
                        Team View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Report Ingestion Status & Feedback & Coaching Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Pipeline Status Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Operational Report Ingestion Pipeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Ingestion health, processing logs, and mapping exceptions</p>
              </div>
              <button
                onClick={() => onNavigate('upload-reports')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Upload Center &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Uploaded</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">{repStatus.reportsUploaded || 0}</div>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Processed</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{repStatus.reportsProcessed || 0}</div>
              </div>
              <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/80 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600">With Errors</span>
                <div className="text-xl font-black text-rose-700 mt-0.5">{repStatus.reportsWithErrors || 0}</div>
              </div>
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600">Unmapped Records</span>
                <div className="text-xl font-black text-amber-700 mt-0.5">{repStatus.unmappedRecords || 0}</div>
              </div>
            </div>

            {/* Recent Upload Runs */}
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Recent Ingestion Logs
            </span>
            <div className="space-y-2">
              {repStatus.latestReports && repStatus.latestReports.length > 0 ? (
                repStatus.latestReports.map((r: any) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <strong className="text-slate-800 font-bold block truncate">{r.file_name}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {r.report_type} &bull; {r.total_rows} rows &bull; Processed: {r.processed_rows}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-100 text-emerald-800 shrink-0">
                      {r.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No operational reports uploaded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Unmapped records require resolution for scorecard parity</span>
            <button
              onClick={() => onNavigate('upload-reports')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Resolve Unmapped ({repStatus.unmappedRecords || 0})
            </button>
          </div>
        </div>

        {/* Feedback & Coaching Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" /> Feedback, Coaching &amp; Escalations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Continuous quality interventions across all departments</p>
              </div>
              <button
                onClick={() => onNavigate('feedback-coaching')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Center &rarr;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Feedback</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">{fbCoaching.totalFeedback || 0}</div>
              </div>
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600">Open Feedback</span>
                <div className="text-xl font-black text-amber-700 mt-0.5">{fbCoaching.openFeedback || 0}</div>
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Closed Feedback</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{fbCoaching.closedFeedback || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600">Pending Coaching</span>
                <div className="text-xl font-black text-blue-700 mt-0.5">{fbCoaching.pendingCoaching || 0}</div>
              </div>
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-600">Follow-ups Due</span>
                <div className="text-xl font-black text-purple-700 mt-0.5">{fbCoaching.pendingFollowUps || 0}</div>
              </div>
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600">Escalations</span>
                <div className="text-xl font-black text-rose-700 mt-0.5">{fbCoaching.escalations || 0}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Monitor partner quality scores and coaching adherence</span>
            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Open Feedback Center
            </button>
          </div>
        </div>
      </div>

      {/* 6. Pending User Approvals Card (If Any) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" /> Pending Registrations Awaiting Admin Approval
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-based security enforcement requires administrator clearance prior to system access
            </p>
          </div>
          <button
            onClick={() => onNavigate('approvals')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Review All Pending &rarr;
          </button>
        </div>

        {data.recentApprovals && data.recentApprovals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.recentApprovals.map((pending: any) => (
              <div key={pending.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">{pending.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {pending.employee_id} &bull; {pending.email} &bull; {pending.designation} (Role: {pending.role})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={approvalActionLoading === pending.id}
                    onClick={() => handleApproveReject(pending.id, 'APPROVED')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    disabled={approvalActionLoading === pending.id}
                    onClick={() => handleApproveReject(pending.id, 'REJECTED')}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-700 block">All Accounts Cleared</span>
            <span className="text-[11px] text-slate-400">There are zero pending user registrations requiring approval.</span>
          </div>
        )}
      </div>

      {/* 7. Admin Quick Actions Grid */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
        <h2 className="text-base font-black tracking-tight text-white mb-1">
          Admin Quick Actions &amp; Operational Controls
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Direct 1-click execution shortcuts for organization management, approvals, teams, reports, and emails
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <button
            onClick={() => onNavigate('users', { action: 'add-user' })}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Add User</span>
          </button>

          <button
            onClick={() => onNavigate('approvals')}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Approve Users</span>
          </button>

          <button
            onClick={() => onNavigate('teams', { action: 'add-team' })}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Add Team</span>
          </button>

          <button
            onClick={() => onNavigate('am-management', { action: 'add-am' })}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Add AM</span>
          </button>

          <button
            onClick={() => onNavigate('tl-management', { action: 'add-tl' })}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Add TL</span>
          </button>

          <button
            onClick={() => onNavigate('upload-reports')}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Upload Report</span>
          </button>

          <button
            onClick={() => onNavigate('employees')}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">View Staff</span>
          </button>

          <button
            onClick={() => onNavigate('emails')}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Send Emails</span>
          </button>
        </div>
      </div>
    </div>
  );
};
