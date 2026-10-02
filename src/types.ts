export type Role = 'ADMIN' | 'AM' | 'TL' | 'TEAM_LEADER' | 'AGENT';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'WEEK_OFF' | 'HALF_DAY' | 'LATE_LOGIN' | 'EARLY_LOGOUT';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'IMPROVED' | 'CLOSED';
export type CoachingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FOLLOW_UP_PENDING' | 'PERFORMANCE_CHECK' | 'CLOSED';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRY';
export type ReportType = 
  | 'PRODUCTIVITY'
  | 'ACD_CALLS'
  | 'PARTNER_FEEDBACK'
  | 'ATTENDANCE'
  | 'QUALITY'
  | 'CSAT'
  | 'ADHERENCE'
  | 'OTHER';

export interface User {
  id: string;
  username: string;
  email: string;
  employee_id: string;
  full_name: string;
  mobile: string;
  designation: string;
  role: Role;
  team_id: string | null;
  am_id?: string | null;
  process: string;
  reporting_tl_id: string | null;
  date_of_joining: string;
  status: UserStatus;
  failed_logins: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  process: string;
  description: string;
  tl_id: string | null;
  tl_name?: string;
  am_id?: string | null;
  am_name?: string;
  agent_count?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Employee {
  employee_id: string;
  user_id: string;
  full_name: string;
  email: string;
  mobile: string;
  designation: string;
  team_id: string | null;
  am_id?: string | null;
  reporting_tl_id: string | null;
  process: string;
  status: UserStatus;
  date_of_joining: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  login_time: string;
  logout_time: string;
  working_duration: number;
  break_duration: number;
  status: AttendanceStatus;
  remarks: string;
  updated_by: string;
  created_at: string;
}

export interface Productivity {
  id: string;
  employee_id: string;
  report_date: string;
  report_id: string;
  login_time: string;
  logout_time: string;
  staffed_duration: number;
  ready_duration: number;
  break_duration: number;
  wrapped_calls: number;
  inbound_received: number;
  manual_dials: number;
  auto_dials: number;
  connected_calls: number;
  transfers: number;
  callbacks: number;
  ringing_time: number;
  talk_time: number;
  acw: number;
  aht: number;
  customer_hold_duration: number;
  created_at: string;
}

export interface ACDCall {
  id: string;
  call_id: string;
  employee_id: string;
  agent_name: string;
  call_date: string;
  call_time: string;
  queue: string;
  call_status: 'ANSWERED' | 'ABANDONED' | 'TRANSFERRED' | 'VOICEMAIL';
  wait_time: number;
  talk_time: number;
  hold_time: number;
  acw: number;
  disposition: string;
  call_notes: string;
  campaign: string;
  report_id: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  employee_id: string;
  employee_name?: string;
  call_id?: string;
  feedback_date: string;
  queue?: string;
  campaign?: string;
  partner_feedback: string;
  category: 'Quality' | 'Process' | 'Soft Skills' | 'Compliance' | 'Escalation' | 'Customer Satisfaction';
  score?: number;
  tl_observation?: string;
  root_cause?: string;
  action_taken?: string;
  coaching_given?: string;
  improvement_required?: string;
  follow_up_date?: string;
  status: FeedbackStatus;
  tl_remarks?: string;
  tl_id?: string;
  tl_name?: string;
  report_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Coaching {
  id: string;
  employee_id: string;
  employee_name?: string;
  tl_id: string;
  tl_name?: string;
  feedback_id?: string;
  issue_identified: string;
  root_cause: string;
  coaching_summary: string;
  action_plan: string;
  follow_up_date: string;
  performance_check_notes?: string;
  status: CoachingStatus;
  created_at: string;
  updated_at: string;
}

export interface TLActivity {
  id: string;
  tl_id: string;
  tl_name?: string;
  team_id: string;
  employee_id?: string | null;
  employee_name?: string | null;
  activity_type: string;
  activity_date: string;
  activity_time: string;
  description: string;
  status: string;
  remarks: string;
  created_at: string;
}

export interface KPITarget {
  id: string;
  kpi_name: string;
  target_value: number;
  min_acceptable_value: number;
  max_value?: number;
  unit: '%' | 'sec' | 'min' | 'score' | 'count';
  effective_date: string;
  kpi_type: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  weight: number;
  is_active: boolean;
}

export interface DailyPerformance {
  id: string;
  employee_id: string;
  employee_name?: string;
  team_name?: string;
  date: string;
  calls: number;
  connected_calls: number;
  aht: number;
  talk_time: number;
  acw: number;
  productivity_pct: number;
  quality_score: number;
  csat_score: number;
  adherence_pct: number;
  compliance_score: number;
  attendance_status: AttendanceStatus;
  feedback_count: number;
  coaching_count: number;
  exceptions: string[];
  calculated_at: string;
}

export interface WeeklyPerformance {
  id: string;
  employee_id: string;
  employee_name?: string;
  week_start: string;
  week_end: string;
  avg_productivity: number;
  avg_aht: number;
  avg_csat: number;
  avg_quality: number;
  avg_adherence: number;
  attendance_rate: number;
  total_calls: number;
  feedback_count: number;
  coaching_count: number;
  week_over_week_diff?: number;
  areas_requiring_attention: string[];
  calculated_at: string;
}

export interface MonthlyPerformance {
  id: string;
  employee_id: string;
  employee_name?: string;
  month: number;
  year: number;
  attendance_rate: number;
  productivity: number;
  quality: number;
  csat: number;
  aht: number;
  adherence: number;
  compliance: number;
  feedback_count: number;
  coaching_count: number;
  escalations_count: number;
  trend: 'UPWARD' | 'STABLE' | 'DOWNWARD';
  calculated_at: string;
}

export interface UploadedReport {
  id: string;
  file_name: string;
  file_size: number;
  storage_path?: string;
  report_type: ReportType;
  uploaded_by_id: string;
  uploaded_by_name: string;
  report_date: string;
  team_id?: string | null;
  process?: string | null;
  total_rows: number;
  processed_rows: number;
  updated_rows: number;
  duplicate_rows: number;
  invalid_employee_rows: number;
  missing_field_rows: number;
  unmapped_rows: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  error_details?: string;
  created_at: string;
}

export interface ReportError {
  id: string;
  report_id: string;
  row_number: number;
  employee_identifier: string;
  error_type: string;
  reason: string;
  raw_row: Record<string, any>;
  created_at: string;
}

export interface UnmappedRecord {
  id: string;
  report_id: string;
  report_type: ReportType;
  raw_identifier: string;
  identifier_type: 'EMPLOYEE_ID' | 'AGENT_ID' | 'USERNAME' | 'EMAIL';
  suggested_name?: string;
  row_data: Record<string, any>;
  status: 'UNRESOLVED' | 'RESOLVED' | 'IGNORED';
  resolved_employee_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'FEEDBACK' | 'COACHING' | 'FOLLOW_UP' | 'PERFORMANCE' | 'REPORT' | 'APPROVAL' | 'ANNOUNCEMENT';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  employee_id: string;
  report_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  subject: string;
  content_html: string;
  sent_at: string;
  delivery_status: EmailStatus;
  retry_count: number;
  error_message?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  role: Role;
  action: string;
  module: string;
  record_id?: string;
  previous_value?: string;
  new_value?: string;
  ip_address: string;
  created_at: string;
}

export interface SystemSettings {
  daily_email_enabled: boolean;
  weekly_email_enabled: boolean;
  monthly_email_enabled: boolean;
  email_send_hour: number;
  agent_registration_approval_required: boolean;
  duplicate_strategy: 'SKIP' | 'UPDATE' | 'REPLACE';
  session_timeout_minutes: number;
  max_failed_logins: number;
}
