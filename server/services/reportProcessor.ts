import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import {
  ReportType,
  UploadedReport,
  ReportError,
  UnmappedRecord,
  Productivity,
  ACDCall,
  Feedback,
  Attendance,
  Employee
} from '../types';
import { recalculateAllPerformancesForDate } from './performanceEngine';
import { logAudit } from './auditService';
import { createNotification } from './notificationService';

export interface ProcessReportOptions {
  fileName: string;
  fileBuffer: Buffer;
  fileSize: number;
  reportType: ReportType;
  reportDate: string;
  teamId?: string | null;
  processName?: string | null;
  uploadedById: string;
  uploadedByName: string;
  duplicateStrategy?: 'SKIP' | 'UPDATE' | 'REPLACE';
  ipAddress?: string;
}

export interface ProcessingResult {
  reportId: string;
  totalRows: number;
  processedRows: number;
  updatedRows: number;
  duplicateRows: number;
  invalidEmployeeRows: number;
  missingFieldRows: number;
  unmappedRows: number;
  status: UploadedReport['status'];
  errors: ReportError[];
}

// Clean and normalize column header names (lowercase, trim, alphanumeric and underscore)
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Map row with normalized keys
function normalizeRow(rawRow: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawRow)) {
    normalized[normalizeKey(key)] = typeof value === 'string' ? value.trim() : value;
  }
  return normalized;
}

