import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { User, Role } from './types';
import { logAudit } from './services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'emp-mgmt-enterprise-secret-key-99128381';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      employee_id: user.employee_id,
      role: user.role,
      team_id: user.team_id,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function sanitizeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...safe } = user;
  return safe;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.get('users').find((u) => u.id === payload.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({
        error: `Account is currently ${user.status.toLowerCase()}. Access denied.`
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: ${allowedRoles.join(' or ')} permission required.`
      });
    }

    next();
  };
}
