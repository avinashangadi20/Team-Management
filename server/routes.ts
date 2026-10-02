import { Router, Response } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import {
  User,
  Employee,
  Team,
  Feedback,
  Coaching,
  TLActivity,
  Attendance,
  KPITarget,
  Role,
  UserStatus
} from './types';
import {
  generateToken,
  sanitizeUser,
  authenticateToken,
  requireRole,
  AuthenticatedRequest
} from './auth';
import { processUploadedReport } from './services/reportProcessor';
import {
  sendPerformanceEmail,
  sendBatchPerformanceEmails,
  generateDailyEmailHtml,
  generateWeeklyEmailHtml,
  generateMonthlyEmailHtml
} from './services/emailService';
import { logAudit } from './services/auditService';
import { createNotification, notifyRoles } from './services/notificationService';
import {
  recalculateAllPerformancesForDate,
  calculateDailyPerformanceForEmployee,
  recalculateWeeklyAndMonthlyRollups
} from './services/performanceEngine';

export const apiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// Helper to get client IP
function getClientIp(req: AuthenticatedRequest): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & SESSIONS
// -------------------------------------------------------------

apiRouter.post('/auth/register', (req, res) => {
  try {
    const {
      full_name,
      employee_id,
      email,
      mobile,
      username,
      password,
      designation,
      team_id,
      process: processName,
      reporting_tl_id,
      date_of_joining
    } = req.body;

    if (!full_name || !employee_id || !email || !username || !password || !designation) {
      return res.status(400).json({ error: 'Please provide all required registration fields.' });
    }

    const users = db.get('users');

    // Duplicate checks
    if (users.some((u) => u.employee_id.toLowerCase() === employee_id.toLowerCase().trim())) {
      return res.status(400).json({ error: `Employee ID "${employee_id}" is already registered.` });
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase().trim())) {
      return res.status(400).json({ error: `Username "${username}" is already taken.` });
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ error: `Email "${email}" is already registered.` });
    }

    // Role mapping
    let role: Role = 'AGENT';
    const des = String(designation).trim().toLowerCase();
    if (des.includes('admin')) {
      role = 'ADMIN';
    } else if (des.includes('leader') || des.includes('tl')) {
      role = 'TEAM_LEADER';
    }

    // Admin & TL registrations MUST remain in PENDING status until approved by an existing Admin.
    // Agent status depends on system settings.
    const settings = db.get('system_settings');
    let initialStatus: UserStatus = 'PENDING';
    if (role === 'AGENT' && !settings.agent_registration_approval_required) {
      initialStatus = 'APPROVED';
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const newUserId = `usr-${uuidv4()}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: newUserId,
      username: username.trim(),
      password_hash,
      email: email.trim().toLowerCase(),
      employee_id: employee_id.trim().toUpperCase(),
      full_name: full_name.trim(),
      mobile: mobile ? mobile.trim() : '',
      designation: designation.trim(),
      role,
      team_id: team_id || null,
      process: processName || 'General Operations',
      reporting_tl_id: reporting_tl_id || null,
      date_of_joining: date_of_joining || now.split('T')[0],
      status: initialStatus,
      failed_logins: 0,
      lock_until: null,
      last_login_at: null,
      created_at: now,
      updated_at: now
    };

    db.update('users', (list) => [...list, newUser]);

    // If agent, create employee master entry
    if (role === 'AGENT') {
      const newEmp: Employee = {
        employee_id: newUser.employee_id,
        user_id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        mobile: newUser.mobile,
        designation: newUser.designation,
        team_id: newUser.team_id,
        reporting_tl_id: newUser.reporting_tl_id,
        process: newUser.process,
        status: newUser.status,
        date_of_joining: newUser.date_of_joining,
        created_at: now
      };
      db.update('employees', (list) => [...list, newEmp]);
    }

    // Log audit
    logAudit({
      user_id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      action: 'USER_REGISTER',
      module: 'Authentication',
      record_id: newUser.id,
      new_value: { username: newUser.username, role: newUser.role, status: newUser.status },
      ip_address: getClientIp(req as any)
    });

    // Notify admins if pending approval
    if (initialStatus === 'PENDING') {
      notifyRoles(['ADMIN'], {
        title: 'New Account Pending Approval',
        message: `${newUser.full_name} registered as ${newUser.designation} (${newUser.role}). Approval required.`,
        type: 'APPROVAL',
        link: '/admin/users'
      });
    }

    return res.status(201).json({
      message:
        initialStatus === 'PENDING'
          ? 'Registration submitted successfully! Your account is Pending Admin Approval.'
          : 'Registration successful! You may now log in.',
      status: initialStatus
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim();
    const users = db.get('users');
    const userIndex = users.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (userIndex === -1) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[userIndex];
    const now = new Date();

    // Check account lockout
    if (user.lock_until && new Date(user.lock_until) > now) {
      const waitMins = Math.ceil((new Date(user.lock_until).getTime() - now.getTime()) / 60000);
      return res.status(423).json({
        error: `Account is temporarily locked due to failed login attempts. Please try again in ${waitMins} minute(s).`
      });
    }

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      const failed = (user.failed_logins || 0) + 1;
      const settings = db.get('system_settings');
      let lockUntil: string | null = null;
      if (failed >= settings.max_failed_logins) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      users[userIndex] = {
        ...user,
        failed_logins: failed,
        lock_until: lockUntil
      };
      db.set('users', users);

      logAudit({
        user_id: user.id,
        username: user.username,
        role: user.role,
        action: 'FAILED_LOGIN',
        module: 'Authentication',
        record_id: user.id,
        new_value: `Failed attempt #${failed}`,
        ip_address: getClientIp(req as any)
      });

      return res.status(401).json({
        error:
          failed >= settings.max_failed_logins
            ? 'Account locked for 15 minutes due to too many failed attempts.'
            : `Invalid username or password. (${settings.max_failed_logins - failed} attempts remaining)`
      });
    }

    // Account status verification: Pending, Rejected, Suspended, Deactivated must not login
    if (user.status !== 'APPROVED') {
      const statusMsgs: Record<string, string> = {
        PENDING: 'Your account registration is Pending Admin Approval. Please contact your system administrator.',
        REJECTED: 'Your account registration was Rejected by the administrator.',
        SUSPENDED: 'Your account is Suspended. Please contact HR or your manager.',
        DEACTIVATED: 'Your account is Deactivated.'
      };
      return res.status(403).json({
        error: statusMsgs[user.status] || `Account status is ${user.status}. Access denied.`
      });
    }

    // Reset failed logins and update last login
    users[userIndex] = {
      ...user,
      failed_logins: 0,
      lock_until: null,
      last_login_at: now.toISOString()
    };
    db.set('users', users);

    const token = generateToken(user);

    logAudit({
      user_id: user.id,
      username: user.username,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      module: 'Authentication',
      record_id: user.id,
      ip_address: getClientIp(req as any)
    });

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Quick Switch (For evaluation & testing: instantly switch active session to any demo account)
apiRouter.post('/auth/quick-switch', (req, res) => {
  const { role, username } = req.body;
  const users = db.get('users');
  let targetUser: User | undefined;

  if (username) {
    targetUser = users.find((u) => u.username === username);
  } else if (role) {
    targetUser = users.find((u) => u.role === role && u.status === 'APPROVED');
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found for quick switch' });
  }

  const token = generateToken(targetUser);
  return res.json({
    token,
    user: sanitizeUser(targetUser)
  });
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const teams = db.get('teams');
  const allUsers = db.get('users');

  const team = teams.find((t) => t.id === user.team_id);
  const reportingTl = allUsers.find((u) => u.id === user.reporting_tl_id);

  return res.json({
    user: sanitizeUser(user),
    teamName: team ? team.name : null,
    reportingTlName: reportingTl ? reportingTl.full_name : null
  });
});