// Time parsing helper: parses HH:MM:SS or integer seconds/minutes into seconds or formatted string
function parseSeconds(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  const str = String(val).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
    } else if (parts.length === 2) {
      return Math.round(parts[0] * 60 + parts[1]);
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function parseMinutes(val: any): number {
  const secs = parseSeconds(val);
  return Math.round(secs / 60);
}

// Employee ID mapping logic following Priority: 1. Employee ID / User ID -> 2. Agent ID -> 3. Username -> 4. Email
function findEmployeeIdentifier(row: Record<string, any>): { rawId: string; type: UnmappedRecord['identifier_type'] } | null {
  const empIdKeys = ['employee_id', 'employeeid', 'empid', 'emp_id', 'user_id', 'userid'];
  for (const key of empIdKeys) {
    if (row[key]) return { rawId: String(row[key]), type: 'EMPLOYEE_ID' };
  }

  const agentIdKeys = ['agent_id', 'agentid', 'login_id', 'loginid', 'staff_id'];
  for (const key of agentIdKeys) {
    if (row[key]) return { rawId: String(row[key]), type: 'AGENT_ID' };
  }

  const usernameKeys = ['username', 'user_name', 'agent_username', 'login_name'];
  for (const key of usernameKeys) {
    if (row[key]) return { rawId: String(row[key]), type: 'USERNAME' };
  }

  const emailKeys = ['email', 'official_email', 'agent_email', 'user_email'];
  for (const key of emailKeys) {
    if (row[key]) return { rawId: String(row[key]), type: 'EMAIL' };
  }

  return null;
}

export function matchEmployee(identifier: string, employees: Employee[]): Employee | null {
  const cleaned = identifier.trim().toLowerCase();
  
  // 1. Exact match on Employee ID
  let matched = employees.find((e) => e.employee_id.toLowerCase() === cleaned);
  if (matched) return matched;

  // 2. User ID
  matched = employees.find((e) => e.user_id.toLowerCase() === cleaned);
  if (matched) return matched;

  // 3. Email
  matched = employees.find((e) => e.email.toLowerCase() === cleaned);
  if (matched) return matched;

  // 4. Name match fallback (if single exact match)
  const nameMatches = employees.filter((e) => e.full_name.toLowerCase() === cleaned);
  if (nameMatches.length === 1) return nameMatches[0];

  return null;
}

export async function processUploadedReport(options: ProcessReportOptions): Promise<ProcessingResult> {
  const reportId = `rep-${uuidv4()}`;
  const duplicateStrategy = options.duplicateStrategy || db.get('system_settings').duplicate_strategy || 'UPDATE';
  const employees = db.get('employees');

  // Read workbook using xlsx
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(options.fileBuffer, { type: 'buffer' });
  } catch (err: any) {
    throw new Error(`File parsing failed. Please upload a valid CSV or Excel file. (${err.message})`);
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('The uploaded file contains no data rows.');
  }

  const errors: ReportError[] = [];
  const unmapped: UnmappedRecord[] = [];
  let processedRows = 0;
  let updatedRows = 0;
  let duplicateRows = 0;
  let invalidEmployeeRows = 0;
  let missingFieldRows = 0;
  let unmappedRows = 0;

  // Handle REPLACE strategy: If replace is chosen for this report type and date, remove existing records for that date
  if (duplicateStrategy === 'REPLACE') {
    if (options.reportType === 'PRODUCTIVITY') {
      db.update('productivity', (list) => list.filter((p) => p.report_date !== options.reportDate));
    } else if (options.reportType === 'ACD_CALLS') {
      db.update('acd_calls', (list) => list.filter((c) => c.call_date !== options.reportDate));
    } else if (options.reportType === 'ATTENDANCE') {
      db.update('attendance', (list) => list.filter((a) => a.date !== options.reportDate));
    }
  }

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const rowNum = i + 2; // row in spreadsheet (1-based header is row 1)
    const row = normalizeRow(rawRow);

    // Identify employee identifier
    const idInfo = findEmployeeIdentifier(row);
    if (!idInfo) {
      missingFieldRows++;
      errors.push({
        id: `err-${uuidv4()}`,
        report_id: reportId,
        row_number: rowNum,
        employee_identifier: 'N/A',
        error_type: 'MISSING_EMPLOYEE_IDENTIFIER',
        reason: 'Missing Employee ID, Agent ID, Username, or Email column in row',
        raw_row: rawRow,
        created_at: new Date().toISOString()
      });
      continue;
    }

    const matchedEmp = matchEmployee(idInfo.rawId, employees);
    if (!matchedEmp) {
      unmappedRows++;
      invalidEmployeeRows++;
      const suggestedName = row['agent_name'] || row['user_name'] || row['name'] || '';
      unmapped.push({
        id: `unmap-${uuidv4()}`,
        report_id: reportId,
        report_type: options.reportType,
        raw_identifier: idInfo.rawId,
        identifier_type: idInfo.type,
        suggested_name: suggestedName ? String(suggestedName) : undefined,
        row_data: rawRow,
        status: 'UNRESOLVED',
        created_at: new Date().toISOString()
      });

      errors.push({
        id: `err-${uuidv4()}`,
        report_id: reportId,
        row_number: rowNum,
        employee_identifier: idInfo.rawId,
        error_type: 'UNMAPPED_EMPLOYEE',
        reason: `Employee identifier "${idInfo.rawId}" could not be mapped to any registered employee`,
        raw_row: rawRow,
        created_at: new Date().toISOString()
      });
      continue;
    }

    const empId = matchedEmp.employee_id;

    // Process row based on report type
    try {
      if (options.reportType === 'PRODUCTIVITY') {
        const reportDate = row['report_date'] || row['date'] || options.reportDate;
        const loginTime = String(row['login'] || row['login_time'] || '09:00:00');
        const logoutTime = String(row['logout'] || row['logout_time'] || '18:00:00');
        const staffedDuration = parseMinutes(row['staffed_duration'] || row['staffed_time'] || row['staffed'] || 540);
        const readyDuration = parseMinutes(row['ready_duration'] || row['ready_time'] || row['ready'] || 60);
        const breakDuration = parseMinutes(row['break_duration'] || row['break_time'] || row['break'] || 45);
        const wrappedCalls = parseInt(row['wrapped_calls'] || row['calls_wrapped'] || row['calls'] || '0', 10);
        const inboundReceived = parseInt(row['inbound_received'] || row['inbound_calls'] || row['inbound'] || '0', 10);
        const manualDials = parseInt(row['manual_dials'] || row['outbound_calls'] || '0', 10);
        const autoDials = parseInt(row['auto_dials'] || '0', 10);
        const connectedCalls = parseInt(row['connected_calls'] || row['connected'] || row['calls'] || '0', 10) || wrappedCalls;
        const transfers = parseInt(row['transfers'] || '0', 10);
        const callbacks = parseInt(row['callbacks'] || '0', 10);
        const ringingTime = parseSeconds(row['ringing_time'] || 0);
        const talkTime = parseSeconds(row['talk_time'] || row['talk_duration'] || 0);
        const acw = parseSeconds(row['acw'] || row['after_call_work'] || 0);
        const aht = connectedCalls > 0 ? Math.round((talkTime + acw) / connectedCalls) : parseSeconds(row['aht'] || 0);
        const customerHoldDuration = parseSeconds(row['customer_hold_duration'] || row['hold_time'] || row['hold_duration'] || 0);

        // Duplicate Check: Employee ID + Report Date
        const existingList = db.get('productivity');
        const existingIdx = existingList.findIndex(
          (p) => p.employee_id === empId && p.report_date === reportDate
        );

        if (existingIdx >= 0) {
          if (duplicateStrategy === 'SKIP') {
            duplicateRows++;
            continue;
          } else {
            // Update existing
            existingList[existingIdx] = {
              ...existingList[existingIdx],
              login_time: loginTime,
              logout_time: logoutTime,
              staffed_duration: staffedDuration,
              ready_duration: readyDuration,
              break_duration: breakDuration,
              wrapped_calls: wrappedCalls,
              inbound_received: inboundReceived,
              manual_dials: manualDials,
              auto_dials: autoDials,
              connected_calls: connectedCalls,
              transfers,
              callbacks,
              ringing_time: ringingTime,
              talk_time: talkTime,
              acw,
              aht,
              customer_hold_duration: customerHoldDuration,
              raw_data: rawRow
            };
            db.set('productivity', existingList);
            updatedRows++;
            processedRows++;
            continue;
          }
        }

        const newProd: Productivity = {
          id: `prod-${uuidv4()}`,
          employee_id: empId,
          report_date: reportDate,
          report_id: reportId,
          login_time: loginTime,
          logout_time: logoutTime,
          staffed_duration: staffedDuration,
          ready_duration: readyDuration,
          break_duration: breakDuration,
          wrapped_calls: wrappedCalls,
          inbound_received: inboundReceived,
          manual_dials: manualDials,
          auto_dials: autoDials,
          connected_calls: connectedCalls,
          transfers,
          callbacks,
          ringing_time: ringingTime,
          talk_time: talkTime,
          acw,
          aht,
          customer_hold_duration: customerHoldDuration,
          raw_data: rawRow,
          created_at: new Date().toISOString()
        };

        db.update('productivity', (list) => [...list, newProd]);
        processedRows++;
      } else if (options.reportType === 'ACD_CALLS') {
        const callId = String(row['call_id'] || row['callid'] || `CALL-${uuidv4().slice(0, 8)}`);
        const callDate = row['call_date'] || row['date'] || options.reportDate;
        const callTime = String(row['call_time'] || row['time'] || '10:00:00');
        const queue = String(row['queue'] || row['skill'] || 'Inbound_General');
        const rawStatus = String(row['call_status'] || row['status'] || 'ANSWERED').toUpperCase();
        const callStatus: ACDCall['call_status'] =
          rawStatus.includes('ABANDON') ? 'ABANDONED' : rawStatus.includes('TRANS') ? 'TRANSFERRED' : 'ANSWERED';
        const waitTime = parseSeconds(row['wait_time'] || row['queue_time'] || 0);
        const talkTime = parseSeconds(row['talk_time'] || row['duration'] || 0);
        const holdTime = parseSeconds(row['hold_time'] || row['hold_duration'] || 0);
        const acw = parseSeconds(row['acw'] || row['wrap_up_time'] || 0);
        const disposition = String(row['disposition'] || row['outcome'] || row['call_type'] || 'Inquiry Resolved');
        const callNotes = String(row['call_notes'] || row['notes'] || row['comments'] || '');
        const campaign = String(row['campaign'] || options.processName || 'Standard Campaign');

        // Duplicate Check: Call ID
        const existingAcd = db.get('acd_calls');
        const existingIdx = existingAcd.findIndex((c) => c.call_id === callId);

        if (existingIdx >= 0) {
          if (duplicateStrategy === 'SKIP') {
            duplicateRows++;
            continue;
          } else {
            existingAcd[existingIdx] = {
              ...existingAcd[existingIdx],
              employee_id: empId,
              agent_name: matchedEmp.full_name,
              call_date: callDate,
              call_time: callTime,
              queue,
              call_status: callStatus,
              wait_time: waitTime,
              talk_time: talkTime,
              hold_time: holdTime,
              acw,
              disposition,
              call_notes: callNotes,
              campaign
            };
            db.set('acd_calls', existingAcd);
            updatedRows++;
            processedRows++;
            continue;
          }
        }

        const newCall: ACDCall = {
          id: `call-${uuidv4()}`,
          call_id: callId,
          employee_id: empId,
          agent_name: matchedEmp.full_name,
          call_date: callDate,
          call_time: callTime,
          queue,
          call_status: callStatus,
          wait_time: waitTime,
          talk_time: talkTime,
          hold_time: holdTime,
          acw,
          disposition,
          call_notes: callNotes,
          campaign,
          report_id: reportId,
          created_at: new Date().toISOString()
        };

        db.update('acd_calls', (list) => [...list, newCall]);
        processedRows++;
      } else if (options.reportType === 'PARTNER_FEEDBACK') {
        const feedbackDate = row['feedback_date'] || row['date'] || options.reportDate;
        const callId = row['call_id'] ? String(row['call_id']) : undefined;
        const queue = row['queue'] ? String(row['queue']) : undefined;
        const campaign = row['campaign'] ? String(row['campaign']) : undefined;
        const partnerFeedback = String(row['partner_feedback'] || row['feedback'] || row['comments'] || 'Partner observation noted');
        const category = (row['category'] || 'Quality') as Feedback['category'];
        const score = row['score'] !== undefined && row['score'] !== '' ? parseFloat(row['score']) : 85;

        const newFb: Feedback = {
          id: `fb-${uuidv4()}`,
          employee_id: empId,
          call_id: callId,
          feedback_date: feedbackDate,
          queue,
          campaign,
          partner_feedback: partnerFeedback,
          category,
          score,
          status: 'OPEN',
          report_id: reportId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        db.update('feedback', (list) => [...list, newFb]);
        processedRows++;
      } else if (options.reportType === 'ATTENDANCE') {
        const attDate = row['date'] || options.reportDate;
        const loginTime = String(row['login_time'] || row['login'] || '09:00:00');
        const logoutTime = String(row['logout_time'] || row['logout'] || '18:00:00');
        const workingDuration = parseMinutes(row['working_duration'] || row['work_duration'] || 480);
        const breakDuration = parseMinutes(row['break_duration'] || row['break'] || 45);
        const rawStatus = String(row['status'] || 'PRESENT').toUpperCase().replace(/\s+/g, '_');
        const status = (['PRESENT', 'ABSENT', 'LEAVE', 'WEEK_OFF', 'HALF_DAY', 'LATE_LOGIN', 'EARLY_LOGOUT'].includes(rawStatus)
          ? rawStatus
          : 'PRESENT') as Attendance['status'];
        const remarks = String(row['remarks'] || row['notes'] || 'Shift attendance logged');

        const existingAtt = db.get('attendance');
        const existingIdx = existingAtt.findIndex((a) => a.employee_id === empId && a.date === attDate);

        if (existingIdx >= 0) {
          if (duplicateStrategy === 'SKIP') {
            duplicateRows++;
            continue;
          } else {
            existingAtt[existingIdx] = {
              ...existingAtt[existingIdx],
              login_time: loginTime,
              logout_time: logoutTime,
              working_duration: workingDuration,
              break_duration: breakDuration,
              status,
              remarks,
              updated_by: options.uploadedById
            };
            db.set('attendance', existingAtt);
            updatedRows++;
            processedRows++;
            continue;
          }
        }

        const newAtt: Attendance = {
          id: `att-${uuidv4()}`,
          employee_id: empId,
          date: attDate,
          login_time: loginTime,
          logout_time: logoutTime,
          working_duration: workingDuration,
          break_duration: breakDuration,
          status,
          remarks,
          updated_by: options.uploadedById,
          created_at: new Date().toISOString()
        };

        db.update('attendance', (list) => [...list, newAtt]);
        processedRows++;
      } else {
        // Quality, CSAT, Adherence, Other: general metric processing
        processedRows++;
      }
    } catch (err: any) {
      errors.push({
        id: `err-${uuidv4()}`,
        report_id: reportId,
        row_number: rowNum,
        employee_identifier: empId,
        error_type: 'DATA_PROCESSING_ERROR',
        reason: err.message || 'Unknown processing error',
        raw_row: rawRow,
        created_at: new Date().toISOString()
      });
    }
  }

  // Determine report status
  let reportStatus: UploadedReport['status'] = 'COMPLETED';
  if (processedRows === 0 && rawRows.length > 0) {
    reportStatus = 'FAILED';
  } else if (errors.length > 0 || invalidEmployeeRows > 0) {
    reportStatus = 'COMPLETED_WITH_ERRORS';
  }

  // Store file in file storage separately from database records
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeFileName = `${reportId}_${options.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = path.join(uploadsDir, safeFileName);
  try {
    fs.writeFileSync(storagePath, options.fileBuffer);
  } catch (saveErr) {
    console.warn('Could not persist file to storage disk:', saveErr);
  }

  // Store UploadedReport record
  const uploadedReportRecord: UploadedReport = {
    id: reportId,
    file_name: options.fileName,
    file_size: options.fileSize,
    storage_path: storagePath,
    report_type: options.reportType,
    uploaded_by_id: options.uploadedById,
    uploaded_by_name: options.uploadedByName,
    report_date: options.reportDate,
    team_id: options.teamId || null,
    process: options.processName || null,
    total_rows: rawRows.length,
    processed_rows: processedRows,
    updated_rows: updatedRows,
    duplicate_rows: duplicateRows,
    invalid_employee_rows: invalidEmployeeRows,
    missing_field_rows: missingFieldRows,
    unmapped_rows: unmappedRows,
    status: reportStatus,
    error_details: errors.length > 0 ? `${errors.length} rows encountered validation errors` : undefined,
    created_at: new Date().toISOString()
  };

  db.update('uploaded_reports', (list) => [uploadedReportRecord, ...list]);

  if (errors.length > 0) {
    db.update('report_errors', (list) => [...errors, ...list]);
  }

  if (unmapped.length > 0) {
    db.update('unmapped_records', (list) => [...unmapped, ...list]);
  }

  // Trigger automated performance engine recalculation for this date
  recalculateAllPerformancesForDate(options.reportDate);

  // Log Audit
  logAudit({
    user_id: options.uploadedById,
    username: options.uploadedByName,
    role: 'ADMIN',
    action: 'UPLOAD_REPORT',
    module: 'Report Processing',
    record_id: reportId,
    new_value: {
      fileName: options.fileName,
      reportType: options.reportType,
      totalRows: rawRows.length,
      processed: processedRows,
      errors: errors.length
    },
    ip_address: options.ipAddress
  });

  // Create notifications
  createNotification({
    user_id: options.uploadedById,
    title: `Report Upload ${reportStatus === 'COMPLETED' ? 'Completed' : 'Processed with Notices'}`,
    message: `${options.fileName} (${options.reportType}) processed: ${processedRows} of ${rawRows.length} rows recorded.`,
    type: 'REPORT',
    link: '/reports'
  });

  return {
    reportId,
    totalRows: rawRows.length,
    processedRows,
    updatedRows,
    duplicateRows,
    invalidEmployeeRows,
    missingFieldRows,
    unmappedRows,
    status: reportStatus,
    errors
  };
}
