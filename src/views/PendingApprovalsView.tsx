import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  UserX,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const PendingApprovalsView: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers({ status: 'PENDING', limit: 100 });
      setPendingUsers(res.users);
    } catch (err: any) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleUpdateStatus = async (userId: string, status: 'APPROVED' | 'REJECTED', name: string) => {
    try {
      setActionLoading(userId);
      await api.updateUserStatus(userId, status, `Registration ${status.toLowerCase()} by Administrator`);
      setActionFeedback(`User ${name} has been ${status.toLowerCase()}!`);
      fetchPending();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = pendingUsers.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Security Clearance &amp; RBAC Verification
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Pending User Approvals ({pendingUsers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            New user registrations require explicit administrator clearance. Unauthorized users cannot sign in.
          </p>
        </div>

        <button
          onClick={fetchPending}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionFeedback}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by name, username, employee ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Applicant Name</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Official Email</th>
                <th className="py-3.5 px-4">Requested Designation</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4 text-right">Approval Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading pending requests...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {u.full_name}
                      <span className="block text-[11px] font-normal text-slate-400">@{u.username}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">{u.employee_id}</td>
                    <td className="py-4 px-4 text-slate-600">{u.email}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{u.designation}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'AM'
                          ? 'bg-indigo-100 text-indigo-800'
                          : u.role === 'TEAM_LEADER' || u.role === 'TL'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'APPROVED', u.full_name)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'REJECTED', u.full_name)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-700 block">No Pending User Approvals</span>
                    <span className="text-[11px] text-slate-400">All registered user accounts have been verified.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