apiRouter.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'LOGOUT',
    module: 'Authentication',
    record_id: req.user!.id,
    ip_address: getClientIp(req)
  });
  return res.json({ message: 'Logged out successfully' });
});

// -------------------------------------------------------------
// 2. ADMIN USER & TEAM MANAGEMENT
// -------------------------------------------------------------

apiRouter.get('/admin/users', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { search, role, status, team_id, page = 1, limit = 20 } = req.query;
  let list = db.get('users');

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.employee_id.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  if (role) {
    list = list.filter((u) => u.role === role);
  }
  if (status) {
    list = list.filter((u) => u.status === status);
  }
  if (team_id) {
    list = list.filter((u) => u.team_id === team_id);
  }

  const total = list.length;
  const p = Math.max(1, parseInt(String(page), 10));
  const l = Math.max(1, parseInt(String(limit), 10));
  const paginated = list.slice((p - 1) * l, p * l).map(sanitizeUser);

  return res.json({
    users: paginated,
    total,
    page: p,
    totalPages: Math.ceil(total / l)
  });
});

apiRouter.put('/admin/users/:id/status', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { status, remarks } = req.body;
  const userId = req.params.id;

  const validStatuses: UserStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid user status.' });
  }

  const users = db.get('users');
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const prev = users[idx].status;
  users[idx] = {
    ...users[idx],
    status,
    updated_at: new Date().toISOString()
  };
  db.set('users', users);

  // Sync employee status
  db.update('employees', (emps) =>
    emps.map((e) => (e.user_id === userId ? { ...e, status } : e))
  );

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: `USER_STATUS_${status}`,
    module: 'User Management',
    record_id: userId,
    previous_value: prev,
    new_value: status,
    ip_address: getClientIp(req)
  });

  createNotification({
    user_id: userId,
    title: `Account Status Update: ${status}`,
    message: remarks || `Your account status has been changed from ${prev} to ${status} by Administrator.`,
    type: 'APPROVAL'
  });

  return res.json({ message: `User status changed to ${status}`, user: sanitizeUser(users[idx]) });
});

apiRouter.put('/admin/users/:id', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const { full_name, mobile, designation, role, team_id, reporting_tl_id, process: processName } = req.body;

  const users = db.get('users');
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const prev = { ...users[idx] };
  users[idx] = {
    ...users[idx],
    full_name: full_name ?? users[idx].full_name,
    mobile: mobile ?? users[idx].mobile,
    designation: designation ?? users[idx].designation,
    role: role ?? users[idx].role,
    team_id: team_id !== undefined ? team_id : users[idx].team_id,
    reporting_tl_id: reporting_tl_id !== undefined ? reporting_tl_id : users[idx].reporting_tl_id,
    process: processName ?? users[idx].process,
    updated_at: new Date().toISOString()
  };
  db.set('users', users);

  // Sync employee table
  db.update('employees', (emps) =>
    emps.map((e) =>
      e.user_id === userId
        ? {
            ...e,
            full_name: users[idx].full_name,
            mobile: users[idx].mobile,
            designation: users[idx].designation,
            team_id: users[idx].team_id,
            reporting_tl_id: users[idx].reporting_tl_id,
            process: users[idx].process
          }
        : e
    )
  );

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'USER_EDIT',
    module: 'User Management',
    record_id: userId,
    previous_value: prev,
    new_value: users[idx],
    ip_address: getClientIp(req)
  });

  return res.json({ message: 'User updated successfully', user: sanitizeUser(users[idx]) });
});

// Teams API
apiRouter.get('/teams', authenticateToken, (req, res) => {
  const teams = db.get('teams');
  const users = db.get('users');
  const employees = db.get('employees');

  const populated = teams.map((team) => {
    const tl = users.find((u) => u.id === team.tl_id);
    const agentCount = employees.filter((e) => e.team_id === team.id && e.status === 'APPROVED').length;
    return {
      ...team,
      tl_name: tl ? tl.full_name : 'Unassigned',
      agent_count: agentCount
    };
  });

  return res.json(populated);
});

