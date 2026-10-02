import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Team,
  Employee,
  TLAssignment,
  Attendance,
  Productivity,
  ACDCall,
  Feedback,
  Coaching,
  TLActivity,
  KPITarget,
  DailyPerformance,
  WeeklyPerformance,
  MonthlyPerformance,
  UploadedReport,
  ReportError,
  UnmappedRecord,
  Notification,
  EmailLog,
  AuditLog,
  SystemSettings
} from './types';

export interface DatabaseSchema {
  users: User[];
  teams: Team[];
  employees: Employee[];
  tl_assignments: TLAssignment[];
  attendance: Attendance[];
  productivity: Productivity[];
  acd_calls: ACDCall[];
  feedback: Feedback[];
  coaching: Coaching[];
  tl_activities: TLActivity[];
  kpi_targets: KPITarget[];
  daily_performance: DailyPerformance[];
  weekly_performance: WeeklyPerformance[];
  monthly_performance: MonthlyPerformance[];
  uploaded_reports: UploadedReport[];
  report_errors: ReportError[];
  unmapped_records: UnmappedRecord[];
  notifications: Notification[];
  email_logs: EmailLog[];
  audit_logs: AuditLog[];
  system_settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class Database {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, re-initializing seed data', err);
      }
    }

    const initial = this.generateSeedData();
    this.saveDataSync(initial);
    return initial;
  }

  private saveDataSync(dataToSave: DatabaseSchema) {
    this.ensureDirectory();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    this.saveDataSync(this.data);
  }

  public get<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    return this.data[table];
  }

  public set<K extends keyof DatabaseSchema>(table: K, value: DatabaseSchema[K]) {
    this.data[table] = value;
    this.save();
  }

  public update<K extends keyof DatabaseSchema>(
    table: K,
    updater: (current: DatabaseSchema[K]) => DatabaseSchema[K]
  ) {
    this.data[table] = updater(this.data[table]);
    this.save();
  }

  public generateSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = (pw: string) => bcrypt.hashSync(pw, salt);

    // Initial Teams
    const teams: Team[] = [
      {
        id: 'team-alpha',
        name: 'Team Alpha - Inbound Customer Support',
        process: 'Inbound Support',
        description: 'Primary customer inquiries, billing, and account resolutions',
        tl_id: 'usr-tl-1',
        status: 'ACTIVE',
        created_at: '2026-01-10T08:00:00.000Z'
      },
      {
        id: 'team-beta',
        name: 'Team Beta - Technical Escalations',
        process: 'Technical Support',
        description: 'Advanced technical troubleshooting and enterprise escalations',
        tl_id: 'usr-tl-2',
        status: 'ACTIVE',
        created_at: '2026-01-15T08:00:00.000Z'
      }
    ];

    // Initial Users: 1 Admin, 2 TLs, 5 Agents
    const users: User[] = [
      {
        id: 'usr-admin-1',
        username: 'admin',
        password_hash: hashPassword('Admin@12345'),
        email: 'admin@performanceteam.corp',
        employee_id: 'EMP-ADM-001',
        full_name: 'Sarah Jenkins',
        mobile: '+1-555-0100',
        designation: 'Admin',
        role: 'ADMIN',
        team_id: null,
        process: 'Operations Executive',
        reporting_tl_id: null,
        date_of_joining: '2025-01-01',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-01T09:00:00.000Z',
        created_at: '2025-01-01T08:00:00.000Z',
        updated_at: '2025-01-01T08:00:00.000Z'
      },
      {
        id: 'usr-tl-1',
        username: 'amit.verma',
        password_hash: hashPassword('TL@12345'),
        email: 'amit.verma@performanceteam.corp',
        employee_id: 'EMP-TL-101',
        full_name: 'Amit Verma',
        mobile: '+1-555-0101',
        designation: 'Team Leader',
        role: 'TEAM_LEADER',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        reporting_tl_id: null,
        date_of_joining: '2025-02-15',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T06:30:00.000Z',
        created_at: '2025-02-15T08:00:00.000Z',
        updated_at: '2025-02-15T08:00:00.000Z'
      },
      {
        id: 'usr-tl-2',
        username: 'priya.nair',
        password_hash: hashPassword('TL@12345'),
        email: 'priya.nair@performanceteam.corp',
        employee_id: 'EMP-TL-102',
        full_name: 'Priya Nair',
        mobile: '+1-555-0102',
        designation: 'Team Leader',
        role: 'TEAM_LEADER',
        team_id: 'team-beta',
        process: 'Technical Support',
        reporting_tl_id: null,
        date_of_joining: '2025-03-01',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T06:45:00.000Z',
        created_at: '2025-03-01T08:00:00.000Z',
        updated_at: '2025-03-01T08:00:00.000Z'
      },
      // 5 Agents
      {
        id: 'usr-agt-1',
        username: 'rahul.sharma',
        password_hash: hashPassword('Agent@12345'),
        email: 'rahul.sharma@performanceteam.corp',
        employee_id: 'SNB1025',
        full_name: 'Rahul Sharma',
        mobile: '+1-555-0201',
        designation: 'Agent',
        role: 'AGENT',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        reporting_tl_id: 'usr-tl-1',
        date_of_joining: '2025-04-10',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T07:00:00.000Z',
        created_at: '2025-04-10T08:00:00.000Z',
        updated_at: '2025-04-10T08:00:00.000Z'
      },
      {
        id: 'usr-agt-2',
        username: 'ananya.iyer',
        password_hash: hashPassword('Agent@12345'),
        email: 'ananya.iyer@performanceteam.corp',
        employee_id: 'SNB1026',
        full_name: 'Ananya Iyer',
        mobile: '+1-555-0202',
        designation: 'Agent',
        role: 'AGENT',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        reporting_tl_id: 'usr-tl-1',
        date_of_joining: '2025-04-12',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T07:05:00.000Z',
        created_at: '2025-04-12T08:00:00.000Z',
        updated_at: '2025-04-12T08:00:00.000Z'
      },
      {
        id: 'usr-agt-3',
        username: 'david.chen',
        password_hash: hashPassword('Agent@12345'),
        email: 'david.chen@performanceteam.corp',
        employee_id: 'SNB1027',
        full_name: 'David Chen',
        mobile: '+1-555-0203',
        designation: 'Agent',
        role: 'AGENT',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        reporting_tl_id: 'usr-tl-1',
        date_of_joining: '2025-05-01',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T07:10:00.000Z',
        created_at: '2025-05-01T08:00:00.000Z',
        updated_at: '2025-05-01T08:00:00.000Z'
      },
      {
        id: 'usr-agt-4',
        username: 'kavita.patel',
        password_hash: hashPassword('Agent@12345'),
        email: 'kavita.patel@performanceteam.corp',
        employee_id: 'SNB1028',
        full_name: 'Kavita Patel',
        mobile: '+1-555-0204',
        designation: 'Agent',
        role: 'AGENT',
        team_id: 'team-beta',
        process: 'Technical Support',
        reporting_tl_id: 'usr-tl-2',
        date_of_joining: '2025-05-15',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T07:15:00.000Z',
        created_at: '2025-05-15T08:00:00.000Z',
        updated_at: '2025-05-15T08:00:00.000Z'
      },
      {
        id: 'usr-agt-5',
        username: 'marcus.vance',
        password_hash: hashPassword('Agent@12345'),
        email: 'marcus.vance@performanceteam.corp',
        employee_id: 'SNB1029',
        full_name: 'Marcus Vance',
        mobile: '+1-555-0205',
        designation: 'Agent',
        role: 'AGENT',
        team_id: 'team-beta',
        process: 'Technical Support',
        reporting_tl_id: 'usr-tl-2',
        date_of_joining: '2025-06-01',
        status: 'APPROVED',
        failed_logins: 0,
        lock_until: null,
        last_login_at: '2026-10-02T07:12:00.000Z',
        created_at: '2025-06-01T08:00:00.000Z',
        updated_at: '2025-06-01T08:00:00.000Z'
      }
    ];

    // Central Employee Master
    const employees: Employee[] = users
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
      }));

    const tl_assignments: TLAssignment[] = [
      {
        id: 'tla-1',
        tl_id: 'usr-tl-1',
        team_id: 'team-alpha',
        assigned_at: '2025-02-15T08:00:00.000Z'
      },
      {
        id: 'tla-2',
        tl_id: 'usr-tl-2',
        team_id: 'team-beta',
        assigned_at: '2025-03-01T08:00:00.000Z'
      }
    ];

    // Configurable KPI Targets
    const kpi_targets: KPITarget[] = [
      {
        id: 'kpi-prod',
        kpi_name: 'Productivity',
        target_value: 85,
        min_acceptable_value: 75,
        max_value: 100,
        unit: '%',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'HIGHER_IS_BETTER',
        weight: 25,
        is_active: true
      },
      {
        id: 'kpi-aht',
        kpi_name: 'AHT',
        target_value: 360, // 6 minutes
        min_acceptable_value: 480, // max acceptable in seconds
        max_value: 600,
        unit: 'sec',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'LOWER_IS_BETTER',
        weight: 20,
        is_active: true
      },
      {
        id: 'kpi-quality',
        kpi_name: 'Quality',
        target_value: 92,
        min_acceptable_value: 85,
        max_value: 100,
        unit: '%',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'HIGHER_IS_BETTER',
        weight: 20,
        is_active: true
      },
      {
        id: 'kpi-csat',
        kpi_name: 'CSAT',
        target_value: 88,
        min_acceptable_value: 80,
        max_value: 100,
        unit: '%',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'HIGHER_IS_BETTER',
        weight: 15,
        is_active: true
      },
      {
        id: 'kpi-adh',
        kpi_name: 'Adherence',
        target_value: 90,
        min_acceptable_value: 82,
        max_value: 100,
        unit: '%',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'HIGHER_IS_BETTER',
        weight: 10,
        is_active: true
      },
      {
        id: 'kpi-comp',
        kpi_name: 'Compliance',
        target_value: 95,
        min_acceptable_value: 90,
        max_value: 100,
        unit: '%',
        effective_date: '2026-01-01',
        team_id: null,
        process: null,
        kpi_type: 'HIGHER_IS_BETTER',
        weight: 10,
        is_active: true
      }
    ];

    const system_settings: SystemSettings = {
      daily_email_enabled: true,
      weekly_email_enabled: true,
      monthly_email_enabled: true,
      email_send_hour: 20,
      agent_registration_approval_required: true,
      duplicate_strategy: 'UPDATE',
      session_timeout_minutes: 60,
      max_failed_logins: 5
    };

    // Realistic Demo Productivity data for yesterday (2026-10-01)
    const productivity: Productivity[] = [
      {
        id: 'prod-1',
        employee_id: 'SNB1025',
        report_date: '2026-10-01',
        report_id: 'demo-report-prod',
        login_time: '09:02:14',
        logout_time: '18:04:30',
        staffed_duration: 542, // minutes
        ready_duration: 62,
        break_duration: 48,
        wrapped_calls: 54,
        inbound_received: 56,
        manual_dials: 4,
        auto_dials: 0,
        connected_calls: 54,
        transfers: 3,
        callbacks: 1,
        ringing_time: 145,
        talk_time: 17280, // ~4.8 hours
        acw: 2700, // 45 mins
        aht: 370,
        customer_hold_duration: 540,
        created_at: '2026-10-01T19:00:00.000Z'
      },
      {
        id: 'prod-2',
        employee_id: 'SNB1026',
        report_date: '2026-10-01',
        report_id: 'demo-report-prod',
        login_time: '08:58:10',
        logout_time: '18:01:15',
        staffed_duration: 543,
        ready_duration: 45,
        break_duration: 42,
        wrapped_calls: 61,
        inbound_received: 63,
        manual_dials: 2,
        auto_dials: 0,
        connected_calls: 61,
        transfers: 2,
        callbacks: 2,
        ringing_time: 120,
        talk_time: 18900,
        acw: 2440,
        aht: 350,
        customer_hold_duration: 420,
        created_at: '2026-10-01T19:00:00.000Z'
      },
      {
        id: 'prod-3',
        employee_id: 'SNB1027',
        report_date: '2026-10-01',
        report_id: 'demo-report-prod',
        login_time: '09:22:45', // Late login
        logout_time: '18:00:10',
        staffed_duration: 518,
        ready_duration: 80,
        break_duration: 75, // High break
        wrapped_calls: 42,
        inbound_received: 45,
        manual_dials: 1,
        auto_dials: 0,
        connected_calls: 42,
        transfers: 5,
        callbacks: 3,
        ringing_time: 180,
        talk_time: 13860,
        acw: 3780,
        aht: 420,
        customer_hold_duration: 890,
        created_at: '2026-10-01T19:00:00.000Z'
      },
      {
        id: 'prod-4',
        employee_id: 'SNB1028',
        report_date: '2026-10-01',
        report_id: 'demo-report-prod',
        login_time: '09:00:05',
        logout_time: '18:05:20',
        staffed_duration: 545,
        ready_duration: 55,
        break_duration: 45,
        wrapped_calls: 58,
        inbound_received: 60,
        manual_dials: 3,
        auto_dials: 0,
        connected_calls: 58,
        transfers: 4,
        callbacks: 1,
        ringing_time: 130,
        talk_time: 18200,
        acw: 2600,
        aht: 358,
        customer_hold_duration: 460,
        created_at: '2026-10-01T19:00:00.000Z'
      },
      {
        id: 'prod-5',
        employee_id: 'SNB1029',
        report_date: '2026-10-01',
        report_id: 'demo-report-prod',
        login_time: '09:04:12',
        logout_time: '17:58:30',
        staffed_duration: 534,
        ready_duration: 50,
        break_duration: 44,
        wrapped_calls: 52,
        inbound_received: 55,
        manual_dials: 5,
        auto_dials: 0,
        connected_calls: 52,
        transfers: 3,
        callbacks: 2,
        ringing_time: 140,
        talk_time: 16500,
        acw: 2850,
        aht: 372,
        customer_hold_duration: 510,
        created_at: '2026-10-01T19:00:00.000Z'
      }
    ];

    // Demo ACD Call Details
    const acd_calls: ACDCall[] = [
      {
        id: 'call-101',
        call_id: 'ACD-998101',
        employee_id: 'SNB1025',
        agent_name: 'Rahul Sharma',
        call_date: '2026-10-01',
        call_time: '09:15:20',
        queue: 'Inbound_General',
        call_status: 'ANSWERED',
        wait_time: 14,
        talk_time: 320,
        hold_time: 40,
        acw: 45,
        disposition: 'Billing Inquiry - Resolved',
        call_notes: 'Customer asked about prorated monthly charge. Explained billing cycle details clearly.',
        campaign: 'Fall Retention 2026',
        report_id: 'demo-report-acd',
        created_at: '2026-10-01T09:22:00.000Z'
      },
      {
        id: 'call-102',
        call_id: 'ACD-998102',
        employee_id: 'SNB1025',
        agent_name: 'Rahul Sharma',
        call_date: '2026-10-01',
        call_time: '10:04:11',
        queue: 'Inbound_General',
        call_status: 'ANSWERED',
        wait_time: 25,
        talk_time: 410,
        hold_time: 60,
        acw: 50,
        disposition: 'Service Upgrade - Success',
        call_notes: 'Upgraded client fiber subscription to Gigabit tier. Sent verification email.',
        campaign: 'Fall Retention 2026',
        report_id: 'demo-report-acd',
        created_at: '2026-10-01T10:12:00.000Z'
      },
      {
        id: 'call-103',
        call_id: 'ACD-998103',
        employee_id: 'SNB1027',
        agent_name: 'David Chen',
        call_date: '2026-10-01',
        call_time: '11:15:00',
        queue: 'Inbound_General',
        call_status: 'TRANSFERRED',
        wait_time: 45,
        talk_time: 580,
        hold_time: 180,
        acw: 90,
        disposition: 'Tier 2 Escalation Required',
        call_notes: 'Complex account unlock failure due to multiple authenticator mismatches. Transferred to Tier 2.',
        campaign: 'Fall Retention 2026',
        report_id: 'demo-report-acd',
        created_at: '2026-10-01T11:27:00.000Z'
      },
      {
        id: 'call-104',
        call_id: 'ACD-998104',
        employee_id: 'SNB1028',
        agent_name: 'Kavita Patel',
        call_date: '2026-10-01',
        call_time: '14:22:30',
        queue: 'Tech_Escalation',
        call_status: 'ANSWERED',
        wait_time: 18,
        talk_time: 340,
        hold_time: 30,
        acw: 35,
        disposition: 'Router Config Restored',
        call_notes: 'Assisted subscriber in rebooting gateway & updating static DNS parameters.',
        campaign: 'Enterprise Network Care',
        report_id: 'demo-report-acd',
        created_at: '2026-10-01T14:30:00.000Z'
      }
    ];

    // Attendance
    const attendance: Attendance[] = [
      {
        id: 'att-1',
        employee_id: 'SNB1025',
        date: '2026-10-01',
        login_time: '09:02:14',
        logout_time: '18:04:30',
        working_duration: 494,
        break_duration: 48,
        status: 'PRESENT',
        remarks: 'Normal working shift',
        updated_by: 'system',
        created_at: '2026-10-01T09:02:14.000Z'
      },
      {
        id: 'att-2',
        employee_id: 'SNB1026',
        date: '2026-10-01',
        login_time: '08:58:10',
        logout_time: '18:01:15',
        working_duration: 501,
        break_duration: 42,
        status: 'PRESENT',
        remarks: 'Punctual check-in',
        updated_by: 'system',
        created_at: '2026-10-01T08:58:10.000Z'
      },
      {
        id: 'att-3',
        employee_id: 'SNB1027',
        date: '2026-10-01',
        login_time: '09:22:45',
        logout_time: '18:00:10',
        working_duration: 443,
        break_duration: 75,
        status: 'LATE_LOGIN',
        remarks: 'Logged in 22 mins past schedule. Break exceeded by 15 mins.',
        updated_by: 'usr-tl-1',
        created_at: '2026-10-01T09:22:45.000Z'
      },
      {
        id: 'att-4',
        employee_id: 'SNB1028',
        date: '2026-10-01',
        login_time: '09:00:05',
        logout_time: '18:05:20',
        working_duration: 500,
        break_duration: 45,
        status: 'PRESENT',
        remarks: 'Standard shift',
        updated_by: 'system',
        created_at: '2026-10-01T09:00:05.000Z'
      },
      {
        id: 'att-5',
        employee_id: 'SNB1029',
        date: '2026-10-01',
        login_time: '09:04:12',
        logout_time: '17:58:30',
        working_duration: 490,
        break_duration: 44,
        status: 'PRESENT',
        remarks: 'Standard shift',
        updated_by: 'system',
        created_at: '2026-10-01T09:04:12.000Z'
      }
    ];

    // Feedback
    const feedback: Feedback[] = [
      {
        id: 'fb-101',
        employee_id: 'SNB1027',
        call_id: 'ACD-998103',
        feedback_date: '2026-10-01',
        queue: 'Inbound_General',
        campaign: 'Fall Retention 2026',
        partner_feedback: 'Customer reported long hold time without refresh updates and felt rushed when transfer initiated.',
        category: 'Customer Satisfaction',
        score: 68,
        tl_observation: 'Agent placed customer on hold for 3 minutes without providing mandatory 60-second status updates.',
        root_cause: 'Lacked familiarity with new verification bypass procedure.',
        action_taken: 'Conducted 1-on-1 coaching on Active Hold protocols and Warm Transfer standards.',
        coaching_given: 'Hold Refresh Guidelines refresher and simulation completed.',
        improvement_required: 'Maintain hold updates every 45-60 seconds; complete seamless warm hand-off.',
        follow_up_date: '2026-10-05',
        status: 'IN_PROGRESS',
        tl_remarks: 'David was receptive to coaching and showed understanding of the warm transfer checklist.',
        tl_id: 'usr-tl-1',
        report_id: 'demo-report-fb',
        created_at: '2026-10-01T15:30:00.000Z',
        updated_at: '2026-10-01T16:00:00.000Z'
      },
      {
        id: 'fb-102',
        employee_id: 'SNB1025',
        call_id: 'ACD-998102',
        feedback_date: '2026-10-01',
        queue: 'Inbound_General',
        campaign: 'Fall Retention 2026',
        partner_feedback: 'Outstanding empathy and concise plan explanations. Customer commended Rahul by name.',
        category: 'Quality',
        score: 98,
        tl_observation: 'Exemplary compliance with SOP and greeting etiquette.',
        root_cause: 'High domain mastery and proactive active listening.',
        action_taken: 'Shared call recording as gold standard in team huddle.',
        coaching_given: 'Commendation and leadership appreciation.',
        improvement_required: 'Continue maintaining high CSAT benchmark.',
        follow_up_date: '2026-10-15',
        status: 'CLOSED',
        tl_remarks: 'Nominated for Agent of the Month award.',
        tl_id: 'usr-tl-1',
        report_id: 'demo-report-fb',
        created_at: '2026-10-01T16:30:00.000Z',
        updated_at: '2026-10-01T17:00:00.000Z'
      }
    ];

    // Coaching Tracker
    const coaching: Coaching[] = [
      {
        id: 'coach-1',
        employee_id: 'SNB1027',
        tl_id: 'usr-tl-1',
        feedback_id: 'fb-101',
        issue_identified: 'Extended customer hold duration and missing progress touchpoints',
        root_cause: 'Unsure of tier-2 escalation queue path while customer was waiting on line',
        coaching_summary: 'Reviewed Hold Etiquette Standard Operating Procedure. Practiced 45-second check-in script.',
        action_plan: '1. Use standard hold timer reminder widget. 2. Announce return every 60s max. 3. Review escalation path sheet.',
        follow_up_date: '2026-10-05',
        performance_check_notes: 'Scheduled for call review on Monday shift.',
        status: 'IN_PROGRESS',
        created_at: '2026-10-01T16:15:00.000Z',
        updated_at: '2026-10-01T16:15:00.000Z'
      }
    ];

    // TL Activities
    const tl_activities: TLActivity[] = [
      {
        id: 'tla-act-1',
        tl_id: 'usr-tl-1',
        team_id: 'team-alpha',
        employee_id: 'SNB1027',
        activity_type: 'Coaching Session',
        activity_date: '2026-10-01',
        activity_time: '16:00',
        description: 'Conducted 1-on-1 coaching with David Chen on Active Hold etiquette and warm transfers.',
        status: 'Completed',
        remarks: 'Action plan agreed with follow-up review set for Oct 5.',
        created_at: '2026-10-01T16:30:00.000Z'
      },
      {
        id: 'tla-act-2',
        tl_id: 'usr-tl-1',
        team_id: 'team-alpha',
        employee_id: null,
        activity_type: 'Team Huddle',
        activity_date: '2026-10-01',
        activity_time: '08:45',
        description: 'Morning alignment huddle on monthly retention targets and new billing FAQ updates.',
        status: 'Completed',
        remarks: 'Full team attendance.',
        created_at: '2026-10-01T09:00:00.000Z'
      }
    ];

    // Daily Performance for yesterday
    const daily_performance: DailyPerformance[] = [
      {
        id: 'dp-1',
        employee_id: 'SNB1025',
        date: '2026-10-01',
        calls: 54,
        connected_calls: 54,
        aht: 370,
        talk_time: 17280,
        acw: 2700,
        productivity_pct: 88.5,
        quality_score: 95.0,
        csat_score: 92.0,
        adherence_pct: 94.0,
        compliance_score: 98.0,
        attendance_status: 'PRESENT',
        feedback_count: 1,
        coaching_count: 0,
        exceptions: [],
        calculated_at: '2026-10-01T20:00:00.000Z'
      },
      {
        id: 'dp-2',
        employee_id: 'SNB1026',
        date: '2026-10-01',
        calls: 61,
        connected_calls: 61,
        aht: 350,
        talk_time: 18900,
        acw: 2440,
        productivity_pct: 91.2,
        quality_score: 94.0,
        csat_score: 90.0,
        adherence_pct: 96.0,
        compliance_score: 97.0,
        attendance_status: 'PRESENT',
        feedback_count: 0,
        coaching_count: 0,
        exceptions: [],
        calculated_at: '2026-10-01T20:00:00.000Z'
      },
      {
        id: 'dp-3',
        employee_id: 'SNB1027',
        date: '2026-10-01',
        calls: 42,
        connected_calls: 42,
        aht: 420, // Above target
        talk_time: 13860,
        acw: 3780,
        productivity_pct: 74.5, // Below 75 min
        quality_score: 78.0,
        csat_score: 68.0,
        adherence_pct: 79.0,
        compliance_score: 82.0,
        attendance_status: 'LATE_LOGIN',
        feedback_count: 1,
        coaching_count: 1,
        exceptions: ['Late Login', 'High Break Duration', 'Low Productivity', 'High AHT', 'Low CSAT'],
        calculated_at: '2026-10-01T20:00:00.000Z'
      },
      {
        id: 'dp-4',
        employee_id: 'SNB1028',
        date: '2026-10-01',
        calls: 58,
        connected_calls: 58,
        aht: 358,
        talk_time: 18200,
        acw: 2600,
        productivity_pct: 89.0,
        quality_score: 93.0,
        csat_score: 89.0,
        adherence_pct: 92.0,
        compliance_score: 96.0,
        attendance_status: 'PRESENT',
        feedback_count: 0,
        coaching_count: 0,
        exceptions: [],
        calculated_at: '2026-10-01T20:00:00.000Z'
      },
      {
        id: 'dp-5',
        employee_id: 'SNB1029',
        date: '2026-10-01',
        calls: 52,
        connected_calls: 52,
        aht: 372,
        talk_time: 16500,
        acw: 2850,
        productivity_pct: 86.4,
        quality_score: 91.0,
        csat_score: 87.0,
        adherence_pct: 91.0,
        compliance_score: 95.0,
        attendance_status: 'PRESENT',
        feedback_count: 0,
        coaching_count: 0,
        exceptions: [],
        calculated_at: '2026-10-01T20:00:00.000Z'
      }
    ];

    // Weekly Performance
    const weekly_performance: WeeklyPerformance[] = [
      {
        id: 'wp-1',
        employee_id: 'SNB1025',
        week_start: '2026-09-28',
        week_end: '2026-10-02',
        avg_productivity: 88.2,
        avg_aht: 368,
        avg_csat: 91.5,
        avg_quality: 94.8,
        avg_adherence: 93.5,
        attendance_rate: 100,
        total_calls: 245,
        feedback_count: 1,
        coaching_count: 0,
        week_over_week_diff: 2.4,
        areas_requiring_attention: [],
        calculated_at: '2026-10-01T21:00:00.000Z'
      },
      {
        id: 'wp-3',
        employee_id: 'SNB1027',
        week_start: '2026-09-28',
        week_end: '2026-10-02',
        avg_productivity: 76.8,
        avg_aht: 412,
        avg_csat: 72.0,
        avg_quality: 80.5,
        avg_adherence: 81.2,
        attendance_rate: 80,
        total_calls: 190,
        feedback_count: 2,
        coaching_count: 1,
        week_over_week_diff: -4.8,
        areas_requiring_attention: ['AHT Management', 'Customer Hold Etiquette', 'Shift Punctuality'],
        calculated_at: '2026-10-01T21:00:00.000Z'
      }
    ];

    // Monthly Performance
    const monthly_performance: MonthlyPerformance[] = [
      {
        id: 'mp-1',
        employee_id: 'SNB1025',
        month: 9,
        year: 2026,
        attendance_rate: 98.0,
        productivity: 87.5,
        quality: 94.2,
        csat: 91.0,
        aht: 365,
        adherence: 93.0,
        compliance: 97.5,
        feedback_count: 2,
        coaching_count: 0,
        escalations_count: 0,
        trend: 'UPWARD',
        calculated_at: '2026-10-01T00:00:00.000Z'
      },
      {
        id: 'mp-3',
        employee_id: 'SNB1027',
        month: 9,
        year: 2026,
        attendance_rate: 90.0,
        productivity: 78.5,
        quality: 83.0,
        csat: 75.0,
        aht: 405,
        adherence: 83.5,
        compliance: 88.0,
        feedback_count: 4,
        coaching_count: 2,
        escalations_count: 1,
        trend: 'DOWNWARD',
        calculated_at: '2026-10-01T00:00:00.000Z'
      }
    ];

    // Uploaded reports history
    const uploaded_reports: UploadedReport[] = [
      {
        id: 'demo-report-prod',
        file_name: 'Productivity_Daily_Report_20261001.csv',
        file_size: 45200,
        report_type: 'PRODUCTIVITY',
        uploaded_by_id: 'usr-admin-1',
        uploaded_by_name: 'Sarah Jenkins (Admin)',
        report_date: '2026-10-01',
        team_id: null,
        process: 'Operations',
        total_rows: 5,
        processed_rows: 5,
        updated_rows: 0,
        duplicate_rows: 0,
        invalid_employee_rows: 0,
        missing_field_rows: 0,
        unmapped_rows: 0,
        status: 'COMPLETED',
        created_at: '2026-10-01T19:00:00.000Z'
      },
      {
        id: 'demo-report-acd',
        file_name: 'ACD_Call_Details_20261001.xlsx',
        file_size: 125000,
        report_type: 'ACD_CALLS',
        uploaded_by_id: 'usr-tl-1',
        uploaded_by_name: 'Amit Verma (Team Leader)',
        report_date: '2026-10-01',
        team_id: 'team-alpha',
        process: 'Inbound Support',
        total_rows: 4,
        processed_rows: 4,
        updated_rows: 0,
        duplicate_rows: 0,
        invalid_employee_rows: 0,
        missing_field_rows: 0,
        unmapped_rows: 0,
        status: 'COMPLETED',
        created_at: '2026-10-01T19:15:00.000Z'
      }
    ];

    // Notifications
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        user_id: 'usr-agt-3',
        title: 'New Coaching Action Plan',
        message: 'Amit Verma assigned an action plan regarding Active Hold & Transfer etiquette.',
        type: 'COACHING',
        link: '/coaching',
        is_read: false,
        created_at: '2026-10-01T16:15:00.000Z'
      },
      {
        id: 'notif-2',
        user_id: 'usr-tl-1',
        title: 'Performance Exception Alert',
        message: 'Agent David Chen logged 5 exceptions today (Late Login, High AHT, Low CSAT).',
        type: 'PERFORMANCE',
        link: '/performance',
        is_read: true,
        created_at: '2026-10-01T20:00:00.000Z'
      },
      {
        id: 'notif-3',
        user_id: 'usr-admin-1',
        title: 'Report Processed Successfully',
        message: 'Productivity_Daily_Report_20261001.csv processed 5 records without errors.',
        type: 'REPORT',
        link: '/reports',
        is_read: true,
        created_at: '2026-10-01T19:00:00.000Z'
      }
    ];

    // Email logs
    const email_logs: EmailLog[] = [
      {
        id: 'email-log-1',
        recipient_email: 'rahul.sharma@performanceteam.corp',
        employee_id: 'SNB1025',
        report_type: 'DAILY',
        subject: 'Daily Performance Summary - Rahul Sharma [SNB1025] - 2026-10-01',
        content_html: '<h1>Daily Performance Summary</h1><p>Productivity: 88.5%, AHT: 370s, CSAT: 92%</p>',
        sent_at: '2026-10-01T20:30:00.000Z',
        delivery_status: 'SENT',
        retry_count: 0
      },
      {
        id: 'email-log-2',
        recipient_email: 'david.chen@performanceteam.corp',
        employee_id: 'SNB1027',
        report_type: 'DAILY',
        subject: 'Daily Performance Summary - David Chen [SNB1027] - 2026-10-01',
        content_html: '<h1>Daily Performance Summary</h1><p>Productivity: 74.5%, AHT: 420s, Exceptions identified.</p>',
        sent_at: '2026-10-01T20:30:00.000Z',
        delivery_status: 'SENT',
        retry_count: 0
      }
    ];

    // Audit Logs
    const audit_logs: AuditLog[] = [
      {
        id: 'audit-1',
        user_id: 'usr-admin-1',
        username: 'admin',
        role: 'ADMIN',
        action: 'ASSIGN_TL_TEAM',
        module: 'Team Management',
        record_id: 'team-alpha',
        previous_value: 'null',
        new_value: 'usr-tl-1',
        ip_address: '127.0.0.1',
        created_at: '2026-10-01T10:00:00.000Z'
      },
      {
        id: 'audit-2',
        user_id: 'usr-tl-1',
        username: 'amit.verma',
        role: 'TEAM_LEADER',
        action: 'ADD_FEEDBACK',
        module: 'Feedback',
        record_id: 'fb-101',
        previous_value: '',
        new_value: 'Category: Customer Satisfaction, Score: 68',
        ip_address: '127.0.0.1',
        created_at: '2026-10-01T15:30:00.000Z'
      },
      {
        id: 'audit-3',
        user_id: 'usr-admin-1',
        username: 'admin',
        role: 'ADMIN',
        action: 'UPLOAD_REPORT',
        module: 'Report Processing',
        record_id: 'demo-report-prod',
        previous_value: '',
        new_value: 'File: Productivity_Daily_Report_20261001.csv, Rows: 5',
        ip_address: '127.0.0.1',
        created_at: '2026-10-01T19:00:00.000Z'
      }
    ];

    return {
      users,
      teams,
      employees,
      tl_assignments,
      attendance,
      productivity,
      acd_calls,
      feedback,
      coaching,
      tl_activities,
      kpi_targets,
      daily_performance,
      weekly_performance,
      monthly_performance,
      uploaded_reports,
      report_errors: [],
      unmapped_records: [],
      notifications,
      email_logs,
      audit_logs,
      system_settings
    };
  }
}

export const db = new Database();
