import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Calendar,
  PhoneCall,
  Mail,
  Shield,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Employee360ViewProps {
  employeeId?: string;
  onBack?: () => void;
}

export const Employee360View: React.FC<Employee360ViewProps> = ({ employeeId: propEmpId, onBack }) => {
  const { user, isAdmin, isTL } = useAuth();
  const targetId = propEmpId || user?.employee_id || 'SNB1025';

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'ACD_CALLS' | 'FEEDBACK' | 'COACHING' | 'ATTENDANCE'>('OVERVIEW');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEmployee360(targetId);
      setProfileData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee 360 dossier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId]);

  const handleSendEmail = async (type: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    try {
      setEmailSending(true);
      setEmailStatusMsg(null);
      const res = await api.sendPerformanceEmail({
        employee_id: targetId,
        report_type: type
      });
      setEmailStatusMsg(res.message);
    } catch (err: any) {
      alert(`Email dispatch error: ${err.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Compiling Employee 360-degree performance record...
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error || 'Profile not accessible.'}
        </div>
      </div>
    );
  }

  const { employee, team, team_leader, daily_performance, weekly_performance, monthly_performance, acd_calls, feedback, coaching, attendance } = profileData;
  const latestDaily = daily_performance && daily_performance.length > 0 ? daily_performance[0] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Button if opened from directory */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Directory
        </button>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-blue-500/20 shrink-0">
              {employee.full_name?.slice(0, 2) || 'AG'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900">{employee.full_name}</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {employee.designation}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {employee.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2 font-medium">
                <span>Employee ID: <strong className="font-mono text-slate-800">{employee.employee_id}</strong></span>
                <span>&bull;</span>
                <span>Email: <strong className="text-slate-800">{employee.email}</strong></span>
                <span>&bull;</span>
                <span>Team: <strong className="text-blue-600">{team ? team.name : 'Unassigned'}</strong></span>
                <span>&bull;</span>
                <span>TL: <strong className="text-slate-800">{team_leader ? team_leader.name : 'N/A'}</strong></span>
                <span>&bull;</span>
                <span>Joined: <strong className="text-slate-800">{employee.date_of_joining}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Email Dispatch for Admin/TL) */}
          {(isAdmin || isTL) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => handleSendEmail('DAILY')}
                disabled={emailSending}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Send Daily Email
              </button>
              <button
                onClick={() => handleSendEmail('WEEKLY')}
                disabled={emailSending}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" /> Send Weekly Email
              </button>
            </div>
          )}
        </div>

        {emailStatusMsg && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailStatusMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Headline Scorecards */}
      {latestDaily ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Productivity</span>
            <div className="text-xl font-black text-blue-600 mt-1">{latestDaily.productivity_pct}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">Target &ge; 85%</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Handle Time</span>
            <div className="text-xl font-black text-slate-900 mt-1">{latestDaily.aht}s</div>
            <span className="text-[10px] text-slate-500 font-semibold">Target &le; 360s</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calls Handled</span>
            <div className="text-xl font-black text-slate-900 mt-1">{latestDaily.calls}</div>
            <span className="text-[10px] text-slate-500 font-semibold">{latestDaily.connected_calls} connected</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer CSAT</span>
            <div className="text-xl font-black text-emerald-600 mt-1">{latestDaily.csat_score}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">Target &ge; 88%</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quality Score</span>
            <div className="text-xl font-black text-indigo-600 mt-1">{latestDaily.quality_score}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">Target &ge; 92%</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Schedule Adherence</span>
            <div className="text-xl font-black text-teal-600 mt-1">{latestDaily.adherence_pct}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">Target &ge; 90%</span>
          </div>
        </div>
      ) : null}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSubTab === 'OVERVIEW' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily &amp; Weekly Trends
        </button>
        <button
          onClick={() => setActiveSubTab('ACD_CALLS')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSubTab === 'ACD_CALLS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ACD Call Records ({acd_calls.length})
        </button>
        <button
          onClick={() => setActiveSubTab('FEEDBACK')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSubTab === 'FEEDBACK' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Partner Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveSubTab('COACHING')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSubTab === 'COACHING' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Coaching &amp; Action Plans ({coaching.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ATTENDANCE')}
          className={`pb-3 transition-colors cursor-pointer ${
            activeSubTab === 'ATTENDANCE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Shift Attendance ({attendance.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Historical Daily Performance Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Productivity</th>
                    <th className="p-3">AHT</th>
                    <th className="p-3">Calls</th>
                    <th className="p-3">CSAT</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3">Adherence</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Exceptions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daily_performance.map((dp: any) => (
                    <tr key={dp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold">{dp.date}</td>
                      <td className="p-3 font-bold text-blue-600">{dp.productivity_pct}%</td>
                      <td className="p-3 font-bold">{dp.aht}s</td>
                      <td className="p-3">{dp.calls} ({dp.connected_calls})</td>
                      <td className="p-3 font-bold text-emerald-600">{dp.csat_score}%</td>
                      <td className="p-3 font-bold">{dp.quality_score}%</td>
                      <td className="p-3 font-bold">{dp.adherence_pct}%</td>
                      <td className="p-3">{dp.attendance_status}</td>
                      <td className="p-3">
                        {dp.exceptions && dp.exceptions.length > 0 ? (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            {dp.exceptions.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">✓ Clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ACD_CALLS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Individual ACD Call Details ({acd_calls.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Call ID</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Queue</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Talk</th>
                  <th className="p-3">Hold</th>
                  <th className="p-3">ACW</th>
                  <th className="p-3">Disposition</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {acd_calls.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">No ACD call records found.</td></tr>
                ) : (
                  acd_calls.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{c.call_id}</td>
                      <td className="p-3 font-mono text-slate-600">{c.call_time}</td>
                      <td className="p-3 text-slate-700">{c.queue}</td>
                      <td className="p-3">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {c.call_status}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{c.talk_time}s</td>
                      <td className="p-3 text-slate-600">{c.hold_time}s</td>
                      <td className="p-3 text-slate-600">{c.acw}s</td>
                      <td className="p-3 font-semibold text-slate-800">{c.disposition}</td>
                      <td className="p-3 text-slate-600 max-w-[250px] truncate" title={c.call_notes}>{c.call_notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'FEEDBACK' && (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No feedback entries found.
            </div>
          ) : (
            feedback.map((fb: any) => (
              <div key={fb.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{fb.category} Feedback</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Score: {fb.score}%
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{fb.feedback_date}</span>
                </div>
                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                  &ldquo;{fb.partner_feedback}&rdquo;
                </div>
                {fb.tl_observation && (
                  <div className="mt-3 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <div><strong>TL Observation:</strong> {fb.tl_observation}</div>
                    <div><strong>Root Cause:</strong> {fb.root_cause || 'Under investigation'}</div>
                    <div><strong>Action Taken:</strong> {fb.action_taken || 'Coaching assigned'}</div>
                    <div><strong>Follow-up Review:</strong> {fb.follow_up_date || 'Scheduled'}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'COACHING' && (
        <div className="space-y-4">
          {coaching.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No coaching sessions logged for this employee.
            </div>
          ) : (
            coaching.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{c.issue_identified}</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {c.status}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-700 space-y-1.5">
                  <div><strong>Summary:</strong> {c.coaching_summary}</div>
                  <div><strong>Action Plan:</strong> {c.action_plan}</div>
                  <div className="text-slate-500">Scheduled Follow-up Review: <strong>{c.follow_up_date}</strong></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'ATTENDANCE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Login</th>
                  <th className="p-3">Logout</th>
                  <th className="p-3">Working Duration</th>
                  <th className="p-3">Break Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">{a.date}</td>
                    <td className="p-3 font-mono">{a.login_time}</td>
                    <td className="p-3 font-mono">{a.logout_time}</td>
                    <td className="p-3 font-bold">{a.working_duration} mins</td>
                    <td className="p-3">{a.break_duration} mins</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{a.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