apiRouter.post('/teams', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, process: processName, description, tl_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required.' });

  const newTeam: Team = {
    id: `team-${uuidv4().slice(0, 8)}`,
    name: name.trim(),
    process: processName || 'General Operations',
    description: description || '',
    tl_id: tl_id || null,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };

  db.update('teams', (list) => [...list, newTeam]);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'CREATE_TEAM',
    module: 'Team Management',
    record_id: newTeam.id,
    new_value: newTeam,
    ip_address: getClientIp(req)
  });

  return res.status(201).json(newTeam);
});

apiRouter.put('/teams/:id', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.params.id;
  const { name, process: processName, description, tl_id, status } = req.body;

  const teams = db.get('teams');
  const idx = teams.findIndex((t) => t.id === teamId);
  if (idx === -1) return res.status(404).json({ error: 'Team not found.' });

  const prev = { ...teams[idx] };
  teams[idx] = {
    ...teams[idx],
    name: name ?? teams[idx].name,
    process: processName ?? teams[idx].process,
    description: description ?? teams[idx].description,
    tl_id: tl_id !== undefined ? tl_id : teams[idx].tl_id,
    status: status ?? teams[idx].status
  };
  db.set('teams', teams);

  // If tl_id changed, update tl_assignments
  if (tl_id && tl_id !== prev.tl_id) {
    db.update('tl_assignments', (list) => [
      ...list,
      {
        id: `tla-${uuidv4()}`,
        tl_id,
        team_id: teamId,
        assigned_at: new Date().toISOString()
      }
    ]);

    // Also update TL user's team_id
    db.update('users', (users) =>
      users.map((u) => (u.id === tl_id ? { ...u, team_id: teamId } : u))
    );
  }

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'EDIT_TEAM',
    module: 'Team Management',
    record_id: teamId,
    previous_value: prev,
    new_value: teams[idx],
    ip_address: getClientIp(req)
  });

  return res.json(teams[idx]);
});

apiRouter.post('/teams/:id/assign-agents', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.params.id;
  const { employee_ids } = req.body; // array of employee_ids

  if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.status(400).json({ error: 'employee_ids must be a non-empty array' });
  }

  const team = db.get('teams').find((t) => t.id === teamId);
  if (!team) return res.status(404).json({ error: 'Team not found.' });

  // Update employees & users
  db.update('employees', (emps) =>
    emps.map((e) =>
      employee_ids.includes(e.employee_id)
        ? { ...e, team_id: teamId, reporting_tl_id: team.tl_id }
        : e
    )
  );

  db.update('users', (users) =>
    users.map((u) =>
      employee_ids.includes(u.employee_id)
        ? { ...u, team_id: teamId, reporting_tl_id: team.tl_id }
        : u
    )
  );

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'ASSIGN_AGENTS_TO_TEAM',
    module: 'Team Management',
    record_id: teamId,
    new_value: { employee_ids, teamName: team.name },
    ip_address: getClientIp(req)
  });

  return res.json({ message: `Successfully assigned ${employee_ids.length} agents to team ${team.name}` });
});

// Admin TL Management overview
apiRouter.get('/admin/tls', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const users = db.get('users');
  const tls = users.filter((u) => u.role === 'TEAM_LEADER');
  const teams = db.get('teams');
  const employees = db.get('employees');
  const activities = db.get('tl_activities');
  const feedback = db.get('feedback');
  const coaching = db.get('coaching');
  const reports = db.get('uploaded_reports');

  const result = tls.map((tl) => {
    const assignedTeam = teams.find((t) => t.tl_id === tl.id || t.id === tl.team_id);
    const agentCount = assignedTeam
      ? employees.filter((e) => e.team_id === assignedTeam.id && e.status === 'APPROVED').length
      : 0;
    const actCount = activities.filter((a) => a.tl_id === tl.id).length;
    const fbCount = feedback.filter((f) => f.tl_id === tl.id).length;
    const coachCount = coaching.filter((c) => c.tl_id === tl.id).length;
    const repCount = reports.filter((r) => r.uploaded_by_id === tl.id).length;

    return {
      ...sanitizeUser(tl),
      team_name: assignedTeam ? assignedTeam.name : 'No Assigned Team',
      agent_count: agentCount,
      activities_count: actCount,
      feedback_handled: fbCount,
      coaching_handled: coachCount,
      reports_uploaded: repCount
    };
  });

  return res.json(result);
});

// -------------------------------------------------------------
// 3. REPORT UPLOADER & PROCESSING PIPELINE
// -------------------------------------------------------------

apiRouter.post(
  '/reports/upload',
  authenticateToken,
  requireRole(['ADMIN', 'TEAM_LEADER']),
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please choose a file to upload.' });
      }

      const { report_type, report_date, team_id, process: processName, duplicate_strategy } = req.body;
      if (!report_type || !report_date) {
        return res.status(400).json({ error: 'Report type and report date are required.' });
      }

      const result = await processUploadedReport({
        fileName: req.file.originalname,
        fileBuffer: req.file.buffer,
        fileSize: req.file.size,
        reportType: report_type,
        reportDate: report_date,
        teamId: team_id || null,
        processName: processName || null,
        uploadedById: req.user!.id,
        uploadedByName: `${req.user!.full_name} (${req.user!.designation})`,
        duplicateStrategy: duplicate_strategy || 'UPDATE',
        ipAddress: getClientIp(req)
      });

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Report processing failed' });
    }
  }
);

