import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Award,
  Plus,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  X,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Feedback, Coaching, User } from '../types';

export const FeedbackCoachingView: React.FC = () => {
  const { user, isAdmin, isTL } = useAuth();
  const [activeTab, setActiveTab] = useState<'FEEDBACK' | 'COACHING'>('FEEDBACK');

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [coachingList, setCoachingList] = useState<Coaching[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit / Add Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [fbForm, setFbForm] = useState<any>({
    employee_id: '',
    feedback_date: new Date().toISOString().split('T')[0],
    category: 'Quality',
    score: 85,
    partner_feedback: '',
    tl_observation: '',
    root_cause: '',
    action_taken: '',
    coaching_given: '',
    improvement_required: '',
    follow_up_date: '',
    status: 'OPEN',
    tl_remarks: ''
  });

  // Edit / Add Coaching Modal
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [editingCoaching, setEditingCoaching] = useState<Coaching | null>(null);
  const [coachForm, setCoachForm] = useState<any>({
    employee_id: '',
    issue_identified: '',
    root_cause: '',
    coaching_summary: '',
    action_plan: '',
    follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'SCHEDULED'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fbData, coachData, usersData] = await Promise.all([
        api.getFeedback(),
        api.getCoaching(),
        api.getUsers({ role: 'AGENT', status: 'APPROVED', limit: 100 })
      ]);
      setFeedbackList(fbData);
      setCoachingList(coachData);
      setAgents(usersData.users);
    } catch (err: any) {
      console.error('Failed to load feedback/coaching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddFeedback = () => {
    setEditingFeedback(null);
    setFbForm({
      employee_id: agents[0]?.employee_id || 'SNB1025',
      feedback_date: new Date().toISOString().split('T')[0],
      category: 'Quality',
      score: 85,
      partner_feedback: '',
      tl_observation: '',
      root_cause: '',
      action_taken: '',
      coaching_given: '',
      improvement_required: '',
      follow_up_date: '',
      status: 'OPEN',
      tl_remarks: ''
    });
    setShowFeedbackModal(true);
  };

  const handleOpenEditFeedback = (fb: Feedback) => {
    setEditingFeedback(fb);
    setFbForm({ ...fb });
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFeedback) {
        await api.updateFeedback(editingFeedback.id, fbForm);
      } else {
        await api.createFeedback(fbForm);
      }
      setShowFeedbackModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Feedback save failed: ${err.message}`);
    }
  };

  const handleOpenAddCoaching = (fb?: Feedback) => {
    setEditingCoaching(null);
    setCoachForm({
      employee_id: fb ? fb.employee_id : agents[0]?.employee_id || 'SNB1025',
      feedback_id: fb?.id,
      issue_identified: fb ? `${fb.category} gap: ${fb.partner_feedback.slice(0, 60)}` : '',
      root_cause: fb?.root_cause || '',
      coaching_summary: fb?.coaching_given || '',
      action_plan: fb?.action_taken || '',
      follow_up_date: fb?.follow_up_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'SCHEDULED'
    });
    setShowCoachingModal(true);
  };

  const handleOpenEditCoaching = (c: Coaching) => {
    setEditingCoaching(c);
    setCoachForm({ ...c });
    setShowCoachingModal(true);
  };

  const handleSaveCoaching = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCoaching) {
        await api.updateCoaching(editingCoaching.id, coachForm);
      } else {
        await api.createCoaching(coachForm);
      }
      setShowCoachingModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Coaching save failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Partner Feedback &amp; Coaching Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track external customer satisfaction audits, observe root causes, design targeted action plans, and track follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('FEEDBACK')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'FEEDBACK' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partner Feedback ({feedbackList.length})
            </button>
            <button
              onClick={() => setActiveTab('COACHING')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'COACHING' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Coaching Tracker ({coachingList.length})
            </button>
          </div>

          {(isAdmin || isTL) && (
            <button
              onClick={activeTab === 'FEEDBACK' ? handleOpenAddFeedback : () => handleOpenAddCoaching()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {activeTab === 'FEEDBACK' ? 'Log Feedback' : 'New Coaching Plan'}
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FEEDBACK TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'FEEDBACK' && (
        <div className="space-y-4">
          {feedbackList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No feedback records found.
            </div>
          ) : (
            feedbackList.map((fb) => (
              <div key={fb.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">{fb.employee_name || 'Agent'} [{fb.employee_id}]</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {fb.category}
                    </span>
                    {fb.score !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        Score: {fb.score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">{fb.feedback_date}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        fb.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : fb.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : fb.status === 'IMPROVED'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 italic">
                  &ldquo;{fb.partner_feedback}&rdquo;
                </div>

                {/* TL Management Fields */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">TL Observation</span>
                    <strong>{fb.tl_observation || 'Pending observation'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Root Cause</span>
                    <strong>{fb.root_cause || 'Under investigation'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Action / Coaching Given</span>
                    <strong>{fb.coaching_given || fb.action_taken || 'To be scheduled'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Follow-up Date</span>
                    <strong>{fb.follow_up_date || 'None'}</strong>
                  </div>
                </div>

                {(isAdmin || isTL) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenAddCoaching(fb)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Create Coaching Action Plan
                    </button>
                    <button
                      onClick={() => handleOpenEditFeedback(fb)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Update TL Remarks
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. COACHING TRACKER TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'COACHING' && (
        <div className="space-y-4">
          {/* Coaching Workflow Blueprint Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between overflow-x-auto text-[11px] font-bold">
            <span className="text-slate-400 uppercase text-[10px]">Lifecycle Flow:</span>
            <span>ISSUE IDENTIFIED</span>
            <span className="text-slate-500">&rarr;</span>
            <span>FEEDBACK</span>
            <span className="text-slate-500">&rarr;</span>
            <span>ROOT CAUSE</span>
            <span className="text-slate-500">&rarr;</span>
            <span>COACHING</span>
            <span className="text-slate-500">&rarr;</span>
            <span>ACTION PLAN</span>
            <span className="text-slate-500">&rarr;</span>
            <span>FOLLOW-UP</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-emerald-400">CLOSED</span>
          </div>

          {coachingList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No coaching sessions logged.
            </div>
          ) : (
            coachingList.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.issue_identified}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Agent: <strong>{c.employee_name || 'Agent'} [{c.employee_id}]</strong> &bull; TL: <strong>{c.tl_name || 'Team Leader'}</strong>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded ${
                      c.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Root Cause</span>
                    <p className="text-slate-800">{c.root_cause || 'Identified through QA review'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coaching Summary</span>
                    <p className="text-slate-800">{c.coaching_summary}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block mb-1">Action Plan Agreed</span>
                    <p className="text-slate-800 font-semibold">{c.action_plan}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Follow-up Date: <strong className="text-slate-800 font-mono">{c.follow_up_date}</strong></span>
                  </div>

                  {(isAdmin || isTL) && (
                    <button
                      onClick={() => handleOpenEditCoaching(c)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Update Status &amp; Notes
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                {editingFeedback ? 'Update Partner Feedback & TL Observations' : 'Log New Partner Feedback'}
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-3.5 my-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
                  <select
                    value={fbForm.employee_id}
                    onChange={(e) => setFbForm({ ...fbForm, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.employee_id}>
                        {ag.full_name} ({ag.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Date *</label>
                  <input
                    type="date"
                    required
                    value={fbForm.feedback_date}
                    onChange={(e) => setFbForm({ ...fbForm, feedback_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={fbForm.category}
                    onChange={(e) => setFbForm({ ...fbForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Quality">Quality</option>
                    <option value="Process">Process</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Escalation">Escalation</option>
                    <option value="Customer Satisfaction">Customer Satisfaction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audit Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={fbForm.score ?? ''}
                    onChange={(e) => setFbForm({ ...fbForm, score: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={fbForm.status}
                    onChange={(e) => setFbForm({ ...fbForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="IMPROVED">IMPROVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partner Feedback *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Exact feedback text from partner or QA auditor..."
                  value={fbForm.partner_feedback}
                  onChange={(e) => setFbForm({ ...fbForm, partner_feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TL Observation</label>
                  <textarea
                    rows={2}
                    placeholder="TL assessment of the interaction..."
                    value={fbForm.tl_observation}
                    onChange={(e) => setFbForm({ ...fbForm, tl_observation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Root Cause</label>
                  <textarea
                    rows={2}
                    placeholder="Why did this occur? (e.g. SOP confusion)"
                    value={fbForm.root_cause}
                    onChange={(e) => setFbForm({ ...fbForm, root_cause: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Action / Coaching Given</label>
                  <input
                    type="text"
                    placeholder="Action taken..."
                    value={fbForm.coaching_given || ''}
                    onChange={(e) => setFbForm({ ...fbForm, coaching_given: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={fbForm.follow_up_date || ''}
                    onChange={(e) => setFbForm({ ...fbForm, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Coaching Modal */}
      {showCoachingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                {editingCoaching ? 'Update Coaching Tracker' : 'Initiate Coaching Action Plan'}
              </h3>
              <button onClick={() => setShowCoachingModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoaching} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={coachForm.employee_id}
                  onChange={(e) => setCoachForm({ ...coachForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.employee_id}>
                      {ag.full_name} ({ag.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Identified *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Repeated long hold duration without refresh"
                  value={coachForm.issue_identified}
                  onChange={(e) => setCoachForm({ ...coachForm, issue_identified: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Root Cause</label>
                <input
                  type="text"
                  placeholder="Underlying reason..."
                  value={coachForm.root_cause}
                  onChange={(e) => setCoachForm({ ...coachForm, root_cause: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coaching Summary</label>
                <textarea
                  rows={2}
                  placeholder="Concepts reviewed during 1-on-1 coaching session..."
                  value={coachForm.coaching_summary}
                  onChange={(e) => setCoachForm({ ...coachForm, coaching_summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Plan Agreed *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concrete measurable steps the agent will practice..."
                  value={coachForm.action_plan}
                  onChange={(e) => setCoachForm({ ...coachForm, action_plan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Review Date</label>
                  <input
                    type="date"
                    value={coachForm.follow_up_date}
                    onChange={(e) => setCoachForm({ ...coachForm, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={coachForm.status}
                    onChange={(e) => setCoachForm({ ...coachForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="FOLLOW_UP_PENDING">FOLLOW_UP_PENDING</option>
                    <option value="PERFORMANCE_CHECK">PERFORMANCE_CHECK</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCoachingModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save Coaching Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
