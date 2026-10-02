import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Award,
  Plus,
  Edit,
  ArrowRightLeft,
  CheckCircle2,
  X,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import { Team, User } from '../types';

export const TeamManagementView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tls, setTls] = useState<any[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Create / Edit Team Modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', process: 'Inbound Support', description: '', tl_id: '' });

  // Move / Assign Agents Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, tlsData, usersData] = await Promise.all([
        api.getTeams(),
        api.getTLsOverview(),
        api.getUsers({ role: 'AGENT', status: 'APPROVED', limit: 100 })
      ]);
      setTeams(teamsData);
      setTls(tlsData);
      setAgents(usersData.users);
    } catch (err: any) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', process: 'Inbound Support', description: '', tl_id: '' });
    setShowTeamModal(true);
  };

  const handleOpenEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      process: team.process,
      description: team.description,
      tl_id: team.tl_id || ''
    });
    setShowTeamModal(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.updateTeam(editingTeam.id, teamForm);
      } else {
        await api.createTeam(teamForm);
      }
      setShowTeamModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Team save failed: ${err.message}`);
    }
  };

  const handleOpenAssignAgents = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSelectedAgentIds([]);
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedTeamId || selectedAgentIds.length === 0) return;
    try {
      await api.assignAgentsToTeam(selectedTeamId, selectedAgentIds);
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Teams &amp; Leadership Structures</h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize operational units, assign responsible Team Leaders, and manage agent rosters.
          </p>
        </div>
        <button
          onClick={handleOpenCreateTeam}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {team.process}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {team.status}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">{team.name}</h3>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{team.description}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Team Leader</span>
                  <strong className="text-slate-800">{team.tl_name || 'Unassigned'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Agents</span>
                  <strong className="text-blue-600 font-bold">{team.agent_count || 0} Members</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenAssignAgents(team.id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Move / Assign Agents
              </button>
              <button
                onClick={() => handleOpenEditTeam(team)}
                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg cursor-pointer"
                title="Edit Team"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* TL Directory & Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Team Leader Management &amp; Oversight Directory
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Team Leader</th>
                <th className="p-3.5">Assigned Team</th>
                <th className="p-3.5">Team Size</th>
                <th className="p-3.5">TL Activities Logged</th>
                <th className="p-3.5">Feedback Handled</th>
                <th className="p-3.5">Coaching Handled</th>
                <th className="p-3.5">Reports Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tls.map((tl) => (
                <tr key={tl.id} className="hover:bg-slate-50">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{tl.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{tl.employee_id} &bull; {tl.email}</div>
                  </td>
                  <td className="p-3.5 font-bold text-blue-600">{tl.team_name}</td>
                  <td className="p-3.5 font-bold">{tl.agent_count} Agents</td>
                  <td className="p-3.5 font-bold text-slate-800">{tl.activities_count}</td>
                  <td className="p-3.5 font-bold text-teal-700">{tl.feedback_handled}</td>
                  <td className="p-3.5 font-bold text-indigo-700">{tl.coaching_handled}</td>
                  <td className="p-3.5 font-bold text-emerald-700">{tl.reports_uploaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                {editingTeam ? 'Edit Operational Team' : 'Create Operational Team'}
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Team Gamma - Retention"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Process / Skill</label>
                <input
                  type="text"
                  value={teamForm.process}
                  onChange={(e) => setTeamForm({ ...teamForm, process: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Team Leader</label>
                <select
                  value={teamForm.tl_id}
                  onChange={(e) => setTeamForm({ ...teamForm, tl_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="">No TL Assigned</option>
                  {tls.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.full_name} ({tl.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Agents Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Assign Agents to Team
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <p className="text-xs text-slate-500">
                Select the agents you wish to assign or move to this team:
              </p>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {agents.map((ag) => {
                  const isChecked = selectedAgentIds.includes(ag.employee_id);
                  return (
                    <label key={ag.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAgentIds([...selectedAgentIds, ag.employee_id]);
                          } else {
                            setSelectedAgentIds(selectedAgentIds.filter((id) => id !== ag.employee_id));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-900">{ag.full_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono ml-2">[{ag.employee_id}]</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedAgentIds.length === 0}
                onClick={handleConfirmAssign}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                Assign {selectedAgentIds.length} Agents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