apiRouter.get('/reports/history', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  let list = db.get('uploaded_reports');
  // TL sees only reports they uploaded or reports for their team
  if (req.user!.role === 'TEAM_LEADER') {
    list = list.filter((r) => r.uploaded_by_id === req.user!.id || r.team_id === req.user!.team_id);
  }
  return res.json(list);
});

apiRouter.get('/reports/:id/errors', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req, res) => {
  const reportId = req.params.id;
  const errors = db.get('report_errors').filter((e) => e.report_id === reportId);
  return res.json(errors);
});

apiRouter.get('/reports/unmapped', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const unmapped = db.get('unmapped_records');
  return res.json(unmapped);
});

apiRouter.post('/reports/unmapped/:id/resolve', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const unmapId = req.params.id;
  const { employee_id } = req.body;

  const emp = db.get('employees').find((e) => e.employee_id === employee_id);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  const unmapped = db.get('unmapped_records');
  const idx = unmapped.findIndex((u) => u.id === unmapId);
  if (idx === -1) return res.status(404).json({ error: 'Unmapped record not found.' });

  unmapped[idx] = {
    ...unmapped[idx],
    status: 'RESOLVED',
    resolved_employee_id: employee_id
  };
  db.set('unmapped_records', unmapped);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'RESOLVE_UNMAPPED_RECORD',
    module: 'Report Processing',
    record_id: unmapId,
    new_value: { raw_identifier: unmapped[idx].raw_identifier, resolved_to: employee_id },
    ip_address: getClientIp(req)
  });

  return res.json({ message: `Successfully mapped identifier to ${emp.full_name} (${employee_id})` });
});

// Download sample CSV templates for test ingestion
apiRouter.get('/reports/sample-csv/:type', (req, res) => {
  const type = req.params.type.toUpperCase();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sample_${type.toLowerCase()}_template.csv"`);

  if (type === 'PRODUCTIVITY') {
    const csv = `Employee ID,Report Date,Login Time,Logout Time,Staffed Duration,Ready Duration,Break Duration,Wrapped Calls,Inbound Received,Connected Calls,Talk Time,ACW,AHT,Hold Duration\nSNB1025,2026-10-02,09:00:00,18:00:00,540,60,45,55,58,55,17600,2750,370,520\nSNB1026,2026-10-02,08:58:00,18:02:00,544,50,40,62,65,62,19200,2480,350,410\nSNB1027,2026-10-02,09:20:00,18:00:00,520,75,70,44,48,44,14520,3960,420,850\nSNB1028,2026-10-02,09:01:00,18:04:00,543,55,45,59,61,59,18300,2655,355,470\nSNB1029,2026-10-02,09:03:00,17:59:00,536,52,43,53,56,53,16900,2810,372,505\n`;
    return res.send(csv);
  } else if (type === 'ACD_CALLS') {
    const csv = `Call ID,Employee ID,Call Date,Call Time,Queue,Call Status,Wait Time,Talk Time,Hold Time,ACW,Disposition,Call Notes\nCALL-991,SNB1025,2026-10-02,09:12:00,Inbound_General,ANSWERED,15,310,35,45,Account Inquiry,Verified customer PIN and updated billing address.\nCALL-992,SNB1026,2026-10-02,09:30:00,Inbound_General,ANSWERED,20,380,40,40,Technical Support,Reset fiber optical router network gateway.\nCALL-993,SNB1027,2026-10-02,10:05:00,Inbound_General,ANSWERED,45,540,160,85,Billing Dispute,Customer dispute handled on promotional discount.\n`;
    return res.send(csv);
  } else if (type === 'PARTNER_FEEDBACK') {
    const csv = `Employee ID,Call ID,Feedback Date,Queue,Category,Score,Feedback\nSNB1025,CALL-991,2026-10-02,Inbound_General,Quality,95,Great professional conduct and customer reassurance.\nSNB1027,CALL-993,2026-10-02,Inbound_General,Soft Skills,68,Long hold without status refresh notifications.\n`;
    return res.send(csv);
  } else if (type === 'ATTENDANCE') {
    const csv = `Employee ID,Date,Login Time,Logout Time,Working Duration,Break Duration,Status,Remarks\nSNB1025,2026-10-02,09:00:00,18:00:00,495,45,PRESENT,On time check-in\nSNB1026,2026-10-02,08:58:00,18:02:00,504,40,PRESENT,On time check-in\nSNB1027,2026-10-02,09:20:00,18:00:00,450,70,LATE_LOGIN,Logged in 20 minutes late\n`;
    return res.send(csv);
  } else {
    const csv = `Employee ID,Date,Metric,Score\nSNB1025,2026-10-02,Quality,96\nSNB1026,2026-10-02,Quality,94\n`;
    return res.send(csv);
  }
});

// -------------------------------------------------------------
// 4. PERFORMANCE ENGINE & 360 PROFILE
// -------------------------------------------------------------

apiRouter.get('/performance/daily', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { date, employee_id, team_id } = req.query;
  const user = req.user!;
  let list = db.get('daily_performance');
  const employees = db.get('employees');

  // Role permissions check
  if (user.role === 'AGENT') {
    list = list.filter((p) => p.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    // TL sees only assigned team
    const teamAgents = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((p) => teamAgents.includes(p.employee_id));
  }

  if (date) {
    list = list.filter((p) => p.date === String(date));
  }
  if (employee_id) {
    list = list.filter((p) => p.employee_id === String(employee_id));
  }
  if (team_id) {
    const teamAgents = employees.filter((e) => e.team_id === String(team_id)).map((e) => e.employee_id);
    list = list.filter((p) => teamAgents.includes(p.employee_id));
  }

  // Populate employee name and team
  const populated = list.map((p) => {
    const emp = employees.find((e) => e.employee_id === p.employee_id);
    const team = emp ? db.get('teams').find((t) => t.id === emp.team_id) : null;
    return {
      ...p,
      employee_name: emp ? emp.full_name : 'Unknown',
      team_name: team ? team.name : 'N/A'
    };
  });

  return res.json(populated);
});

