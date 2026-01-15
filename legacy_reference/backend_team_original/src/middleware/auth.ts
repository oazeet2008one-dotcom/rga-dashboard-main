import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import '../types/auth';

// FLOW START: Auth Middleware (Token + Roles) (EN)
// จุดเริ่มต้น: Middleware Auth (ตรวจ token + role) (TH)

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
      return;
    }

    const allowedRoles = new Set(['super_admin', 'admin_full', 'admin_mess', 'manager', 'viewer']);
    if (!allowedRoles.has(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    if (user.role === 'admin_mess') {
      const trialMs = 7 * 24 * 60 * 60 * 1000;
      const createdAtMs = user.createdAt instanceof Date ? user.createdAt.getTime() : Date.parse(String(user.createdAt));
      if (Number.isFinite(createdAtMs)) {
        const expired = Date.now() - createdAtMs >= trialMs;
        if (expired) {
          res.status(403).json({
            success: false,
            message: 'กรุณาติดต่อเพื่อขอใช้สิทธิ์เข้าถึงระบบ',
          });
          return;
        }
      }
    }

    // Add user info to request
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdmin = requireRole(['super_admin', 'admin_full', 'admin_mess']);
export const requireUser = requireRole([
  'super_admin',
  'admin_full',
  'admin_mess',
  'manager',
  'viewer',
]);

// FLOW END: Auth Middleware (Token + Roles) (EN)
// จุดสิ้นสุด: Middleware Auth (ตรวจ token + role) (TH)
