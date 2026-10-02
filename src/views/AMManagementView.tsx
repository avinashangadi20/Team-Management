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
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { User, Team } from '../types';

export const AMManagementView: React.FC = () => {
  const [ams, setAms] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAm, setSelectedAm] = useState<any | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [search, setSearch] = useState('');

  // Add AM Form
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    email: '',
    employee_id: '',
    mobile: '',
    process: 'Customer Operations'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [amsData, teamsData] = await Promise.all([
        api.getAMsOverview().catch(() => []),
        api.getTeams().catch(() => [])
      ]);
      setAms(amsData);
      setTeams(teamsData);
    } catch (err: any) {
      console.error('Failed to load AM management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.register({
        ...formData,
        designation: 'Assistant Manager',
        role: 'AM',
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
        process: 'Customer Operations'
      });
      fetchData();
    } catch (err: any) {
      alert(`Failed to create AM: ${err.message}`);
    }
  };

  const handleAssignTeamToAM = async () => {
    if (!selectedAm || !selectedTeamId) return;
    try {
      await api.updateTeam(selectedTeamId, { am_id: selectedAm.id });
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Failed to assign team: ${err.message}`);
    }
  };

  const filteredAms = ams.filter((am) =>
    am.full_name.toLowerCase().includes(search.toLowerCase()) ||
    am.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    am.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Middle Management Leadership Tier
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Assistant Manager (AM) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise Assistant Managers, their multi-team ownership, and reporting Team Leaders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Assistant Manager
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
          placeholder="Search Assistant Managers by name, ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* AM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
            Loading Assistant Managers...
          </div>
        ) : filteredAms.length > 0 ? (
          filteredAms.map((am) => (
            <div key={am.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Assistant Manager
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{am.full_name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {am.employee_id} &bull; {am.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAm(am);
                      setSelectedTeamId('');
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Assign Team
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mb-4 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Teams</span>
                    <div className="text-lg font-black text-indigo-700">{am.teams_count}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Managed TLs</span>
                    <div className="text-lg font-black text-teal-600">{am.tls_count}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Agents</span>
                    <div className="text-lg font-black text-blue-600">{am.agents_count}</div>
                  </div>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Managed Teams ({am.teams ? am.teams.length : 0})
                </span>
                <div className="space-y-1.5">
                  {am.teams && am.teams.length > 0 ? (
                    am.teams.map((t: Team) => (
                      <div key={t.id} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{t.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
                          {t.process}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No operational teams assigned yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Joined {new Date(am.created_at).toLocaleDateString()}</span>
                <span className="text-emerald-600 font-bold">Active Supervisor</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No Assistant Managers found matching your search.
          </div>
        )}
      </div>

      {/* Add AM Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-black text-slate-900">Add New Assistant Manager</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAM} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="vikram.malhotra"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="am@performanceteam.corp"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-AM-002"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+1-555-0100"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Process / Division</label>
                  <input
                    type="text"
                    placeholder="Customer Operations"
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Create Assistant Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {showAssignModal && selectedAm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-900">
                Assign Team to {selectedAm.full_name}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select an operational team to place under the leadership and supervisory umbrella of this Assistant Manager.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Operational Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.process})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedTeamId}
                  onClick={handleAssignTeamToAM}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
