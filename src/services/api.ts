import {
  User,
  Team,
  Employee,
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
} from '../types';

const TOKEN_KEY = 'eptms_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User; redirectUrl?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (data: any) =>
    request<{ message: string; status: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  quickSwitch: (params: { role?: string; username?: string }) =>
    request<{ token: string; user: User; redirectUrl?: string }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  getMe: () =>
    request<{ user: User; redirectUrl?: string; teamName: string | null; reportingTlName: string | null }>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Dashboard Overview
  getDashboardOverview: () =>
    request<any>('/dashboard/overview'),

  getAdminDashboard: () =>
    request<any>('/dashboard/admin'),

  getAMDashboard: () =>
    request<any>('/dashboard/am'),

  getTLDashboard: () =>
    request<any>('/dashboard/tl'),

  getAgentDashboard: (employeeId?: string) =>
    request<any>(employeeId ? `/dashboard/agent?employee_id=${encodeURIComponent(employeeId)}` : '/dashboard/agent'),

  // Admin User Management
  getUsers: (params?: { search?: string; role?: string; status?: string; team_id?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ users: User[]; total: number; page: number; totalPages: number }>(`/admin/users?${query}`);
  },

  updateUserStatus: (id: string, status: string, remarks?: string) =>
    request<{ message: string; user: User }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks })
    }),

  updateUser: (id: string, data: any) =>
    request<{ message: string; user: User }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Teams & TLs
  getTeams: () =>
    request<Team[]>('/teams'),

  createTeam: (data: Partial<Team>) =>
    request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTeam: (id: string, data: Partial<Team>) =>
    request<Team>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  assignAgentsToTeam: (teamId: string, employee_ids: string[]) =>
    request<{ message: string }>(`/teams/${teamId}/assign-agents`, {
      method: 'POST',
      body: JSON.stringify({ employee_ids })
    }),

  getTLsOverview: () =>
    request<any[]>('/admin/tls'),

  getAMsOverview: () =>
    request<any[]>('/admin/ams'),

  // Report Upload & Processing
  uploadReport: (formData: FormData) =>
    request<any>('/reports/upload', {
      method: 'POST',
      body: formData
    }),

  getReportHistory: () =>
    request<UploadedReport[]>('/reports/history'),

  getReportErrors: (reportId: string) =>
    request<ReportError[]>(`/reports/${reportId}/errors`),

  getUnmappedRecords: () =>
    request<UnmappedRecord[]>('/reports/unmapped'),

  resolveUnmappedRecord: (id: string, employee_id: string) =>
    request<{ message: string }>(`/reports/unmapped/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ employee_id })
    }),

  // Performance Engine
  getDailyPerformance: (params?: { date?: string; employee_id?: string; team_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<DailyPerformance[]>(`/performance/daily?${query}`);
  },

  getWeeklyPerformance: (params?: { employee_id?: string; team_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<WeeklyPerformance[]>(`/performance/weekly?${query}`);
  },

  getMonthlyPerformance: (params?: { employee_id?: string; month?: number; year?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<MonthlyPerformance[]>(`/performance/monthly?${query}`);
  },

  recalculatePerformance: (date?: string) =>
    request<{ message: string }>('/performance/recalculate', {
      method: 'POST',
      body: JSON.stringify({ date })
    }),

  getEmployee360: (employeeId: string) =>
    request<any>(`/employee/360/${employeeId}`),

  // Feedback & Coaching
  getFeedback: (params?: { employee_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Feedback[]>(`/feedback?${query}`);
  },

  createFeedback: (data: Partial<Feedback>) =>
    request<Feedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateFeedback: (id: string, data: Partial<Feedback>) =>
    request<Feedback>(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getCoaching: (params?: { employee_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Coaching[]>(`/coaching?${query}`);
  },

  createCoaching: (data: Partial<Coaching>) =>
    request<Coaching>('/coaching', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCoaching: (id: string, data: Partial<Coaching>) =>
    request<Coaching>(`/coaching/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // TL Activities
  getTLActivities: () =>
    request<TLActivity[]>('/tl/activities'),

  createTLActivity: (data: Partial<TLActivity>) =>
    request<TLActivity>('/tl/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ACD Calls & Attendance
  getACDCalls: (params?: { employee_id?: string; call_id?: string; queue?: string; date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<ACDCall[]>(`/acd-calls?${query}`);
  },

  getAttendance: (params?: { employee_id?: string; date?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Attendance[]>(`/attendance?${query}`);
  },

  logAttendance: (data: Partial<Attendance>) =>
    request<Attendance>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Email System
  getEmailLogs: () =>
    request<EmailLog[]>('/emails/logs'),

  getEmailLog: (id: string) =>
    request<EmailLog>(`/emails/logs/${id}`),

  sendPerformanceEmail: (data: { employee_id?: string; report_type?: string; target_date?: string }) =>
    request<{ message: string; log?: EmailLog; results?: any[] }>('/emails/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  retryEmail: (id: string) =>
    request<{ message: string; log: EmailLog }>(`/emails/retry/${id}`, {
      method: 'POST'
    }),

  getEmailSettings: () =>
    request<SystemSettings>('/emails/settings'),

  updateEmailSettings: (data: Partial<SystemSettings>) =>
    request<SystemSettings>('/emails/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Notifications & Audit Logs
  getNotifications: () =>
    request<Notification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT'
    }),

  getAuditLogs: (params?: { module?: string; action?: string; username?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/audit-logs?${query}`);
  },

  // KPI Targets
  getKPITargets: () =>
    request<KPITarget[]>('/kpis'),

  createKPITarget: (data: Partial<KPITarget>) =>
    request<KPITarget>('/kpis', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateKPITarget: (id: string, data: Partial<KPITarget>) =>
    request<KPITarget>(`/kpis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};
