import React, { useState, useEffect } from 'react';
import { Award, Plus, RefreshCw, Clock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TLActivity, User } from '../types';

export const TLActivitiesView: React.FC = () => {
  const { user, isAdmin, isTL } = useAuth();
  const [activities, setActivities] = useState<TLActivity[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Activity Modal
  const [showModal, setShowModal] = useState(false);
  const [actForm, setActForm] = useState({
    activity_type: 'Team Huddle',
    activity_date: new Date().toISOString().split('T')[0],
    activity_time: new Date().toTimeString().slice(0, 5),
    employee_id: '',
    description: '',
    status: 'Completed',
    remarks: ''
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [actData, usersData] = await Promise.all([
        api.getTLActivities().catch((err) => {
          console.warn('Failed to load TL activities:', err);
          return [];
        }),
        api.getUsers({ role: 'AGENT', status: 'APPROVED', limit: 100 }).catch((err) => {
          console.warn('Failed to load agents:', err);
          return { users: [], total: 0, page: 1, totalPages: 1 };
        })
      ]);
      setActivities(Array.isArray(actData) ? actData : []);
      setAgents(usersData?.users || []);
    } catch (err: any) {
      console.warn('Notice loading TL activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTLActivity(actForm);
      setShowModal(false);
      setActForm({
        activity_type: 'Team Huddle',
        activity_date: new Date().toISOString().split('T')[0],
        activity_time: new Date().toTimeString().slice(0, 5),
        employee_id: '',
        description: '',
        status: 'Completed',
        remarks: ''
      });
      fetchActivities();
    } catch (err: any) {
      alert(`Failed to save activity: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Team Leader Operations Log</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official operational leadership tracker recording team huddles, coaching sessions, agent follow-ups, and escalations.
          </p>
        </div>

        {(isAdmin || isTL) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Leadership Activity
          </button>
        )}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Activity Type</th>
                <th className="p-3.5">Team Leader</th>
                <th className="p-3.5">Agent Concerned</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No TL activities recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">{a.activity_type}</span>
                    </td>
                    <td className="p-3.5 text-slate-800 font-semibold">{a.tl_name || 'Team Leader'}</td>
                    <td className="p-3.5 text-slate-700">
                      {a.employee_name ? `${a.employee_name} [${a.employee_id}]` : 'Entire Team'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      <div>{a.activity_date}</div>
                      <div className="text-[10px] text-slate-400">{a.activity_time}</div>
                    </td>
                    <td className="p-3.5 text-slate-800 max-w-[280px]">{a.description}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-[180px] truncate" title={a.remarks}>
                      {a.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Log TL Leadership Activity</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type *</label>
                <select
                  value={actForm.activity_type}
                  onChange={(e) => setActForm({ ...actForm, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Team Huddle">Team Huddle</option>
                  <option value="Coaching Session">Coaching Session</option>
                  <option value="Feedback Given">Feedback Given</option>
                  <option value="Agent Follow-up">Agent Follow-up</option>
                  <option value="Escalation">Escalation</option>
                  <option value="Performance Review">Performance Review</option>
                  <option value="Corrective Action">Corrective Action</option>
                  <option value="Report Upload">Report Upload</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agent (Optional)</label>
                <select
                  value={actForm.employee_id}
                  onChange={(e) => setActForm({ ...actForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">Entire Team / General</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.employee_id}>
                      {ag.full_name} ({ag.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={actForm.activity_date}
                    onChange={(e) => setActForm({ ...actForm, activity_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={actForm.activity_time}
                    onChange={(e) => setActForm({ ...actForm, activity_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Key topics, takeaways, or actions discussed..."
                  value={actForm.description}
                  onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Outcome</label>
                <input
                  type="text"
                  placeholder="Outcome notes..."
                  value={actForm.remarks}
                  onChange={(e) => setActForm({ ...actForm, remarks: e.target.value })}
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
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
