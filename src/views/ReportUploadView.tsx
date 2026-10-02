import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileWarning
} from 'lucide-react';
import { api } from '../services/api';
import { UploadedReport, ReportType, UnmappedRecord, ReportError, Employee } from '../types';

export const ReportUploadView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'HISTORY' | 'UNMAPPED'>('UPLOAD');

  // Form State
  const [reportType, setReportType] = useState<ReportType>('PRODUCTIVITY');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamId, setTeamId] = useState('');
  const [processName, setProcessName] = useState('Inbound Support');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP' | 'UPDATE' | 'REPLACE'>('UPDATE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Uploading state & pipeline result
  const [uploading, setUploading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // History & Unmapped state
  const [history, setHistory] = useState<UploadedReport[]>([]);
  const [unmapped, setUnmapped] = useState<UnmappedRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selected error report modal
  const [selectedReportErrors, setSelectedReportErrors] = useState<ReportError[] | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveEmpId, setResolveEmpId] = useState('');

  const fetchHistoryAndUnmapped = async () => {
    try {
      setLoadingData(true);
      const [histData, unmappedData, usersData] = await Promise.all([
        api.getReportHistory(),
        api.getUnmappedRecords(),
        api.getUsers({ limit: 100 })
      ]);
      setHistory(histData);
      setUnmapped(unmappedData);
      setEmployees(
        usersData.users
          .filter((u) => u.role === 'AGENT')
          .map((u) => ({
            employee_id: u.employee_id,
            user_id: u.id,
            full_name: u.full_name,
            email: u.email,
            mobile: u.mobile,
            designation: u.designation,
            team_id: u.team_id,
            reporting_tl_id: u.reporting_tl_id,
            process: u.process,
            status: u.status,
            date_of_joining: u.date_of_joining,
            created_at: u.created_at
          }))
      );
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndUnmapped();
  }, [activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPipelineResult(null);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a CSV or Excel file.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setPipelineResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('report_type', reportType);
    formData.append('report_date', reportDate);
    formData.append('team_id', teamId);
    formData.append('process', processName);
    formData.append('duplicate_strategy', duplicateStrategy);

    try {
      const res = await api.uploadReport(formData);
      setPipelineResult(res);
      setSelectedFile(null);
      fetchHistoryAndUnmapped();
    } catch (err: any) {
      setUploadError(err.message || 'File processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = (type: string) => {
    window.location.href = `/api/reports/sample-csv/${type.toLowerCase()}`;
  };

  const handleViewErrors = async (reportId: string) => {
    try {
      const errors = await api.getReportErrors(reportId);
      setSelectedReportErrors(errors);
    } catch (err: any) {
      alert(`Failed to load errors: ${err.message}`);
    }
  };

  const handleResolveUnmapped = async (unmapId: string) => {
    if (!resolveEmpId) return;
    try {
      await api.resolveUnmappedRecord(unmapId, resolveEmpId);
      setResolvingId(null);
      setResolveEmpId('');
      fetchHistoryAndUnmapped();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const downloadErrorCsv = (errors: ReportError[]) => {
    const headers = ['Row Number', 'Employee Identifier', 'Error Type', 'Reason'];
    const rows = errors.map((e) => [
      e.row_number,
      `"${e.employee_identifier}"`,
      `"${e.error_type}"`,
      `"${e.reason.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `report_errors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Report Ingestion &amp; Mapping Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV/Excel operational reports, match employee IDs, prevent duplicates, and trigger real-time KPI calculations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'UPLOAD' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload New Report
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload History ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('UNMAPPED')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'UNMAPPED' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unmapped Records
            {unmapped.filter((u) => u.status === 'UNRESOLVED').length > 0 && (
              <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unmapped.filter((u) => u.status === 'UNRESOLVED').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: UPLOAD FORM & PIPELINE RESULT */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'UPLOAD' && (
        <div className="space-y-6">
          {/* Sample Templates Helper Bar */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">Quick-Start Test Templates</h4>
                <p className="text-[11px] text-blue-800">
                  Download pre-formatted sample CSV files with verified columns and real employee IDs to test instant ingestion:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSample('PRODUCTIVITY')}
                className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Productivity.csv
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample('ACD_CALLS')}
                className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> ACD_Calls.csv
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample('PARTNER_FEEDBACK')}
                className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Feedback.csv
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample('ATTENDANCE')}
                className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Attendance.csv
              </button>
            </div>
          </div>

          {/* Upload Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Report Type *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="PRODUCTIVITY">1. Productivity Report</option>
                    <option value="ACD_CALLS">2. ACD Call Details</option>
                    <option value="PARTNER_FEEDBACK">3. Partner Feedback Report</option>
                    <option value="ATTENDANCE">4. Attendance Report</option>
                    <option value="QUALITY">5. Quality Report</option>
                    <option value="CSAT">6. CSAT Report</option>
                    <option value="ADHERENCE">7. Adherence Report</option>
                    <option value="OTHER">8. Other Supported Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Report Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duplicate Handling Strategy *
                  </label>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="UPDATE">Update Existing Records (Default)</option>
                    <option value="SKIP">Skip Duplicates</option>
                    <option value="REPLACE">Replace Entire Date's Report</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop File Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Source File (.csv, .xlsx, .xls) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click or drag and drop report file here'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedFile
                      ? `Size: ${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Accepts standard operational exports in CSV, Microsoft Excel (.xlsx, .xls)'}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Ingestion Error:</span> {uploadError}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Executing Processing Pipeline...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Start Ingestion Pipeline
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Processing Pipeline Flow & Result Display */}
          {pipelineResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Report Ingestion Pipeline Summary</h3>
                    <p className="text-xs text-slate-500">Processing completed with status: <strong className="uppercase">{pipelineResult.status}</strong></p>
                  </div>
                </div>
                {pipelineResult.errors && pipelineResult.errors.length > 0 && (
                  <button
                    onClick={() => downloadErrorCsv(pipelineResult.errors)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Failed Records CSV ({pipelineResult.errors.length})
                  </button>
                )}
              </div>

              {/* Pipeline Step Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px] font-bold">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  1. File Validation
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  2. Format &amp; Column
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  3. Data Type
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  4. Employee Mapping
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  5. Duplicate Check
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  6. Database Upsert
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  7. KPI Recalculation
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-black text-slate-900">{pipelineResult.totalRows}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Total Rows</div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xl font-black text-emerald-700">{pipelineResult.processedRows}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Successfully Ingested</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="text-xl font-black text-blue-700">{pipelineResult.updatedRows}</div>
                  <div className="text-[11px] text-blue-700 font-semibold mt-0.5">Updated Existing</div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <div className="text-xl font-black text-amber-700">{pipelineResult.duplicateRows}</div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Duplicates Skipped</div>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-xl font-black text-rose-700">{pipelineResult.invalidEmployeeRows}</div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-0.5">Unmapped / Invalid IDs</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <div className="text-xl font-black text-purple-700">{pipelineResult.missingFieldRows}</div>
                  <div className="text-[11px] text-purple-700 font-semibold mt-0.5">Missing Fields</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: UPLOAD HISTORY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Report History Records ({history.length})
            </span>
            <button
              onClick={fetchHistoryAndUnmapped}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Report Type</th>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">Report Date</th>
                  <th className="p-3.5">Total Rows</th>
                  <th className="p-3.5">Processed</th>
                  <th className="p-3.5">Errors / Unmapped</th>
                  <th className="p-3.5">Uploaded By</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No reports uploaded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{rep.report_type}</td>
                      <td className="p-3.5 text-slate-700 max-w-[200px] truncate" title={rep.file_name}>
                        {rep.file_name}
                      </td>
                      <td className="p-3.5 font-mono">{rep.report_date}</td>
                      <td className="p-3.5 font-bold">{rep.total_rows}</td>
                      <td className="p-3.5 text-emerald-600 font-bold">{rep.processed_rows}</td>
                      <td className="p-3.5 text-rose-600 font-bold">
                        {rep.invalid_employee_rows + rep.missing_field_rows}
                      </td>
                      <td className="p-3.5 text-slate-600">{rep.uploaded_by_name}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            rep.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.status === 'COMPLETED_WITH_ERRORS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {(rep.invalid_employee_rows > 0 || rep.missing_field_rows > 0) && (
                          <button
                            onClick={() => handleViewErrors(rep.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            View Errors
                          </button>
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
      {/* TAB 3: UNMAPPED RECORDS & RESOLUTION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'UNMAPPED' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Unmapped Identifier Resolution Queue
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Records where the CSV employee identifier could not be automatically resolved to an existing employee.
              </p>
            </div>
            <button
              onClick={fetchHistoryAndUnmapped}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Raw Identifier</th>
                  <th className="p-3.5">Identifier Type</th>
                  <th className="p-3.5">Suggested Name</th>
                  <th className="p-3.5">Report Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unmapped.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No unmapped records found. All identifiers resolved!
                    </td>
                  </tr>
                ) : (
                  unmapped.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{rec.raw_identifier}</td>
                      <td className="p-3.5 text-slate-600">{rec.identifier_type}</td>
                      <td className="p-3.5 text-slate-700">{rec.suggested_name || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-blue-600">{rec.report_type}</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            rec.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {rec.status === 'UNRESOLVED' ? (
                          resolvingId === rec.id ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <select
                                value={resolveEmpId}
                                onChange={(e) => setResolveEmpId(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                              >
                                <option value="">Select Employee...</option>
                                {employees.map((emp) => (
                                  <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.full_name} ({emp.employee_id})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleResolveUnmapped(rec.id)}
                                className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                title="Confirm Mapping"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setResolvingId(null)}
                                className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setResolvingId(rec.id);
                                setResolveEmpId('');
                              }}
                              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg cursor-pointer"
                            >
                              Map to Employee
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Mapped to: <strong>{rec.resolved_employee_id}</strong>
                          </span>
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

      {/* Error Details Modal */}
      {selectedReportErrors && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Validation &amp; Ingestion Errors</h3>
                <p className="text-xs text-slate-500">Failed records that could not be mapped or processed</p>
              </div>
              <button
                onClick={() => setSelectedReportErrors(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-2">
              {selectedReportErrors.map((err) => (
                <div key={err.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <div className="flex items-center justify-between font-bold">
                    <span>Row #{err.row_number} &bull; Identifier: {err.employee_identifier}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">
                      {err.error_type}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-700">{err.reason}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                onClick={() => downloadErrorCsv(selectedReportErrors)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Error CSV
              </button>
              <button
                onClick={() => setSelectedReportErrors(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
