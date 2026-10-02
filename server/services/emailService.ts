import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { EmailLog, Employee, DailyPerformance, WeeklyPerformance, MonthlyPerformance } from '../types';
import { logAudit } from './auditService';

export function generateDailyEmailHtml(emp: Employee, perf: DailyPerformance): string {
  const prodColor = perf.productivity_pct >= 85 ? '#16a34a' : perf.productivity_pct >= 75 ? '#d97706' : '#dc2626';
  const ahtColor = perf.aht <= 360 ? '#16a34a' : perf.aht <= 480 ? '#d97706' : '#dc2626';
  const csatColor = perf.csat_score >= 88 ? '#16a34a' : '#dc2626';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .badge-pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; }
    .metric-box { background: #f1f5f9; padding: 14px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
    .metric-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .table-wrap { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .table-wrap th, .table-wrap td { padding: 10px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .table-wrap th { background: #f8fafc; color: #475569; font-weight: 600; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 12px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Daily Performance Summary</h1>
      <p>Report Date: <strong>${perf.date}</strong> | Employee ID: <strong>${emp.employee_id}</strong></p>
    </div>
    <div class="content">
      <p>Hello <strong>${emp.full_name}</strong>,</p>
      <p style="color: #475569; font-size: 13px; line-height: 1.5;">Here is your verified daily operational performance metrics for the shift ending ${perf.date}.</p>
      
      <div class="grid">
        <div class="metric-box" style="border-left-color: ${prodColor};">
          <div class="metric-label">Productivity</div>
          <div class="metric-val" style="color: ${prodColor};">${perf.productivity_pct}%</div>
        </div>
        <div class="metric-box" style="border-left-color: ${ahtColor};">
          <div class="metric-label">Average Handling Time (AHT)</div>
          <div class="metric-val" style="color: ${ahtColor};">${perf.aht}s</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Total Calls Handled</div>
          <div class="metric-val">${perf.calls} <span style="font-size: 12px; font-weight: normal; color: #64748b;">(${perf.connected_calls} connected)</span></div>
        </div>
        <div class="metric-box" style="border-left-color: ${csatColor};">
          <div class="metric-label">CSAT Score</div>
          <div class="metric-val" style="color: ${csatColor};">${perf.csat_score}%</div>
        </div>
      </div>

      <table class="table-wrap">
        <tr>
          <th>Metric</th>
          <th>Shift Value</th>
          <th>Benchmark</th>
        </tr>
        <tr>
          <td>Attendance Status</td>
          <td><span style="font-weight: 600; color: #0284c7;">${perf.attendance_status}</span></td>
          <td>Present on schedule</td>
        </tr>
        <tr>
          <td>Talk Time</td>
          <td>${Math.round(perf.talk_time / 60)} mins (${perf.talk_time}s)</td>
          <td>Standard Queue Load</td>
        </tr>
        <tr>
          <td>After Call Work (ACW)</td>
          <td>${Math.round(perf.acw / 60)} mins (${perf.acw}s)</td>
          <td>&lt; 50s per call</td>
        </tr>
        <tr>
          <td>Adherence</td>
          <td><strong>${perf.adherence_pct}%</strong></td>
          <td>&ge; 90%</td>
        </tr>
        <tr>
          <td>Quality Score</td>
          <td><strong>${perf.quality_score}%</strong></td>
          <td>&ge; 92%</td>
        </tr>
        <tr>
          <td>Compliance Score</td>
          <td><strong>${perf.compliance_score}%</strong></td>
          <td>&ge; 95%</td>
        </tr>
      </table>

      ${
        perf.exceptions && perf.exceptions.length > 0
          ? `
        <div class="alert-box">
          <strong>Exceptions Noted:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 20px;">
            ${perf.exceptions.map((ex) => `<li>${ex}</li>`).join('')}
          </ul>
          <p style="margin: 6px 0 0 0; font-size: 11px;">Please consult your Team Leader for coaching and action plan alignment.</p>
        </div>`
          : ''
      }
    </div>
    <div class="footer">
      This is an automated enterprise performance notification sent to registered address ${emp.email}.
    </div>
  </div>
</body>
</html>
  `;
}

export function generateWeeklyEmailHtml(emp: Employee, perf: WeeklyPerformance): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); color: #ffffff; padding: 24px; }
    .content { padding: 24px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .metric-box { background: #f0fdfa; padding: 12px; border-radius: 8px; border: 1px solid #ccfbf1; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #0f766e; font-weight: 600; }
    .metric-val { font-size: 18px; font-weight: 700; color: #115e59; margin-top: 4px; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0 0 4px 0; font-size: 20px;">Weekly Performance Scorecard</h1>
      <p style="margin:0; font-size: 13px;">Week: ${perf.week_start} to ${perf.week_end} | ${emp.full_name} (${emp.employee_id})</p>
    </div>
    <div class="content">
      <p>Hello <strong>${emp.full_name}</strong>,</p>
      <p style="color: #475569; font-size: 13px;">Here is your weekly consolidated scorecard and trend overview:</p>
      
      <div class="grid">
        <div class="metric-box">
          <div class="metric-label">Avg Productivity</div>
          <div class="metric-val">${perf.avg_productivity}%</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Avg AHT</div>
          <div class="metric-val">${perf.avg_aht}s</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Avg CSAT</div>
          <div class="metric-val">${perf.avg_csat}%</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Avg Quality</div>
          <div class="metric-val">${perf.avg_quality}%</div>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
        <div><strong>Total Inbound/Outbound Calls Handled:</strong> ${perf.total_calls}</div>
        <div style="margin-top: 6px;"><strong>Attendance Reliability Rate:</strong> ${perf.attendance_rate}%</div>
        <div style="margin-top: 6px;"><strong>Week-over-Week Variance:</strong> ${perf.week_over_week_diff && perf.week_over_week_diff >= 0 ? '+' : ''}${perf.week_over_week_diff || 0}%</div>
      </div>

      ${
        perf.areas_requiring_attention && perf.areas_requiring_attention.length > 0
          ? `
        <div style="background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; font-size: 12px;">
          <strong>Target Areas for Coaching:</strong>
          <ul style="margin: 4px 0 0 0; padding-left: 20px;">
            ${perf.areas_requiring_attention.map((a) => `<li>${a}</li>`).join('')}
          </ul>
        </div>`
          : '<div style="color: #16a34a; font-size: 13px;">✓ All KPIs met or exceeded target benchmarks this week. Keep up the high standard!</div>'
      }
    </div>
    <div class="footer">
      Enterprise Team Management System &bull; Weekly Report Dispatched to ${emp.email}
    </div>
  </div>
</body>
</html>
  `;
}

export function generateMonthlyEmailHtml(emp: Employee, perf: MonthlyPerformance): string {
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthStr = monthNames[perf.month] || `Month ${perf.month}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { background: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4338ca, #6366f1); color: #ffffff; padding: 24px; }
    .content { padding: 24px; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0 0 4px 0; font-size: 20px;">Monthly Appraisal & Performance Report</h1>
      <p style="margin:0; font-size: 13px;">Period: ${monthStr} ${perf.year} | ${emp.full_name} [${emp.employee_id}]</p>
    </div>
    <div class="content">
      <p>Dear <strong>${emp.full_name}</strong>,</p>
      <p style="color: #475569; font-size: 13px;">Below is your official monthly performance appraisal summary:</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Monthly Productivity</td><td style="text-align:right; font-weight:700;">${perf.productivity}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Average Handling Time</td><td style="text-align:right; font-weight:700;">${perf.aht}s</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Quality Average</td><td style="text-align:right; font-weight:700;">${perf.quality}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Customer Satisfaction (CSAT)</td><td style="text-align:right; font-weight:700;">${perf.csat}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Schedule Adherence</td><td style="text-align:right; font-weight:700;">${perf.adherence}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Attendance Reliability</td><td style="text-align:right; font-weight:700;">${perf.attendance_rate}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Compliance Score</td><td style="text-align:right; font-weight:700;">${perf.compliance}%</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color:#64748b;">Performance Trend Direction</td><td style="text-align:right; font-weight:700; color: #4338ca;">${perf.trend}</td></tr>
      </table>

      <div style="margin-top: 20px; font-size: 13px; color: #334155;">
        <p><strong>Feedback Received:</strong> ${perf.feedback_count} | <strong>Coaching Sessions:</strong> ${perf.coaching_count} | <strong>Escalations:</strong> ${perf.escalations_count}</p>
      </div>
    </div>
    <div class="footer">
      Official HR & Operational Performance Record &bull; Delivered to ${emp.email}
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendPerformanceEmail(params: {
  employeeId: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  targetDate?: string;
}): Promise<EmailLog> {
  const employees = db.get('employees');
  const emp = employees.find((e) => e.employee_id === params.employeeId);
  if (!emp) {
    throw new Error(`Employee with ID ${params.employeeId} not found`);
  }

  let subject = '';
  let contentHtml = '';
  const now = new Date().toISOString();

  if (params.reportType === 'DAILY') {
    const daily = db.get('daily_performance');
    const date = params.targetDate || (daily.length > 0 ? daily[0].date : '2026-10-01');
    const perf = daily.find((d) => d.employee_id === emp.employee_id && d.date === date);
    if (!perf) {
      throw new Error(`No daily performance record found for ${emp.employee_id} on ${date}`);
    }
    subject = `Daily Performance Report - ${emp.full_name} [${emp.employee_id}] - ${date}`;
    contentHtml = generateDailyEmailHtml(emp, perf);
  } else if (params.reportType === 'WEEKLY') {
    const weekly = db.get('weekly_performance');
    const perf = weekly.find((w) => w.employee_id === emp.employee_id);
    if (!perf) {
      throw new Error(`No weekly performance record found for ${emp.employee_id}`);
    }
    subject = `Weekly Performance Scorecard - ${emp.full_name} [${emp.employee_id}]`;
    contentHtml = generateWeeklyEmailHtml(emp, perf);
  } else {
    const monthly = db.get('monthly_performance');
    const perf = monthly.find((m) => m.employee_id === emp.employee_id);
    if (!perf) {
      throw new Error(`No monthly performance record found for ${emp.employee_id}`);
    }
    subject = `Monthly Appraisal Report - ${emp.full_name} [${emp.employee_id}]`;
    contentHtml = generateMonthlyEmailHtml(emp, perf);
  }

  const logRecord: EmailLog = {
    id: `email-${uuidv4()}`,
    recipient_email: emp.email,
    employee_id: emp.employee_id,
    report_type: params.reportType,
    subject,
    content_html: contentHtml,
    sent_at: now,
    delivery_status: 'SENT',
    retry_count: 0
  };

  db.update('email_logs', (logs) => [logRecord, ...logs]);

  logAudit({
    user_id: 'system',
    username: 'Automated Email Service',
    role: 'ADMIN',
    action: 'SEND_PERFORMANCE_EMAIL',
    module: 'Email System',
    record_id: logRecord.id,
    new_value: {
      recipient: emp.email,
      reportType: params.reportType,
      subject
    }
  });

  return logRecord;
}

export async function sendBatchPerformanceEmails(reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY', targetDate?: string) {
  const employees = db.get('employees');
  const results = [];
  for (const emp of employees) {
    try {
      const log = await sendPerformanceEmail({ employeeId: emp.employee_id, reportType, targetDate });
      results.push({ employeeId: emp.employee_id, status: 'SENT', id: log.id });
    } catch (err: any) {
      results.push({ employeeId: emp.employee_id, status: 'FAILED', error: err.message });
    }
  }
  return results;
}
