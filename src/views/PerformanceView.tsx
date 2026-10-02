import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  Award,
  Clock,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DailyPerformance, WeeklyPerformance, MonthlyPerformance, KPITarget } from '../types';

export const PerformanceView: React.FC<{ onSelectEmployee?: (empId: string) => void }> = ({ onSelectEmployee }) => {
  const { user, isAdmin, isTL } = useAuth();
  const [viewFreq, setViewFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');

  // Filters
  const [filterDate, setFilterDate] = useState('2026-10-01');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Data State
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPerformance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPerformance[]>([]);
  const [kpis, setKpis] = useState<KPITarget[]>([]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const kpiList = await api.getKPITargets();
      setKpis(kpiList);

      if (viewFreq === 'DAILY') {
        const res = await api.getDailyPerformance({
          date: filterDate,
          employee_id: filterEmpId || undefined
        });
        setDailyData(res);
      } else if (viewFreq === 'WEEKLY') {
        const res = await api.getWeeklyPerformance({
          employee_id: filterEmpId || undefined
        });
        setWeeklyData(res);
      } else {
        const res = await api.getMonthlyPerformance({
          employee_id: filterEmpId || undefined
        });
        setMonthlyData(res);
      }
    } catch (err: any) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [viewFreq, filterDate, filterEmpId]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await api.recalculatePerformance(filterDate);
      await fetchPerformance();
    } catch (err: any) {
      alert(`Recalculation error: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Performance Analytics Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated operational metrics comparing raw productivity, ACD queues, QA audits, and schedule adherence against KPI targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isAdmin || isTL) && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate Rollups
            </button>
          )}

          {/* Frequency Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewFreq('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewFreq === 'DAILY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewFreq('WEEKLY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewFreq === 'WEEKLY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewFreq('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewFreq === 'MONTHLY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        {viewFreq === 'DAILY' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
            />
          </div>
        )}

        {(isAdmin || isTL) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Employee ID:</span>
            <input
              type="text"
              placeholder="e.g. SNB1025"
              value={filterEmpId}
              onChange={(e) => setFilterEmpId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs uppercase font-mono"
            />
          </div>
        )}

        <button
          onClick={fetchPerformance}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg cursor-pointer"
        >
          Apply Filter
        </button>

        {filterEmpId && (
          <button
            onClick={() => setFilterEmpId('')}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DAILY PERFORMANCE TABLE */}
      {/* ------------------------------------------------------------- */}
      {viewFreq === 'DAILY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daily Operational Scorecards ({dailyData.length}) &bull; Date: {filterDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Productivity</th>
                  <th className="p-3.5">AHT</th>
                  <th className="p-3.5">Calls (Conn)</th>
                  <th className="p-3.5">CSAT</th>
                  <th className="p-3.5">Quality</th>
                  <th className="p-3.5">Adherence</th>
                  <th className="p-3.5">Exceptions</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No daily records found for the selected date. Try selecting 2026-10-01 or uploading a report.
                    </td>
                  </tr>
                ) : (
                  dailyData.map((d) => {
                    const hasExceptions = d.exceptions && d.exceptions.length > 0;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{d.employee_name || 'Agent'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{d.employee_id}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{d.team_name || 'N/A'}</td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              d.attendance_status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.attendance_status === 'LATE_LOGIN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.attendance_status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-bold ${
                              d.productivity_pct >= 85
                                ? 'text-emerald-600'
                                : d.productivity_pct >= 75
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {d.productivity_pct}%
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className={d.aht <= 360 ? 'text-emerald-600' : d.aht <= 480 ? 'text-amber-600' : 'text-rose-600'}>
                            {d.aht}s
                          </span>
                        </td>
                        <td className="p-3.5">
                          <strong>{d.calls}</strong> <span className="text-slate-400 font-normal">({d.connected_calls})</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{d.csat_score}%</td>
                        <td className="p-3.5 font-bold text-slate-900">{d.quality_score}%</td>
                        <td className="p-3.5 font-bold text-slate-900">{d.adherence_pct}%</td>
                        <td className="p-3.5 max-w-[200px]">
                          {hasExceptions ? (
                            <div className="flex flex-wrap gap-1">
                              {d.exceptions.map((ex, i) => (
                                <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                  {ex}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">✓ Normal</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {onSelectEmployee && (
                            <button
                              onClick={() => onSelectEmployee(d.employee_id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                            >
                              360 View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. WEEKLY PERFORMANCE TABLE */}
      {/* ------------------------------------------------------------- */}
      {viewFreq === 'WEEKLY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weekly Consolidated Scorecards ({weeklyData.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Week Period</th>
                  <th className="p-3.5">Avg Productivity</th>
                  <th className="p-3.5">Avg AHT</th>
                  <th className="p-3.5">Avg CSAT</th>
                  <th className="p-3.5">Avg Quality</th>
                  <th className="p-3.5">Attendance Rate</th>
                  <th className="p-3.5">Total Calls</th>
                  <th className="p-3.5">Areas Requiring Attention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weeklyData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No weekly rollups recorded.
                    </td>
                  </tr>
                ) : (
                  weeklyData.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{w.employee_name || 'Agent'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{w.employee_id}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {w.week_start} &rarr; {w.week_end}
                      </td>
                      <td className="p-3.5 font-bold text-teal-700">{w.avg_productivity}%</td>
                      <td className="p-3.5 font-bold">{w.avg_aht}s</td>
                      <td className="p-3.5 font-bold">{w.avg_csat}%</td>
                      <td className="p-3.5 font-bold">{w.avg_quality}%</td>
                      <td className="p-3.5 font-bold text-emerald-600">{w.attendance_rate}%</td>
                      <td className="p-3.5 font-bold">{w.total_calls}</td>
                      <td className="p-3.5">
                        {w.areas_requiring_attention && w.areas_requiring_attention.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {w.areas_requiring_attention.map((a, i) => (
                              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">✓ Meets benchmarks</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MONTHLY PERFORMANCE TABLE */}
      {/* ------------------------------------------------------------- */}
      {viewFreq === 'MONTHLY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Monthly Appraisal Scorecards ({monthlyData.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Month/Year</th>
                  <th className="p-3.5">Productivity</th>
                  <th className="p-3.5">AHT</th>
                  <th className="p-3.5">Quality</th>
                  <th className="p-3.5">CSAT</th>
                  <th className="p-3.5">Adherence</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No monthly appraisals recorded.
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{m.employee_name || 'Agent'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{m.employee_id}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">
                        {m.month}/{m.year}
                      </td>
                      <td className="p-3.5 font-bold text-indigo-700">{m.productivity}%</td>
                      <td className="p-3.5 font-bold">{m.aht}s</td>
                      <td className="p-3.5 font-bold">{m.quality}%</td>
                      <td className="p-3.5 font-bold">{m.csat}%</td>
                      <td className="p-3.5 font-bold">{m.adherence}%</td>
                      <td className="p-3.5 font-bold text-emerald-600">{m.attendance_rate}%</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            m.trend === 'UPWARD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.trend === 'STABLE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.trend}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