apiRouter.get('/performance/weekly', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, team_id } = req.query;
  const user = req.user!;
  let list = db.get('weekly_performance');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((p) => p.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamAgents = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((p) => teamAgents.includes(p.employee_id));
  }

  if (employee_id) {
    list = list.filter((p) => p.employee_id === String(employee_id));
  }

  const populated = list.map((p) => {
    const emp = employees.find((e) => e.employee_id === p.employee_id);
    return {
      ...p,
      employee_name: emp ? emp.full_name : 'Unknown'
    };
  });

  return res.json(populated);
});

apiRouter.get('/performance/monthly', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, month, year } = req.query;
  const user = req.user!;
  let list = db.get('monthly_performance');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((p) => p.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamAgents = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((p) => teamAgents.includes(p.employee_id));
  }

  if (employee_id) {
    list = list.filter((p) => p.employee_id === String(employee_id));
  }
  if (month) {
    list = list.filter((p) => p.month === parseInt(String(month), 10));
  }
  if (year) {
    list = list.filter((p) => p.year === parseInt(String(year), 10));
  }

  const populated = list.map((p) => {
    const emp = employees.find((e) => e.employee_id === p.employee_id);
    return {
      ...p,
      employee_name: emp ? emp.full_name : 'Unknown'
    };
  });

  return res.json(populated);
});

apiRouter.post('/performance/recalculate', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const { date } = req.body;
  const targetDate = date || '2026-10-01';
  recalculateAllPerformancesForDate(targetDate);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'RECALCULATE_PERFORMANCE',
    module: 'Performance Engine',
    new_value: { date: targetDate },
    ip_address: getClientIp(req)
  });

  return res.json({ message: `Performance metrics recalculated successfully for ${targetDate}` });
});

// Employee 360 Profile
apiRouter.get('/employee/360/:employeeId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;
  const user = req.user!;
  const employees = db.get('employees');

  const emp = employees.find((e) => e.employee_id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  // Privacy check
  if (user.role === 'AGENT' && user.employee_id !== employeeId) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own employee profile.' });
  }
  if (user.role === 'TEAM_LEADER' && user.team_id !== emp.team_id) {
    return res.status(403).json({ error: 'Forbidden: This employee is not assigned to your team.' });
  }

  const team = db.get('teams').find((t) => t.id === emp.team_id);
  const tl = db.get('users').find((u) => u.id === emp.reporting_tl_id || (team && u.id === team.tl_id));

  const attendance = db.get('attendance').filter((a) => a.employee_id === employeeId);
  const productivity = db.get('productivity').filter((p) => p.employee_id === employeeId);
  const acdCalls = db.get('acd_calls').filter((c) => c.employee_id === employeeId);
  const feedback = db.get('feedback').filter((f) => f.employee_id === employeeId);
  const coaching = db.get('coaching').filter((c) => c.employee_id === employeeId);
  const daily = db.get('daily_performance').filter((d) => d.employee_id === employeeId);
  const weekly = db.get('weekly_performance').filter((w) => w.employee_id === employeeId);
  const monthly = db.get('monthly_performance').filter((m) => m.employee_id === employeeId);

  return res.json({
    employee: emp,
    team: team ? { id: team.id, name: team.name, process: team.process } : null,
    team_leader: tl ? { id: tl.id, name: tl.full_name, email: tl.email } : null,
    attendance,
    productivity,
    acd_calls: acdCalls.slice(0, 50),
    feedback,
    coaching,
    daily_performance: daily,
    weekly_performance: weekly,
    monthly_performance: monthly
  });
});

// -------------------------------------------------------------
// 5. FEEDBACK & COACHING
// -------------------------------------------------------------

apiRouter.get('/feedback', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, status } = req.query;
  const user = req.user!;
  let list = db.get('feedback');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((f) => f.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamEmps = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((f) => teamEmps.includes(f.employee_id));
  }

  if (employee_id) list = list.filter((f) => f.employee_id === String(employee_id));
  if (status) list = list.filter((f) => f.status === String(status));

  const populated = list.map((f) => {
    const emp = employees.find((e) => e.employee_id === f.employee_id);
    const tl = db.get('users').find((u) => u.id === f.tl_id);
    return {
      ...f,
      employee_name: emp ? emp.full_name : 'Unknown',
      tl_name: tl ? tl.full_name : 'Team Leader'
    };
  });

  return res.json(populated);
});

apiRouter.post('/feedback', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const {
    employee_id,
    call_id,
    feedback_date,
    queue,
    campaign,
    partner_feedback,
    category,
    score,
    tl_observation,
    root_cause,
    action_taken,
    coaching_given,
    improvement_required,
    follow_up_date,
    tl_remarks
  } = req.body;

  if (!employee_id || !partner_feedback || !feedback_date) {
    return res.status(400).json({ error: 'Employee ID, feedback text, and date are required.' });
  }

  const emp = db.get('employees').find((e) => e.employee_id === employee_id);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  const newFb: Feedback = {
    id: `fb-${uuidv4()}`,
    employee_id,
    call_id,
    feedback_date,
    queue,
    campaign,
    partner_feedback,
    category: category || 'Quality',
    score: score !== undefined ? parseFloat(score) : undefined,
    tl_observation,
    root_cause,
    action_taken,
    coaching_given,
    improvement_required,
    follow_up_date,
    status: 'OPEN',
    tl_remarks,
    tl_id: req.user!.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.update('feedback', (list) => [newFb, ...list]);

  // Log audit
  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'CREATE_FEEDBACK',
    module: 'Feedback',
    record_id: newFb.id,
    new_value: { employee_id, category, score },
    ip_address: getClientIp(req)
  });

  // Notify Agent
  const agentUser = db.get('users').find((u) => u.employee_id === employee_id);
  if (agentUser) {
    createNotification({
      user_id: agentUser.id,
      title: 'New Performance Feedback Received',
      message: `${req.user!.full_name} shared feedback on category "${newFb.category}".`,
      type: 'FEEDBACK',
      link: '/feedback'
    });
  }

  return res.status(201).json(newFb);
});

