import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Award,
  Plus,
  Edit,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  Mail,
  ShieldCheck,
  ChevronRight,
  PhoneCall,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { User, Team } from '../types';

export const TLManagementView: React.FC = () => {
  const [tls, setTls] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  // Add TL Form
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    email: '',
    employee_id: '',
    mobile: '',
    team_id: '',
    process: 'Inbound Support'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tlsData, teamsData] = await Promise.all([
        api.getTLsOverview().catch(() => []),
        api.getTeams().catch(() => [])
      ]);
      setTls(tlsData);
      setTeams(teamsData);
    } catch (err: any) {
      console.error('Failed to load TL data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTL = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.register({
        ...formData,
        designation: 'Team Leader',
        role: 'TEAM_LEADER',
        date_of_joining: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      setFormData({
        full_name: '',
        username: '',
        password: '',
        email: '',
        employee_id: '',
        mobile: '',
        team_id: '',
        process: 'Inbound Support'
      });
      fetchData();
    } catch (err: any) {
      alert(`Failed to create Team Leader: ${err.message}`);
    }
  };

  const filteredTls = tls.filter((tl) =>
    tl.full_name.toLowerCase().includes(search.toLowerCase()) ||
    tl.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    tl.email.toLowerCase().includes(search.toLowerCase()) ||
    (tl.team_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" /> Frontline Team Leadership Tier
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Team Leader (TL) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage frontline Team Leaders, team assignments, agent rosters, and daily coaching oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Team Leader
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search Team Leaders by name, ID, email or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-xs"
        />
      </div>

      {/* TL Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            Loading Team Leaders...
          </div>
        ) : filteredTls.length > 0 ? (
          filteredTls.map((tl) => (
            <div key={tl.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    Team Leader
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {tl.agent_count} Agents Assigned
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900">{tl.full_name}</h3>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {tl.employee_id} &bull; {tl.email}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Operational Team</span>
                  <strong className="text-xs text-slate-900 block mt-0.5 truncate">{tl.team_name}</strong>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Activities</span>
                    <strong className="text-sm font-black text-purple-700">{tl.activities_count}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Feedback</span>
                    <strong className="text-sm font-black text-indigo-700">{tl.feedback_handled}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Coaching</span>
                    <strong className="text-sm font-black text-emerald-700">{tl.coaching_handled}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Joined {new Date(tl.created_at).toLocaleDateString()}</span>
                <span className="text-teal-600 font-bold">Frontline Lead</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No Team Leaders found matching your search.
          </div>
        )}
      </div>

      {/* Add TL Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-black text-slate-900">Add New Team Leader</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTL} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Verma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="amit.verma"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="tl@performanceteam.corp"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-TL-103"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Team</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Process</label>
                  <input
                    type="text"
                    placeholder="Inbound Support"
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Create Team Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
