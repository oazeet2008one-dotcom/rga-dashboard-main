import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { TenantRequest } from './tenant.middleware';
import { prisma } from '../utils/prisma';

// FLOW START: Auth Middleware (EN)
// จุดเริ่มต้น: Middleware ตรวจสอบสิทธิ์ (TH)

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export const authenticate = async (req: TenantRequest, _res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true, // Include email verification status
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401));
    }

    if (!user.emailVerified) {
      return next(new AppError('Email not verified. Please verify your email to continue.', 403));
    }

    const allowedRoles = new Set(['super_admin', 'admin_full', 'admin_mess', 'manager', 'viewer']);
    if (!allowedRoles.has(user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    if (user.role === 'admin_mess') {
      const trialMs = 7 * 24 * 60 * 60 * 1000;
      const createdAtMs = user.createdAt instanceof Date ? user.createdAt.getTime() : Date.parse(String(user.createdAt));
      if (Number.isFinite(createdAtMs)) {
        const expired = Date.now() - createdAtMs >= trialMs;
        if (expired) {
          return next(new AppError('กรุณาติดต่อเพื่อขอใช้สิทธิ์เข้าถึงระบบ', 403));
        }
      }
    }

    // Add user info to request
    req.userId = user.id;
    req.tenantId = user.tenantId;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

// FLOW END: Auth Middleware (EN)
// จุดสิ้นสุด: Middleware ตรวจสอบสิทธิ์ (TH)
