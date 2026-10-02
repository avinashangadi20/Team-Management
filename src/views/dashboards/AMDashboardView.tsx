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
  Filter,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AMDashboardViewProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const AMDashboardView: React.FC<AMDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabView, setTabView] = useState<'teams' | 'tls' | 'exceptions'>('teams');

  const fetchAMDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAMDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Assistant Manager Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAMDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Aggregating Assistant Manager Portfolio Data...
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
            <span className="text-xs text-rose-700 font-medium">{error || 'Unable to retrieve AM data'}</span>
          </div>
          <button
            onClick={fetchAMDashboard}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = data.topKPIs || {};
  const att = data.todayAttendance || {};
  const teams = data.teamComparison || [];
  const tls = data.tlComparison || [];
  const exceptions = data.exceptions || [];
  const fc = data.feedbackAndCoaching || {};
  const activities = data.recentActivities || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. AM Command Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-900/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Assistant Manager Operations Command
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Operational Portfolio: {user?.full_name}
          </h1>
          <p className="text-xs text-indigo-200 mt-1.5 max-w-2xl leading-relaxed">
            Multi-team supervisory control for {kpis.assignedTeamsCount} teams, {kpis.totalTLsUnderAM} Team Leaders, and {kpis.totalAgentsUnderAM} frontline agents. Performance benchmarks, cross-team consistency, and coaching escalation oversight.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('upload-reports')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Upload Report
          </button>
          <button
            onClick={() => onNavigate('feedback-coaching')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" /> Coaching ({fc.activeCoaching || 0})
          </button>
          <button
            onClick={fetchAMDashboard}
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
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Teams</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{kpis.assignedTeamsCount} Teams</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Active operations</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Managed TLs</span>
          <div className="text-2xl font-black text-teal-600 mt-1">{kpis.totalTLsUnderAM} TLs</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Direct reports</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Managed Agents</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{kpis.totalAgentsUnderAM} Agents</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">{kpis.presentToday} Present today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Group Productivity</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{kpis.avgProductivity}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &ge; 85%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Group Quality Avg</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{kpis.avgQuality}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &ge; 92%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Group Avg AHT</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{kpis.avgAht}s</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Target: &le; 360s</span>
        </div>
      </div>

      {/* 3. Today's Attendance & Operations Roster Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Group Attendance &amp; Exceptions Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live shift reconciliation across all teams reporting to this Assistant Manager
            </p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Attendance Logs &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Headcount</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{att.total || kpis.totalAgentsUnderAM}</div>
          </div>
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Present</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{att.present || 0}</div>
          </div>
          <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600">Absent</span>
            <div className="text-xl font-black text-rose-700 mt-0.5">{att.absent || 0}</div>
          </div>
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">On Leave</span>
            <div className="text-xl font-black text-amber-700 mt-0.5">{att.leave || 0}</div>
          </div>
          <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200 text-center">
            <span className="text-[10px] uppercase font-bold text-orange-600">Late Logins</span>
            <div className="text-xl font-black text-orange-700 mt-0.5">{att.lateLogin || 0}</div>
          </div>
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-600">Early Logouts</span>
            <div className="text-xl font-black text-purple-700 mt-0.5">{att.earlyLogout || 0}</div>
          </div>
        </div>
      </div>

      {/* 4. Portfolio Comparison Tables: Teams vs TLs vs Exceptions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Operational Portfolio Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side performance metrics across operational teams and assigned Team Leaders.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTabView('teams')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tabView === 'teams' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teams Comparison ({teams.length})
            </button>
            <button
              onClick={() => setTabView('tls')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tabView === 'tls' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TL Scorecard ({tls.length})
            </button>
            <button
              onClick={() => setTabView('exceptions')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tabView === 'exceptions' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Exceptions ({exceptions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Teams Comparison Table */}
        {tabView === 'teams' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Team Leader</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4">Present</th>
                  <th className="py-3 px-4 text-center">Productivity</th>
                  <th className="py-3 px-4 text-center">Quality</th>
                  <th className="py-3 px-4 text-center">CSAT</th>
                  <th className="py-3 px-4 text-center">AHT</th>
                  <th className="py-3 px-4 text-center">Exceptions</th>
                  <th className="py-3 px-4 text-center">Open Coaching</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((t: any) => (
                  <tr key={t.team_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.team_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                        {t.process}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{t.tl_name}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{t.headcount} Agents</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{t.present_today} Present</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{t.avg_productivity}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{t.avg_quality}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{t.avg_csat}%</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{t.avg_aht}s</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.exceptions_count > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.exceptions_count} Alerts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-600">{t.active_coaching} Active</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('teams')}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg cursor-pointer"
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

        {/* Tab 2: TL Scorecard */}
        {tabView === 'tls' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Team Leader</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4">Team Size</th>
                  <th className="py-3 px-4 text-center">Team Productivity</th>
                  <th className="py-3 px-4 text-center">Team Quality</th>
                  <th className="py-3 px-4 text-center">Team CSAT</th>
                  <th className="py-3 px-4 text-center">Team AHT</th>
                  <th className="py-3 px-4 text-center">Activities Logged</th>
                  <th className="py-3 px-4 text-center">Coaching Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tls.map((tl: any) => (
                  <tr key={tl.tl_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{tl.tl_name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{tl.employee_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{tl.team_name}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{tl.agents_count} Agents</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{tl.avg_productivity}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">{tl.avg_quality}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{tl.avg_csat}%</td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-700">{tl.avg_aht}s</td>
                    <td className="py-3.5 px-4 text-center font-bold text-purple-600">{tl.activities_count}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{tl.coaching_conducted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Active Exceptions */}
        {tabView === 'exceptions' && (
          <div className="space-y-3">
            {exceptions.length > 0 ? (
              exceptions.map((ex: any, idx: number) => (
                <div key={idx} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900 font-bold">{ex.employee_name || ex.employee_id}</strong>
                      <span className="text-[10px] font-mono text-slate-500">[{ex.employee_id}]</span>
                      <span className="text-[10px] text-slate-400">&bull; Date: {ex.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(ex.exceptions || []).map((msg: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          {msg}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('feedback-coaching', { employee_id: ex.employee_id })}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                  >
                    Escalate Coaching &rarr;
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Zero operational exceptions detected across your assigned teams today!
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. TL Leadership Activities & Coaching Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" /> Recent TL Activities &amp; Huddles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Supervise morning briefs, quality reviews, and TL touchpoints</p>
            </div>
            <button
              onClick={() => onNavigate('tl-activities')}
              className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
            >
              View All Logs &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.length > 0 ? (
              activities.map((a: any) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{a.activity_type}</span>
                    <span className="text-[11px] text-slate-500 block">{a.description}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{a.activity_date}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No recent TL activities logged today.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" /> Group Coaching &amp; Feedback Lifecycle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Resolution cycles and manager escalations</p>
              </div>
              <button
                onClick={() => onNavigate('feedback-coaching')}
                className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Feedback Center &rarr;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Open Feedback</span>
                <div className="text-xl font-black text-amber-700 mt-1">{fc.openFeedback || 0}</div>
              </div>
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-600">Active Coaching</span>
                <div className="text-xl font-black text-purple-700 mt-1">{fc.activeCoaching || 0}</div>
              </div>
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600">Escalations</span>
                <div className="text-xl font-black text-rose-700 mt-1">{fc.escalations || 0}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Ensure quality compliance across your teams</span>
            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Open Coaching Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
