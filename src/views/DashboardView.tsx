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
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading real-time command dashboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error || 'Unable to retrieve dashboard'}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // ADMIN DASHBOARD
  // ------------------------------------------------------------------
  if (data.role === 'ADMIN') {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Banner with Action Center */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Enterprise Administration Console
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Organization Performance &amp; Operations Master
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Cross-functional management for teams, TL leadership, operational ingestion pipelines, and automated performance delivery.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('upload-reports')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> Upload Reports
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" /> Pending Approvals ({data.pendingApprovalsCount})
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Organization Staff</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{data.totalUsers}</div>
            <div className="text-xs text-slate-500 mt-1">
              <strong className="text-emerald-600">{data.activeAgents}</strong> Active Agents &bull; <strong className="text-teal-600">{data.totalTLs}</strong> Team Leaders
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Operational Teams</span>
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{data.totalTeams}</div>
            <div className="text-xs text-slate-500 mt-1">Active business units &amp; processes</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Reports Processed</span>
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{data.reportsUploaded}</div>
            <div className="text-xs text-slate-500 mt-1">
              Multi-source CSV/Excel uploads mapped
            </div>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xs transition-all ${
            data.unmappedRecordsCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Unmapped Records</span>
              <AlertTriangle className={`w-5 h-5 ${data.unmappedRecordsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div className="text-2xl font-black text-slate-900">{data.unmappedRecordsCount}</div>
            <div className="text-xs text-slate-500 mt-1">
              {data.unmappedRecordsCount > 0 ? (
                <button
                  onClick={() => onNavigate('upload-reports')}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Requires employee ID resolution &rarr;
                </button>
              ) : (
                'All employee IDs resolved'
              )}
            </div>
          </div>
        </div>

        {/* Action Pending Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">User Registrations Requiring Approval</h3>
                <p className="text-xs text-slate-500">Security enforcement prevents unauthorized access until approved</p>
              </div>
              <button
                onClick={() => onNavigate('users')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View all ({data.pendingApprovalsCount}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {data.recentApprovals && data.recentApprovals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentApprovals.slice(0, 4).map((u: any) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u.employee_id} &bull; {u.designation} ({u.role})
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('users')}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending user registration requests. All accounts verified.
              </div>
            )}
          </div>

          {/* Upload Pipeline History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recent Operational Ingestion Runs</h3>
                <p className="text-xs text-slate-500">Ingested CSV/Excel files with automated KPI aggregation</p>
              </div>
              <button
                onClick={() => onNavigate('upload-reports')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Upload Center <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {data.latestReports && data.latestReports.length > 0 ? (
              <div className="space-y-2.5">
                {data.latestReports.map((r: any) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="truncate pr-3">
                      <div className="text-xs font-bold text-slate-900 truncate">{r.file_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.report_type} &bull; {r.total_rows} rows &bull; Processed: {r.processed_rows}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No reports uploaded yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // TEAM LEADER DASHBOARD
  // ------------------------------------------------------------------
  if (data.role === 'TEAM_LEADER') {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-teal-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
              <Award className="w-4 h-4" /> Team Leadership Dashboard
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {data.teamName}
            </h2>
            <p className="text-xs text-teal-100 mt-1">
              Active management of {data.teamSize} assigned agents &bull; Punctuality, AHT, Quality, and Coaching Lifecycles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('upload-reports')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" /> Upload Team Report
            </button>
            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Add Coaching Plan
            </button>
          </div>
        </div>

        {/* Team KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Assigned Team Size
            </span>
            <div className="text-2xl font-black text-slate-900">{data.teamSize} Agents</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              {data.presentAgents} Present today
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Avg Productivity
            </span>
            <div className="text-2xl font-black text-teal-700">{data.avgProductivity}%</div>
            <div className="text-xs text-slate-500 mt-1">Target benchmark: &ge; 85%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Team Average AHT
            </span>
            <div className="text-2xl font-black text-slate-900">{data.avgAht}s</div>
            <div className="text-xs text-slate-500 mt-1">Target benchmark: &le; 360s</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Customer CSAT Avg
            </span>
            <div className="text-2xl font-black text-indigo-700">{data.avgCsat}%</div>
            <div className="text-xs text-slate-500 mt-1">Target benchmark: &ge; 88%</div>
          </div>
        </div>

        {/* Action Required: Exceptions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Action Required: Performance Exceptions</h3>
                <p className="text-xs text-slate-500">Threshold violations requiring TL intervention</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {data.exceptionsCount} Alerts
              </span>
            </div>

            {data.recentExceptions && data.recentExceptions.length > 0 ? (
              <div className="space-y-3">
                {data.recentExceptions.map((ex: any) => (
                  <div key={ex.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900">{ex.employee_name} ({ex.employee_id})</strong>
                      <span className="text-[10px] font-bold text-rose-700">{ex.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ex.exceptions.map((err: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          {err}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => onNavigate('feedback-coaching')}
                        className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                      >
                        Initiate 1-on-1 Coaching &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Zero exceptions detected for your team today!
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Pending Coaching &amp; Feedback Follow-ups</h3>
            <p className="text-xs text-slate-500 mb-4">Maintain continuous quality cycles with your team</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xl font-bold text-slate-900">{data.feedbackPending}</div>
                <div className="text-xs text-slate-500 mt-1">Pending Partner Feedback</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-xl font-bold text-slate-900">{data.coachingPending}</div>
                <div className="text-xs text-slate-500 mt-1">Active Coaching Plans</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Open Feedback &amp; Coaching Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // AGENT DASHBOARD
  // ------------------------------------------------------------------
  const p = data.todayPerformance || {};
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            Agent Performance Command Center
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Welcome back, {user?.full_name} [{data.employeeId}]
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            View your operational KPIs, schedule adherence, verified feedback, and coaching action plans.
          </p>
        </div>
        <button
          onClick={() => onNavigate('my-profile')}
          className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          View Full 360&deg; Profile
        </button>
      </div>

      {/* Today's KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Productivity %
          </span>
          <div className="text-2xl font-black text-blue-600">{p.productivity_pct || 88.5}%</div>
          <div className="text-xs text-slate-500 mt-1">Target: &ge; 85%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Handling Time (AHT)
          </span>
          <div className="text-2xl font-black text-slate-900">{p.aht || 370}s</div>
          <div className="text-xs text-slate-500 mt-1">Benchmark: &le; 360s</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Customer CSAT
          </span>
          <div className="text-2xl font-black text-emerald-600">{p.csat_score || 92}%</div>
          <div className="text-xs text-slate-500 mt-1">Benchmark: &ge; 88%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Quality Score
          </span>
          <div className="text-2xl font-black text-indigo-600">{p.quality_score || 95}%</div>
          <div className="text-xs text-slate-500 mt-1">Benchmark: &ge; 92%</div>
        </div>
      </div>

      {/* Two Column Feedback and Action Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Recent Feedback Received</h3>
          <p className="text-xs text-slate-500 mb-4">Official partner audits and Team Leader remarks</p>

          {data.recentFeedback && data.recentFeedback.length > 0 ? (
            <div className="space-y-3">
              {data.recentFeedback.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{f.category} Feedback</span>
                    <span className="text-blue-600">{f.feedback_date}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 italic">&ldquo;{f.partner_feedback}&rdquo;</p>
                  {f.tl_remarks && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <strong>TL Remarks:</strong> {f.tl_remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No feedback entries recorded.</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1">Active Coaching Action Plans</h3>
          <p className="text-xs text-slate-500 mb-4">Development areas assigned by your Team Leader</p>

          {data.pendingActionPlans && data.pendingActionPlans.length > 0 ? (
            <div className="space-y-3">
              {data.pendingActionPlans.map((c: any) => (
                <div key={c.id} className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>{c.issue_identified}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-200">{c.status}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-2">
                    <strong>Action Plan:</strong> {c.action_plan}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Follow-up review date: <strong>{c.follow_up_date}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No pending coaching action items. Excellent consistency!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
