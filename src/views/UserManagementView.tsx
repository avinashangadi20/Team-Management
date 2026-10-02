import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit,
  Shield,
  UserCheck,
  AlertCircle,
  Building,
  KeyRound,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { User, Team, UserStatus, Role } from '../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [uRes, tRes] = await Promise.all([
        api.getUsers({
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          team_id: teamFilter || undefined,
          page,
          limit: 20
        }).catch((err) => {
          console.warn('Failed to load users:', err);
          return { users: [], total: 0, page: 1, totalPages: 1 };
        }),
        api.getTeams().catch((err) => {
          console.warn('Failed to load teams:', err);
          return [];
        })
      ]);
      setUsers(uRes?.users || []);
      setTotal(uRes?.total || 0);
      setTeams(Array.isArray(tRes) ? tRes : []);
    } catch (err: any) {
      console.warn('Notice loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, teamFilter, page]);

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      await api.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      mobile: user.mobile,
      designation: user.designation,
      role: user.role,
      team_id: user.team_id || '',
      reporting_tl_id: user.reporting_tl_id || '',
      process: user.process
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSavingEdit(true);
      await api.updateUser(editingUser.id, editFormData);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const statusBadge = (status: UserStatus) => {
    const map: Record<UserStatus, string> = {
      APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse',
      REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
      SUSPENDED: 'bg-slate-100 text-slate-800 border-slate-300',
      DEACTIVATED: 'bg-gray-200 text-gray-700 border-gray-300'
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${map[status]}`}>
        {status}
      </span>
    );
  };

  const teamLeaders = users.filter((u) => u.role === 'TEAM_LEADER' && u.status === 'APPROVED');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Organization Staff &amp; Access Controls</h2>
          <p className="text-xs text-slate-500 mt-1">
            Authorize new user registrations, modify designations, assign reporting TLs, and manage account statuses.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, employee ID, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEAM_LEADER">Team Leader</option>
          <option value="AGENT">Agent</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchUsers}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Role / Designation</th>
                <th className="p-3.5">Team &amp; Process</th>
                <th className="p-3.5">Reporting TL</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const assignedTeam = teams.find((t) => t.id === u.team_id);
                  const assignedTl = users.find((tl) => tl.id === u.reporting_tl_id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {u.employee_id} &bull; {u.email}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{u.designation}</span>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{u.role}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <div>{assignedTeam ? assignedTeam.name : 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400">{u.process}</div>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {assignedTl ? assignedTl.full_name : 'N/A'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{u.date_of_joining}</td>
                      <td className="p-3.5">{statusBadge(u.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'REJECTED')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {u.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'SUSPENDED')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-[11px] cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {u.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[11px] cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                            title="Edit user details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Edit User: {editingUser.full_name} [{editingUser.employee_id}]
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="AGENT">AGENT</option>
                    <option value="TEAM_LEADER">TEAM_LEADER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Team</label>
                  <select
                    value={editFormData.team_id}
                    onChange={(e) => setEditFormData({ ...editFormData, team_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">No Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting TL</label>
                  <select
                    value={editFormData.reporting_tl_id}
                    onChange={(e) => setEditFormData({ ...editFormData, reporting_tl_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">No TL Assigned</option>
                    {teamLeaders.map((tl) => (
                      <option key={tl.id} value={tl.id}>
                        {tl.full_name} ({tl.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Process / Department</label>
                <input
                  type="text"
                  value={editFormData.process}
                  onChange={(e) => setEditFormData({ ...editFormData, process: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save User Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
