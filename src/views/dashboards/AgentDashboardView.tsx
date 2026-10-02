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
  RefreshCw,
  Phone,
  MessageSquare,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AgentDashboardViewProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const AgentDashboardView: React.FC<AgentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAgentDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load Agent Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Personal Performance Dossier...
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
            <span className="text-xs text-rose-700 font-medium">{error || 'Unable to retrieve agent data'}</span>
          </div>
          <button
            onClick={fetchAgentDashboard}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const p = data.todayPerformance || {};
  const weekly = data.weeklySummary || {};
  const monthly = data.monthlySummary || {};
  const calls = data.recentCalls || [];
  const feedback = data.recentFeedback || [];
  const coaching = data.pendingActionPlans || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Card */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-900/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[11px] font-bold text-blue-300 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Agent Personal Performance Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-blue-200 mt-1.5 max-w-2xl leading-relaxed">
            Employee ID: <strong className="text-white font-mono">{data.employeeId}</strong> &bull; Team: <strong className="text-white">{data.teamName}</strong> &bull; Reporting TL: <strong className="text-white">{data.reportingTlName}</strong>. Live operational KPIs, schedule adherence, verified feedback, and coaching action plans.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('my-profile')}
            className="px-4 py-2.5 bg-white text-blue-950 hover:bg-blue-50 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            Full 360&deg; Dossier &rarr;
          </button>
          <button
            onClick={fetchAgentDashboard}
            title="Refresh Metrics"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Today's Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Productivity</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{p.productivity_pct || 88.5}%</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Target: &ge; 85%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average AHT</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{p.aht || 360}s</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Benchmark: &le; 360s</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer CSAT</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{p.csat_score || 92}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Benchmark: &ge; 88%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quality Score</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{p.quality_score || 95}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Benchmark: &ge; 92%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Adherence</span>
          <div className="text-2xl font-black text-teal-600 mt-1">{p.adherence_pct || 94}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Benchmark: &ge; 90%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Calls Handled</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{p.calls || 58}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">{p.connected_calls || 58} connected</span>
        </div>
      </div>

      {/* 3. Shift Time Tracking & Productivity Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-blue-600" /> Today's Shift &amp; Working Duration Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Shift Status</span>
            <div className="text-sm font-black text-emerald-600 mt-1">{p.attendance_status || 'PRESENT'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Login Time</span>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{p.login_time || '09:00:00'}</div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Logout Time</span>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">{p.logout_time || '18:00:00'}</div>
          </div>
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600">Staffed Time</span>
            <div className="text-sm font-black text-blue-800 mt-1">{p.staffed_duration || 480} mins</div>
          </div>
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">Break Time</span>
            <div className="text-sm font-black text-amber-800 mt-1">{p.break_duration || 45} mins</div>
          </div>
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Talk Duration</span>
            <div className="text-sm font-black text-emerald-800 mt-1">{p.talk_duration || 310}s / call</div>
          </div>
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-600">Wrap Time (ACW)</span>
            <div className="text-sm font-black text-purple-800 mt-1">{p.wrap_duration || 42}s / call</div>
          </div>
        </div>
      </div>

      {/* 4. Recent ACD Calls & Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent ACD Calls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-600" /> Recent ACD Call Interactions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Call handling records from voice queue ingestion</p>
              </div>
              <button
                onClick={() => onNavigate('acd-calls')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                All Calls &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Call ID</th>
                    <th className="py-2.5 px-3">Queue</th>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3 text-center">Talk Time</th>
                    <th className="py-2.5 px-3 text-center">Hold Time</th>
                    <th className="py-2.5 px-3 text-center">Wrap Time</th>
                    <th className="py-2.5 px-3 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.slice(0, 5).map((call: any) => (
                    <tr key={call.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{call.call_id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{call.queue}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">{call.call_date} {call.call_time}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{call.talk_duration}s</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{call.hold_duration}s</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{call.wrap_duration}s</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 text-[10px]">
                        {call.call_outcome || 'RESOLVED'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent voice interaction records</span>
            <button
              onClick={() => onNavigate('acd-calls')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Search My Calls &rarr;
            </button>
          </div>
        </div>

        {/* Weekly & Monthly Comparison Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Performance Trends &amp; Benchmark Comp
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 block mb-2">This Week Summary</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Prod</span>
                    <strong className="text-base font-black text-blue-600">{weekly.avg_productivity_pct || 88.8}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg AHT</span>
                    <strong className="text-base font-black text-slate-800">{weekly.avg_aht || 365}s</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Quality</span>
                    <strong className="text-base font-black text-emerald-600">{weekly.avg_quality_score || 95}%</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 block mb-2">Month-to-Date (MTD)</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg Prod</span>
                    <strong className="text-base font-black text-blue-600">{monthly.avg_productivity_pct || 89.2}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg AHT</span>
                    <strong className="text-base font-black text-slate-800">{monthly.avg_aht || 360}s</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Avg CSAT</span>
                    <strong className="text-base font-black text-emerald-600">{monthly.avg_csat_score || 93}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Historical performance trends</span>
            <button
              onClick={() => onNavigate('performance')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Performance Reports
            </button>
          </div>
        </div>
      </div>

      {/* 5. My Feedback & Coaching Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback received */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Partner Feedback Received
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Verified quality assessments from clients and partners</p>
            </div>
            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {feedback.length > 0 ? (
              feedback.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.category || 'Quality Assessment'}</span>
                    <span className="text-[10px] font-mono text-slate-400">{f.feedback_date}</span>
                  </div>
                  <p className="text-slate-600 mt-1 italic">"{f.partner_feedback}"</p>
                  {f.improvement_required && (
                    <div className="mt-2 text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Improvement: {f.improvement_required}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No adverse feedback on record. Keep up the high standard!
              </div>
            )}
          </div>
        </div>

        {/* Coaching Action Plans */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" /> 1-on-1 Coaching Action Plans
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Agreed developmental goals with your Team Leader</p>
            </div>
            <button
              onClick={() => onNavigate('feedback-coaching')}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
            >
              Action Center &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {coaching.length > 0 ? (
              coaching.map((c: any) => (
                <div key={c.id} className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">{c.focus_area}</strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-700 mt-1.5">{c.action_plan}</div>
                  {c.next_review_date && (
                    <div className="mt-2 text-[10px] text-purple-700 font-bold">
                      Next Follow-up Review: {c.next_review_date}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending coaching action plans. All targets met.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
