import { type RequestHandler } from 'express';
import { validationResult } from 'express-validator';

// FLOW START: Validation Middleware (EN)
// จุดเริ่มต้น: Middleware ตรวจสอบข้อมูล (TH)

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

// FLOW END: Validation Middleware (EN)
// จุดสิ้นสุด: Middleware ตรวจสอบข้อมูล (TH)
