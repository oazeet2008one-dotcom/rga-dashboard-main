import rateLimit from 'express-rate-limit';

// FLOW START: Rate Limit Middleware (EN)
// จุดเริ่มต้น: Middleware จำกัดจำนวน request (TH)

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;

// FLOW END: Rate Limit Middleware (EN)
// จุดสิ้นสุด: Middleware จำกัดจำนวน request (TH)
