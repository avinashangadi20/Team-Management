import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, RefreshCw, Filter, CheckCircle2, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Attendance, AttendanceStatus, User } from '../types';

export const AttendanceView: React.FC = () => {
  const { user, isAdmin, isTL } = useAuth();
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Attendance Modal
  const [showModal, setShowModal] = useState(false);
  const [attForm, setAttForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    login_time: '09:00:00',
    logout_time: '18:00:00',
    working_duration: 480,
    break_duration: 45,
    status: 'PRESENT' as AttendanceStatus,
    remarks: 'Shift completed'
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attData, usersData] = await Promise.all([
        api.getAttendance({ date: dateFilter || undefined, status: statusFilter || undefined }).catch((err) => {
          console.warn('Failed to load attendance:', err);
          return [];
        }),
        api.getUsers({ role: 'AGENT', status: 'APPROVED', limit: 100 }).catch((err) => {
          console.warn('Failed to load agents:', err);
          return { users: [], total: 0, page: 1, totalPages: 1 };
        })
      ]);
      setAttendanceList(Array.isArray(attData) ? attData : []);
      const userList = usersData?.users || [];
      setAgents(userList);
      if (userList.length > 0 && !attForm.employee_id) {
        setAttForm((prev) => ({ ...prev, employee_id: userList[0].employee_id }));
      }
    } catch (err: any) {
      console.warn('Notice loading attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, statusFilter]);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logAttendance(attForm);
      setShowModal(false);
      fetchAttendance();
    } catch (err: any) {
      alert(`Attendance logging failed: ${err.message}`);
    }
  };

  const statusBadge = (st: AttendanceStatus) => {
    const map: Record<AttendanceStatus, string> = {
      PRESENT: 'bg-emerald-100 text-emerald-800',
      ABSENT: 'bg-rose-100 text-rose-800',
      LEAVE: 'bg-indigo-100 text-indigo-800',
      WEEK_OFF: 'bg-slate-100 text-slate-700',
      HALF_DAY: 'bg-amber-100 text-amber-800',
      LATE_LOGIN: 'bg-orange-100 text-orange-800 font-bold',
      EARLY_LOGOUT: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${map[st]}`}>
        {st}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Shift Attendance &amp; Adherence Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official check-in logs, punctuality audits, break tracking, and Team Leader reason remarks.
          </p>
        </div>

        {(isAdmin || isTL) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Shift Attendance
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Attendance Statuses</option>
          <option value="PRESENT">PRESENT</option>
          <option value="LATE_LOGIN">LATE_LOGIN</option>
          <option value="EARLY_LOGOUT">EARLY_LOGOUT</option>
          <option value="ABSENT">ABSENT</option>
          <option value="LEAVE">LEAVE</option>
          <option value="HALF_DAY">HALF_DAY</option>
        </select>

        <button
          onClick={fetchAttendance}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Shift Date</th>
                <th className="p-3.5">Login Time</th>
                <th className="p-3.5">Logout Time</th>
                <th className="p-3.5">Working Duration</th>
                <th className="p-3.5">Break Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Remarks / Reasons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendanceList.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{a.employee_name || 'Agent'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{a.employee_id}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{a.date}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">{a.login_time}</td>
                    <td className="p-3.5 font-mono text-slate-600">{a.logout_time}</td>
                    <td className="p-3.5 font-bold">{a.working_duration} mins</td>
                    <td className="p-3.5 text-slate-600">{a.break_duration} mins</td>
                    <td className="p-3.5">{statusBadge(a.status)}</td>
                    <td className="p-3.5 text-slate-600">{a.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Log Shift Attendance</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={attForm.employee_id}
                  onChange={(e) => setAttForm({ ...attForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.employee_id}>
                      {ag.full_name} ({ag.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={attForm.date}
                    onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE_LOGIN">LATE_LOGIN</option>
                    <option value="EARLY_LOGOUT">EARLY_LOGOUT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="LEAVE">LEAVE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login Time</label>
                  <input
                    type="text"
                    value={attForm.login_time}
                    onChange={(e) => setAttForm({ ...attForm, login_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logout Time</label>
                  <input
                    type="text"
                    value={attForm.logout_time}
                    onChange={(e) => setAttForm({ ...attForm, logout_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Reason / notes..."
                  value={attForm.remarks}
                  onChange={(e) => setAttForm({ ...attForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
