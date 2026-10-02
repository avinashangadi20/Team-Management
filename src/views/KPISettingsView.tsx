import React, { useState, useEffect } from 'react';
import { Sliders, Edit, Plus, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { KPITarget } from '../types';

export const KPISettingsView: React.FC = () => {
  const [kpis, setKpis] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit KPI modal
  const [editingKpi, setEditingKpi] = useState<KPITarget | null>(null);
  const [kpiForm, setKpiForm] = useState<any>({});

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const data = await api.getKPITargets();
      setKpis(data);
    } catch (err: any) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleOpenEdit = (k: KPITarget) => {
    setEditingKpi(k);
    setKpiForm({ ...k });
  };

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKpi) return;
    try {
      await api.updateKPITarget(editingKpi.id, kpiForm);
      setEditingKpi(null);
      fetchKpis();
    } catch (err: any) {
      alert(`KPI update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Configurable KPI Targets &amp; Benchmarks</h2>
        <p className="text-xs text-slate-500 mt-1">
          Define minimum acceptable performance thresholds, target objectives, evaluation formulas, and metric weights.
        </p>
      </div>

      {/* KPI Targets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">KPI Metric</th>
                <th className="p-3.5">Target Value</th>
                <th className="p-3.5">Min Acceptable (Exception Threshold)</th>
                <th className="p-3.5">Optimization Direction</th>
                <th className="p-3.5">Score Weight</th>
                <th className="p-3.5">Effective Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kpis.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{k.kpi_name}</td>
                  <td className="p-3.5 font-bold text-blue-600">
                    {k.target_value} {k.unit}
                  </td>
                  <td className="p-3.5 font-bold text-amber-700">
                    {k.min_acceptable_value} {k.unit}
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {k.kpi_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold">{k.weight}%</td>
                  <td className="p-3.5 font-mono text-slate-600">{k.effective_date}</td>
                  <td className="p-3.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Active
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleOpenEdit(k)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      Edit Target
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingKpi && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Configure KPI Target: {editingKpi.kpi_name}
              </h3>
              <button onClick={() => setEditingKpi(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKpi} className="space-y-3.5 my-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={kpiForm.target_value}
                    onChange={(e) => setKpiForm({ ...kpiForm, target_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Acceptable</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={kpiForm.min_acceptable_value}
                    onChange={(e) => setKpiForm({ ...kpiForm, min_acceptable_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={kpiForm.unit}
                    onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight (%)</label>
                  <input
                    type="number"
                    value={kpiForm.weight}
                    onChange={(e) => setKpiForm({ ...kpiForm, weight: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Optimization Direction</label>
                <select
                  value={kpiForm.kpi_type}
                  onChange={(e) => setKpiForm({ ...kpiForm, kpi_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="HIGHER_IS_BETTER">HIGHER IS BETTER (e.g. CSAT, Quality)</option>
                  <option value="LOWER_IS_BETTER">LOWER IS BETTER (e.g. AHT, Hold Duration)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingKpi(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
