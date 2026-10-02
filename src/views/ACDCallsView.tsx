import React, { useState, useEffect } from 'react';
import { PhoneCall, Search, Filter, RefreshCw, Calendar, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ACDCall } from '../types';

export const ACDCallsView: React.FC = () => {
  const [calls, setCalls] = useState<ACDCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCallId, setSearchCallId] = useState('');
  const [searchEmpId, setSearchEmpId] = useState('');
  const [queueFilter, setQueueFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const data = await api.getACDCalls({
        call_id: searchCallId || undefined,
        employee_id: searchEmpId || undefined,
        queue: queueFilter || undefined,
        date: dateFilter || undefined
      });
      setCalls(data);
    } catch (err: any) {
      console.error('Failed to load ACD calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [searchCallId, searchEmpId, queueFilter, dateFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">ACD Call Records &amp; Queue Ingestion</h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed call-level telephony interactions, wait times, customer hold durations, after-call work, and disposition outcomes.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Call ID..."
            value={searchCallId}
            onChange={(e) => setSearchCallId(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
          />
        </div>

        <input
          type="text"
          placeholder="Filter Employee ID..."
          value={searchEmpId}
          onChange={(e) => setSearchEmpId(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-mono"
        />

        <select
          value={queueFilter}
          onChange={(e) => setQueueFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Queues</option>
          <option value="Inbound_General">Inbound_General</option>
          <option value="Tech_Escalation">Tech_Escalation</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
        />

        <button
          onClick={fetchCalls}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Call ID</th>
                <th className="p-3.5">Agent Name</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5">Queue / Skill</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Wait</th>
                <th className="p-3.5">Talk Duration</th>
                <th className="p-3.5">Hold</th>
                <th className="p-3.5">ACW</th>
                <th className="p-3.5">Disposition</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    No ACD calls found.
                  </td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{c.call_id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{c.agent_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.employee_id}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      <div>{c.call_date}</div>
                      <div className="text-[10px] text-slate-400">{c.call_time}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{c.queue}</td>
                    <td className="p-3.5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {c.call_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{c.wait_time}s</td>
                    <td className="p-3.5 font-bold text-slate-900">{c.talk_time}s</td>
                    <td className="p-3.5 text-amber-700 font-semibold">{c.hold_time}s</td>
                    <td className="p-3.5 text-slate-500">{c.acw}s</td>
                    <td className="p-3.5 font-semibold text-blue-700">{c.disposition}</td>
                    <td className="p-3.5 text-slate-600 max-w-[200px] truncate" title={c.call_notes}>
                      {c.call_notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
