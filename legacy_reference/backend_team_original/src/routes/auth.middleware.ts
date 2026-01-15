import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// FLOW START: Legacy Auth Middleware (routes folder) (EN)
// จุดเริ่มต้น: Middleware auth (ไฟล์อยู่ใน routes/) (TH)

dotenv.config();

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = (decoded as any).userId ?? (decoded as any).id;
    req.tenantId = (decoded as any).tenantId;
    next();
    return;
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

// FLOW END: Legacy Auth Middleware (routes folder) (EN)
// จุดสิ้นสุด: Middleware auth (ไฟล์อยู่ใน routes/) (TH)
