import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileWarning,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { UploadedReport, ReportError } from '../types';

export const ProcessingLogsView: React.FC = () => {
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [reportErrors, setReportErrors] = useState<ReportError[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReportHistory();
      setReports(res);
    } catch (err: any) {
      console.error('Failed to load processing logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleToggleExpand = async (reportId: string) => {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
      setReportErrors([]);
      return;
    }

    try {
      setExpandedReportId(reportId);
      setLoadingErrors(true);
      const errors = await api.getReportErrors(reportId);
      setReportErrors(errors);
    } catch (err: any) {
      console.error('Failed to load errors:', err);
    } finally {
      setLoadingErrors(false);
    }
  };

  const filtered = reports.filter((r) =>
    r.file_name.toLowerCase().includes(search.toLowerCase()) ||
    r.report_type.toLowerCase().includes(search.toLowerCase()) ||
    (r.uploaded_by_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Ingestion Audit Trail
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Report Processing Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit logs for CSV/Excel operational report ingestion, line validation, mapping accuracy, and duplicate resolution.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by file name, report type, or uploader..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Uploaded File</th>
                <th className="py-3.5 px-4">Report Type</th>
                <th className="py-3.5 px-4">Report Date</th>
                <th className="py-3.5 px-4 text-center">Total Rows</th>
                <th className="py-3.5 px-4 text-center">Processed</th>
                <th className="py-3.5 px-4 text-center">Errors</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading processing history...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {r.file_name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {(r.file_size / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold uppercase">
                          {r.report_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-600">{r.report_date}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800">{r.total_rows}</td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-600">{r.processed_rows}</td>
                      <td className="py-4 px-4 text-center">
                        {(() => {
                          const errCount = (r.invalid_employee_rows || 0) + (r.missing_field_rows || 0) + (r.unmapped_rows || 0);
                          return (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              errCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {errCount}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {r.uploaded_by_name || 'Admin'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {(() => {
                          const errCount = (r.invalid_employee_rows || 0) + (r.missing_field_rows || 0) + (r.unmapped_rows || 0);
                          return (
                            <button
                              onClick={() => handleToggleExpand(r.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                            >
                              {expandedReportId === r.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              {errCount > 0 ? 'View Errors' : 'Logs'}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>

                    {expandedReportId === r.id && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={9} className="p-4 border-t border-slate-200">
                          {loadingErrors ? (
                            <div className="py-4 text-center text-slate-400">Loading error logs...</div>
                          ) : reportErrors.length > 0 ? (
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                                Ingestion Error Logs ({reportErrors.length} records)
                              </span>
                              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
                                {reportErrors.map((err) => (
                                  <div key={err.id} className="p-2.5 bg-white border border-rose-200 rounded-xl text-xs flex items-center justify-between">
                                    <div>
                                      <span className="font-mono font-bold text-rose-800 mr-2">Row {err.row_number}:</span>
                                      <span className="text-slate-800 font-medium">{err.reason || err.error_type}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">{err.employee_identifier}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              This report processed cleanly with zero validation errors. Status: {r.status}.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No processing logs found.
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
