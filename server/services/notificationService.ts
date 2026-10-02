import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Notification } from '../types';

export function createNotification(params: {
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  link?: string;
}) {
  const notif: Notification = {
    id: `notif-${uuidv4()}`,
    user_id: params.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link,
    is_read: false,
    created_at: new Date().toISOString()
  };

  db.update('notifications', (current) => [notif, ...current]);
  return notif;
}

export function notifyRoles(roles: ('ADMIN' | 'TEAM_LEADER' | 'AGENT')[], params: {
  title: string;
  message: string;
  type: Notification['type'];
  link?: string;
}) {
  const users = db.get('users').filter((u) => roles.includes(u.role) && u.status === 'APPROVED');
  users.forEach((user) => {
    createNotification({
      user_id: user.id,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link
    });
  });
}
