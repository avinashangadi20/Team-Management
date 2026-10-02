import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { AuditLog, Role } from '../types';

export function logAudit(params: {
  user_id: string;
  username: string;
  role: Role;
  action: string;
  module: string;
  record_id?: string;
  previous_value?: any;
  new_value?: any;
  ip_address?: string;
}) {
  const newLog: AuditLog = {
    id: `audit-${uuidv4()}`,
    user_id: params.user_id,
    username: params.username,
    role: params.role,
    action: params.action,
    module: params.module,
    record_id: params.record_id || '',
    previous_value: typeof params.previous_value === 'object' ? JSON.stringify(params.previous_value) : String(params.previous_value ?? ''),
    new_value: typeof params.new_value === 'object' ? JSON.stringify(params.new_value) : String(params.new_value ?? ''),
    ip_address: params.ip_address || '127.0.0.1',
    created_at: new Date().toISOString()
  };

  db.update('audit_logs', (logs) => [newLog, ...logs]);
  return newLog;
}
