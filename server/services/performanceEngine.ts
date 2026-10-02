import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { DailyPerformance, WeeklyPerformance, MonthlyPerformance, KPITarget } from '../types';

export function calculateDailyPerformanceForEmployee(employeeId: string, date: string): DailyPerformance | null {
  const prodRecords = db.get('productivity').filter(
    (p) => p.employee_id === employeeId && p.report_date === date
  );
  const acdRecords = db.get('acd_calls').filter(
    (c) => c.employee_id === employeeId && c.call_date === date
  );
  const attRecords = db.get('attendance').filter(
    (a) => a.employee_id === employeeId && a.date === date
  );
  const fbRecords = db.get('feedback').filter(
    (f) => f.employee_id === employeeId && f.feedback_date === date
  );
  const coachRecords = db.get('coaching').filter(
    (c) => c.employee_id === employeeId && c.created_at.startsWith(date)
  );

  const kpis = db.get('kpi_targets').filter((k) => k.is_active);

  // If no productivity record or ACD record, but attendance exists:
  const latestProd = prodRecords[prodRecords.length - 1];
  const attendance = attRecords[0];

  if (!latestProd && acdRecords.length === 0 && !attendance) {
    return null;
  }

  // Aggregate calls and times
  let totalCalls = latestProd ? (latestProd.wrapped_calls || latestProd.connected_calls || latestProd.inbound_received) : acdRecords.length;
  let connectedCalls = latestProd ? latestProd.connected_calls : acdRecords.filter(c => c.call_status === 'ANSWERED').length;
  let talkTime = latestProd ? latestProd.talk_time : acdRecords.reduce((sum, c) => sum + (c.talk_time || 0), 0);
  let acwTime = latestProd ? latestProd.acw : acdRecords.reduce((sum, c) => sum + (c.acw || 0), 0);

  // AHT in seconds: (talk_time + acw) / total_calls
  let aht = 0;
  if (connectedCalls > 0) {
    aht = Math.round((talkTime + acwTime) / connectedCalls);
  } else if (latestProd && latestProd.aht) {
    aht = latestProd.aht;
  }

  // Productivity calculation
  let productivityPct = 85.0;
  if (latestProd && latestProd.staffed_duration > 0) {
    const productiveMinutes = (talkTime + acwTime + (latestProd.ready_duration * 60)) / 60;
    productivityPct = Math.min(100, Math.round((productiveMinutes / latestProd.staffed_duration) * 100 * 10) / 10);
  }

  // Quality & CSAT
  let qualityScore = 92.0;
  let csatScore = 88.0;
  const scoredFb = fbRecords.filter(f => f.score !== undefined);
  if (scoredFb.length > 0) {
    const avgScore = scoredFb.reduce((acc, f) => acc + (f.score || 0), 0) / scoredFb.length;
    qualityScore = Math.round(avgScore * 10) / 10;
    csatScore = Math.round(avgScore * 0.95 * 10) / 10;
  }

  // Adherence
  let adherencePct = 92.0;
  if (attendance) {
    if (attendance.status === 'LATE_LOGIN' || attendance.status === 'EARLY_LOGOUT') {
      adherencePct = 78.0;
    } else if (attendance.break_duration > 60) {
      adherencePct = 82.0;
    } else if (attendance.status === 'ABSENT') {
      adherencePct = 0.0;
    }
  }

  // Compliance
  let complianceScore = 95.0;
  const negativeFb = fbRecords.filter(f => (f.score !== undefined && f.score < 75) || f.category === 'Compliance');
  if (negativeFb.length > 0) {
    complianceScore = Math.max(60, 95 - (negativeFb.length * 15));
  }

  // Exception Detection
  const exceptions: string[] = [];

  if (attendance && attendance.status === 'LATE_LOGIN') {
    exceptions.push('Late Login');
  }
  if (attendance && attendance.status === 'EARLY_LOGOUT') {
    exceptions.push('Early Logout');
  }
  if ((latestProd && latestProd.break_duration > 60) || (attendance && attendance.break_duration > 60)) {
    exceptions.push('High Break Duration');
  }

  const prodKpi = kpis.find(k => k.kpi_name === 'Productivity');
  if (prodKpi && productivityPct < prodKpi.min_acceptable_value) {
    exceptions.push(`Low Productivity (${productivityPct}% < ${prodKpi.min_acceptable_value}%)`);
  }

  const ahtKpi = kpis.find(k => k.kpi_name === 'AHT');
  if (ahtKpi && aht > ahtKpi.min_acceptable_value) {
    exceptions.push(`High AHT (${aht}s > ${ahtKpi.min_acceptable_value}s)`);
  }

  const csatKpi = kpis.find(k => k.kpi_name === 'CSAT');
  if (csatKpi && csatScore < csatKpi.min_acceptable_value) {
    exceptions.push(`Low CSAT (${csatScore}% < ${csatKpi.min_acceptable_value}%)`);
  }

  const qualKpi = kpis.find(k => k.kpi_name === 'Quality');
  if (qualKpi && qualityScore < qualKpi.min_acceptable_value) {
    exceptions.push(`Low Quality (${qualityScore}% < ${qualKpi.min_acceptable_value}%)`);
  }

  const adhKpi = kpis.find(k => k.kpi_name === 'Adherence');
  if (adhKpi && adherencePct < adhKpi.min_acceptable_value) {
    exceptions.push(`Non-Adherence (${adherencePct}% < ${adhKpi.min_acceptable_value}%)`);
  }

  const perfRecord: DailyPerformance = {
    id: `dp-${employeeId}-${date}`,
    employee_id: employeeId,
    date,
    calls: totalCalls,
    connected_calls: connectedCalls,
    aht,
    talk_time: talkTime,
    acw: acwTime,
    productivity_pct: productivityPct,
    quality_score: qualityScore,
    csat_score: csatScore,
    adherence_pct: adherencePct,
    compliance_score: complianceScore,
    attendance_status: attendance ? attendance.status : 'PRESENT',
    feedback_count: fbRecords.length,
    coaching_count: coachRecords.length,
    exceptions,
    calculated_at: new Date().toISOString()
  };

  return perfRecord;
}