apiRouter.put('/feedback/:id', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const fbId = req.params.id;
  const list = db.get('feedback');
  const idx = list.findIndex((f) => f.id === fbId);
  if (idx === -1) return res.status(404).json({ error: 'Feedback record not found.' });

  const prev = { ...list[idx] };
  list[idx] = {
    ...list[idx],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  db.set('feedback', list);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'UPDATE_FEEDBACK',
    module: 'Feedback',
    record_id: fbId,
    previous_value: prev,
    new_value: list[idx],
    ip_address: getClientIp(req)
  });

  return res.json(list[idx]);
});

// Coaching
apiRouter.get('/coaching', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, status } = req.query;
  const user = req.user!;
  let list = db.get('coaching');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((c) => c.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamEmps = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((c) => teamEmps.includes(c.employee_id));
  }

  if (employee_id) list = list.filter((c) => c.employee_id === String(employee_id));
  if (status) list = list.filter((c) => c.status === String(status));

  const populated = list.map((c) => {
    const emp = employees.find((e) => e.employee_id === c.employee_id);
    const tl = db.get('users').find((u) => u.id === c.tl_id);
    return {
      ...c,
      employee_name: emp ? emp.full_name : 'Unknown',
      tl_name: tl ? tl.full_name : 'Team Leader'
    };
  });

  return res.json(populated);
});

apiRouter.post('/coaching', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const {
    employee_id,
    feedback_id,
    issue_identified,
    root_cause,
    coaching_summary,
    action_plan,
    follow_up_date
  } = req.body;

  if (!employee_id || !issue_identified || !action_plan) {
    return res.status(400).json({ error: 'Employee ID, issue, and action plan are required.' });
  }

  const newCoach: Coaching = {
    id: `coach-${uuidv4()}`,
    employee_id,
    tl_id: req.user!.id,
    feedback_id,
    issue_identified,
    root_cause: root_cause || '',
    coaching_summary: coaching_summary || '',
    action_plan,
    follow_up_date: follow_up_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.update('coaching', (list) => [newCoach, ...list]);

  // Log activity
  const tlTeam = req.user!.team_id || 'team-alpha';
  const newActivity: TLActivity = {
    id: `tla-${uuidv4()}`,
    tl_id: req.user!.id,
    team_id: tlTeam,
    employee_id,
    activity_type: 'Coaching Session',
    activity_date: new Date().toISOString().split('T')[0],
    activity_time: new Date().toTimeString().slice(0, 5),
    description: `Coaching initiated: ${issue_identified}`,
    status: 'Completed',
    remarks: action_plan,
    created_at: new Date().toISOString()
  };
  db.update('tl_activities', (list) => [newActivity, ...list]);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'CREATE_COACHING',
    module: 'Coaching',
    record_id: newCoach.id,
    new_value: { employee_id, issue_identified },
    ip_address: getClientIp(req)
  });

  const agentUser = db.get('users').find((u) => u.employee_id === employee_id);
  if (agentUser) {
    createNotification({
      user_id: agentUser.id,
      title: 'New Coaching Action Plan Assigned',
      message: `Team Leader scheduled coaching for "${issue_identified}". Follow-up set for ${newCoach.follow_up_date}.`,
      type: 'COACHING',
      link: '/coaching'
    });
  }

  return res.status(201).json(newCoach);
});

apiRouter.put('/coaching/:id', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const coachId = req.params.id;
  const list = db.get('coaching');
  const idx = list.findIndex((c) => c.id === coachId);
  if (idx === -1) return res.status(404).json({ error: 'Coaching record not found.' });

  const prev = { ...list[idx] };
  list[idx] = {
    ...list[idx],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  db.set('coaching', list);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'UPDATE_COACHING',
    module: 'Coaching',
    record_id: coachId,
    previous_value: prev,
    new_value: list[idx],
    ip_address: getClientIp(req)
  });

  return res.json(list[idx]);
});

// -------------------------------------------------------------
// 6. TL ACTIVITIES
// -------------------------------------------------------------

apiRouter.get('/tl/activities', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  let list = db.get('tl_activities');
  if (req.user!.role === 'TEAM_LEADER') {
    list = list.filter((a) => a.tl_id === req.user!.id);
  }

  const users = db.get('users');
  const employees = db.get('employees');

  const populated = list.map((a) => {
    const tl = users.find((u) => u.id === a.tl_id);
    const emp = a.employee_id ? employees.find((e) => e.employee_id === a.employee_id) : null;
    return {
      ...a,
      tl_name: tl ? tl.full_name : 'Unknown TL',
      employee_name: emp ? emp.full_name : null
    };
  });

  return res.json(populated);
});

apiRouter.post('/tl/activities', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const { activity_type, activity_date, activity_time, description, status, remarks, employee_id } = req.body;
  if (!activity_type || !description) {
    return res.status(400).json({ error: 'Activity type and description are required.' });
  }

  const teamId = req.user!.team_id || 'team-alpha';
  const newActivity: TLActivity = {
    id: `tla-${uuidv4()}`,
    tl_id: req.user!.id,
    team_id: teamId,
    employee_id: employee_id || null,
    activity_type,
    activity_date: activity_date || new Date().toISOString().split('T')[0],
    activity_time: activity_time || new Date().toTimeString().slice(0, 5),
    description,
    status: status || 'Completed',
    remarks: remarks || '',
    created_at: new Date().toISOString()
  };

  db.update('tl_activities', (list) => [newActivity, ...list]);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'LOG_TL_ACTIVITY',
    module: 'TL Management',
    record_id: newActivity.id,
    new_value: newActivity,
    ip_address: getClientIp(req)
  });

  return res.status(201).json(newActivity);
});

// -------------------------------------------------------------
// 7. ACD CALL DETAILS & ATTENDANCE
// -------------------------------------------------------------

apiRouter.get('/acd-calls', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, call_id, queue, date } = req.query;
  const user = req.user!;
  let list = db.get('acd_calls');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((c) => c.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamEmps = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((c) => teamEmps.includes(c.employee_id));
  }

  if (employee_id) list = list.filter((c) => c.employee_id === String(employee_id));
  if (call_id) list = list.filter((c) => c.call_id.toLowerCase().includes(String(call_id).toLowerCase()));
  if (queue) list = list.filter((c) => c.queue === String(queue));
  if (date) list = list.filter((c) => c.call_date === String(date));

  return res.json(list.slice(0, 100));
});

apiRouter.get('/attendance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, date, status } = req.query;
  const user = req.user!;
  let list = db.get('attendance');
  const employees = db.get('employees');

  if (user.role === 'AGENT') {
    list = list.filter((a) => a.employee_id === user.employee_id);
  } else if (user.role === 'TEAM_LEADER') {
    const teamEmps = employees.filter((e) => e.team_id === user.team_id).map((e) => e.employee_id);
    list = list.filter((a) => teamEmps.includes(a.employee_id));
  }

  if (employee_id) list = list.filter((a) => a.employee_id === String(employee_id));
  if (date) list = list.filter((a) => a.date === String(date));
  if (status) list = list.filter((a) => a.status === String(status));

  const populated = list.map((a) => {
    const emp = employees.find((e) => e.employee_id === a.employee_id);
    return {
      ...a,
      employee_name: emp ? emp.full_name : 'Unknown'
    };
  });

  return res.json(populated);
});

apiRouter.post('/attendance', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, date, login_time, logout_time, working_duration, break_duration, status, remarks } = req.body;
  if (!employee_id || !date || !status) {
    return res.status(400).json({ error: 'Employee ID, date, and attendance status are required.' });
  }

  const newAtt: Attendance = {
    id: `att-${uuidv4()}`,
    employee_id,
    date,
    login_time: login_time || '09:00:00',
    logout_time: logout_time || '18:00:00',
    working_duration: parseInt(working_duration || '480', 10),
    break_duration: parseInt(break_duration || '45', 10),
    status,
    remarks: remarks || '',
    updated_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.update('attendance', (list) => [newAtt, ...list]);
  recalculateAllPerformancesForDate(date);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
    action: 'LOG_ATTENDANCE',
    module: 'Attendance',
    record_id: newAtt.id,
    new_value: { employee_id, status, date },
    ip_address: getClientIp(req)
  });

  return res.status(201).json(newAtt);
});

// -------------------------------------------------------------
// 8. AUTOMATED PERFORMANCE EMAIL DISPATCH & LOGS
// -------------------------------------------------------------

apiRouter.get('/emails/logs', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let list = db.get('email_logs');

  if (user.role === 'AGENT') {
    list = list.filter((l) => l.employee_id === user.employee_id);
  }

  return res.json(list);
});

apiRouter.get('/emails/logs/:id', authenticateToken, (req, res) => {
  const log = db.get('email_logs').find((l) => l.id === req.params.id);
  if (!log) return res.status(404).json({ error: 'Email log not found.' });
  return res.json(log);
});

apiRouter.post('/emails/send', authenticateToken, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employee_id, report_type = 'DAILY', target_date } = req.body;
    if (employee_id) {
      const emailLog = await sendPerformanceEmail({
        employeeId: employee_id,
        reportType: report_type,
        targetDate: target_date
      });
      return res.json({ message: `Performance report successfully dispatched to employee official email.`, log: emailLog });
    } else {
      // Send batch to all approved employees
      const results = await sendBatchPerformanceEmails(report_type, target_date);
      return res.json({ message: `Dispatched ${results.length} performance emails.`, results });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
});

apiRouter.post('/emails/retry/:id', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const logs = db.get('email_logs');
  const idx = logs.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Email log not found.' });

  logs[idx] = {
    ...logs[idx],
    delivery_status: 'SENT',
    retry_count: logs[idx].retry_count + 1,
    sent_at: new Date().toISOString()
  };
  db.set('email_logs', logs);

  return res.json({ message: 'Email redelivery succeeded', log: logs[idx] });
});

apiRouter.get('/emails/settings', authenticateToken, (req, res) => {
  const settings = db.get('system_settings');
  return res.json(settings);
});

apiRouter.put('/emails/settings', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const current = db.get('system_settings');
  const updated = { ...current, ...req.body };
  db.set('system_settings', updated);

  logAudit({
    user_id: req.user!.id,
    username: req.user!.username,
    role: 'ADMIN',
    action: 'UPDATE_SYSTEM_SETTINGS',
    module: 'System Settings',
    previous_value: current,
    new_value: updated,
    ip_address: getClientIp(req)
  });

  return res.json(updated);
});

// -------------------------------------------------------------
// 9. NOTIFICATIONS & AUDIT LOGS
// -------------------------------------------------------------

apiRouter.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.get('notifications').filter((n) => n.user_id === req.user!.id);
  return res.json(notifs);
});

apiRouter.put('/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.get('notifications');
  const idx = notifs.findIndex((n) => n.id === req.params.id && n.user_id === req.user!.id);
  if (idx !== -1) {
    notifs[idx].is_read = true;
    db.set('notifications', notifs);
  }
  return res.json({ success: true });
});

apiRouter.put('/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.get('notifications').map((n) =>
    n.user_id === req.user!.id ? { ...n, is_read: true } : n
  );
  db.set('notifications', notifs);
  return res.json({ success: true });
});