export function recalculateAllPerformancesForDate(date: string) {
  const employees = db.get('employees');
  const existingDaily = db.get('daily_performance');
  const updatedDaily: DailyPerformance[] = [...existingDaily];

  employees.forEach((emp) => {
    const calculated = calculateDailyPerformanceForEmployee(emp.employee_id, date);
    if (calculated) {
      const idx = updatedDaily.findIndex(
        (d) => d.employee_id === emp.employee_id && d.date === date
      );
      if (idx >= 0) {
        updatedDaily[idx] = calculated;
      } else {
        updatedDaily.push(calculated);
      }
    }
  });

  db.set('daily_performance', updatedDaily);
  recalculateWeeklyAndMonthlyRollups();
}

export function recalculateWeeklyAndMonthlyRollups() {
  const employees = db.get('employees');
  const daily = db.get('daily_performance');
  const feedback = db.get('feedback');
  const coaching = db.get('coaching');

  // Group daily by employee
  const empDailyMap: Record<string, DailyPerformance[]> = {};
  daily.forEach((d) => {
    if (!empDailyMap[d.employee_id]) empDailyMap[d.employee_id] = [];
    empDailyMap[d.employee_id].push(d);
  });

  const weeklyList: WeeklyPerformance[] = [];
  const monthlyList: MonthlyPerformance[] = [];

  employees.forEach((emp) => {
    const list = empDailyMap[emp.employee_id] || [];
    if (list.length === 0) return;

    // Weekly rollup (last 7 days or current week)
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    const recent7 = sorted.slice(0, 7);

    const avgProd = recent7.reduce((s, r) => s + r.productivity_pct, 0) / recent7.length;
    const avgAht = recent7.reduce((s, r) => s + r.aht, 0) / recent7.length;
    const avgCsat = recent7.reduce((s, r) => s + r.csat_score, 0) / recent7.length;
    const avgQuality = recent7.reduce((s, r) => s + r.quality_score, 0) / recent7.length;
    const avgAdherence = recent7.reduce((s, r) => s + r.adherence_pct, 0) / recent7.length;
    const totalCalls = recent7.reduce((s, r) => s + r.calls, 0);

    const presentDays = recent7.filter(r => r.attendance_status === 'PRESENT' || r.attendance_status === 'LATE_LOGIN').length;
    const attendanceRate = Math.round((presentDays / recent7.length) * 100);

    const areas: string[] = [];
    if (avgProd < 80) areas.push('Productivity Improvement Required');
    if (avgAht > 400) areas.push('High AHT Reduction');
    if (avgCsat < 80) areas.push('CSAT & Customer Sentiment Coaching');
    if (avgAdherence < 85) areas.push('Schedule Punctuality');

    weeklyList.push({
      id: `wp-${emp.employee_id}-${recent7[0].date}`,
      employee_id: emp.employee_id,
      week_start: recent7[recent7.length - 1].date,
      week_end: recent7[0].date,
      avg_productivity: Math.round(avgProd * 10) / 10,
      avg_aht: Math.round(avgAht),
      avg_csat: Math.round(avgCsat * 10) / 10,
      avg_quality: Math.round(avgQuality * 10) / 10,
      avg_adherence: Math.round(avgAdherence * 10) / 10,
      attendance_rate: attendanceRate,
      total_calls: totalCalls,
      feedback_count: feedback.filter(f => f.employee_id === emp.employee_id).length,
      coaching_count: coaching.filter(c => c.employee_id === emp.employee_id).length,
      week_over_week_diff: +(Math.random() * 4 - 2).toFixed(1),
      areas_requiring_attention: areas,
      calculated_at: new Date().toISOString()
    });

    // Monthly rollup
    monthlyList.push({
      id: `mp-${emp.employee_id}-2026-10`,
      employee_id: emp.employee_id,
      month: 10,
      year: 2026,
      attendance_rate: attendanceRate,
      productivity: Math.round(avgProd * 10) / 10,
      quality: Math.round(avgQuality * 10) / 10,
      csat: Math.round(avgCsat * 10) / 10,
      aht: Math.round(avgAht),
      adherence: Math.round(avgAdherence * 10) / 10,
      compliance: 94.0,
      feedback_count: feedback.filter(f => f.employee_id === emp.employee_id).length,
      coaching_count: coaching.filter(c => c.employee_id === emp.employee_id).length,
      escalations_count: feedback.filter(f => f.employee_id === emp.employee_id && f.category === 'Escalation').length,
      trend: avgProd >= 85 ? 'UPWARD' : avgProd >= 78 ? 'STABLE' : 'DOWNWARD',
      calculated_at: new Date().toISOString()
    });
  });

  db.set('weekly_performance', weeklyList);
  db.set('monthly_performance', monthlyList);
}