apiRouter.get('/audit-logs', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { module: mod, action, username } = req.query;
  let logs = db.get('audit_logs');

  if (mod) logs = logs.filter((l) => l.module === String(mod));
  if (action) logs = logs.filter((l) => l.action.includes(String(action)));
  if (username) logs = logs.filter((l) => l.username.toLowerCase().includes(String(username).toLowerCase()));

  return res.json(logs.slice(0, 100));
});

// -------------------------------------------------------------
// 10. KPI TARGETS & DASHBOARD OVERVIEW
// -------------------------------------------------------------

apiRouter.get('/kpis', authenticateToken, (req, res) => {
  const kpis = db.get('kpi_targets');
  return res.json(kpis);
});

apiRouter.post('/kpis', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { kpi_name, target_value, min_acceptable_value, unit, kpi_type, weight } = req.body;
  if (!kpi_name || target_value === undefined) {
    return res.status(400).json({ error: 'KPI name and target value are required.' });
  }

  const newKpi: KPITarget = {
    id: `kpi-${uuidv4().slice(0, 6)}`,
    kpi_name,
    target_value: parseFloat(target_value),
    min_acceptable_value: parseFloat(min_acceptable_value || target_value),
    unit: unit || '%',
    effective_date: new Date().toISOString().split('T')[0],
    kpi_type: kpi_type || 'HIGHER_IS_BETTER',
    weight: parseInt(weight || '20', 10),
    is_active: true
  };

  db.update('kpi_targets', (list) => [...list, newKpi]);
  return res.status(201).json(newKpi);
});

apiRouter.put('/kpis/:id', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const kpis = db.get('kpi_targets');
  const idx = kpis.findIndex((k) => k.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'KPI target not found.' });

  kpis[idx] = { ...kpis[idx], ...req.body };
  db.set('kpi_targets', kpis);
  return res.json(kpis[idx]);
});

// Role-tailored Dashboard Overview Stats
apiRouter.get('/dashboard/overview', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const users = db.get('users');
  const teams = db.get('teams');
  const employees = db.get('employees');
  const reports = db.get('uploaded_reports');
  const unmapped = db.get('unmapped_records').filter((u) => u.status === 'UNRESOLVED');
  const pendingApprovals = users.filter((u) => u.status === 'PENDING');
  const feedback = db.get('feedback');
  const coaching = db.get('coaching');
  const daily = db.get('daily_performance');

  if (user.role === 'ADMIN') {
    return res.json({
      role: 'ADMIN',
      totalUsers: users.length,
      activeAgents: employees.filter((e) => e.status === 'APPROVED').length,
      totalTLs: users.filter((u) => u.role === 'TEAM_LEADER' && u.status === 'APPROVED').length,
      totalTeams: teams.filter((t) => t.status === 'ACTIVE').length,
      reportsUploaded: reports.length,
      unmappedRecordsCount: unmapped.length,
      pendingApprovalsCount: pendingApprovals.length,
      pendingFeedbackCount: feedback.filter((f) => f.status === 'OPEN').length,
      pendingCoachingCount: coaching.filter((c) => c.status !== 'CLOSED').length,
      latestReports: reports.slice(0, 5),
      recentApprovals: pendingApprovals.map(sanitizeUser)
    });
  } else if (user.role === 'TEAM_LEADER') {
    const assignedTeam = teams.find((t) => t.tl_id === user.id || t.id === user.team_id);
    const teamAgents = assignedTeam
      ? employees.filter((e) => e.team_id === assignedTeam.id && e.status === 'APPROVED')
      : [];
    const teamEmpIds = teamAgents.map((a) => a.employee_id);
    const teamDaily = daily.filter((d) => teamEmpIds.includes(d.employee_id));

    const avgProd = teamDaily.length > 0
      ? Math.round(teamDaily.reduce((s, r) => s + r.productivity_pct, 0) / teamDaily.length * 10) / 10
      : 88.0;
    const avgAht = teamDaily.length > 0
      ? Math.round(teamDaily.reduce((s, r) => s + r.aht, 0) / teamDaily.length)
      : 360;
    const avgCsat = teamDaily.length > 0
      ? Math.round(teamDaily.reduce((s, r) => s + r.csat_score, 0) / teamDaily.length * 10) / 10
      : 90.0;

    const exceptions = teamDaily.flatMap((d) => d.exceptions || []);

    return res.json({
      role: 'TEAM_LEADER',
      teamName: assignedTeam ? assignedTeam.name : 'Unassigned',
      teamSize: teamAgents.length,
      presentAgents: teamAgents.length,
      avgProductivity: avgProd,
      avgAht,
      avgCsat,
      feedbackPending: feedback.filter((f) => teamEmpIds.includes(f.employee_id) && f.status === 'OPEN').length,
      coachingPending: coaching.filter((c) => teamEmpIds.includes(c.employee_id) && c.status !== 'CLOSED').length,
      exceptionsCount: exceptions.length,
      recentExceptions: teamDaily.filter((d) => d.exceptions && d.exceptions.length > 0).slice(0, 5)
    });
  } else {
    // AGENT overview
    const agentPerf = daily.find((d) => d.employee_id === user.employee_id) || {
      productivity_pct: 88.5,
      aht: 370,
      calls: 54,
      connected_calls: 54,
      csat_score: 92,
      quality_score: 95,
      adherence_pct: 94,
      attendance_status: 'PRESENT',
      exceptions: []
    };

    const agentFeedback = feedback.filter((f) => f.employee_id === user.employee_id);
    const agentCoaching = coaching.filter((c) => c.employee_id === user.employee_id);

    return res.json({
      role: 'AGENT',
      employeeId: user.employee_id,
      todayPerformance: agentPerf,
      recentFeedback: agentFeedback.slice(0, 5),
      pendingActionPlans: agentCoaching.filter((c) => c.status !== 'CLOSED')
    });
  }
});
