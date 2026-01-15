import { Router, Response } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import dotenv from 'dotenv';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getCurrentUser,
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/error.middleware';

// FLOW START: Auth Routes (EN)
// จุดเริ่มต้น: Routes ของ Auth (TH)

dotenv.config();
const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               tenantId:
 *                 type: string
 *                 example: tenant-uuid
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 example: viewer
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                 verificationToken:
 *                   type: string
 *       400:
 *         description: Bad request
 */
router.post(
  '/register',
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body().custom((value: any) => {
    const tenantId = value?.tenantId;
    const tenantSlug = value?.tenantSlug;
    if (typeof tenantId === 'string' && tenantId.trim()) return true;
    if (typeof tenantSlug === 'string' && tenantSlug.trim()) return true;
    if (process.env.DEFAULT_TENANT_ID || process.env.DEFAULT_TENANT_SLUG) return true;
    if (process.env.NODE_ENV !== 'production') return true;
    throw new Error('tenantId or tenantSlug is required');
  }),
  body('tenantId').optional().isString().notEmpty(),
  body('tenantSlug').optional().isString().notEmpty(),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  validate,
  asyncHandler(register),
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               tenantId:
 *                 type: string
 *                 example: tenant-uuid
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  validate,
  asyncHandler(login),
);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: verification-token-from-email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  body('token').isString().notEmpty(),
  validate,
  asyncHandler(verifyEmail),
);

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post(
  '/resend-verification',
  body('email').isEmail(),
  validate,
  asyncHandler(resendVerificationEmail),
);

// FORGOT PASSWORD (with email service)
router.post('/forgot-password', body('email').isEmail(), validate, asyncHandler(forgotPassword));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, asyncHandler(getCurrentUser));

// REFRESH TOKEN
router.post(
  '/refresh',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    // Generate new token with same user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, role: true, tenantId: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret: Secret = (process.env.JWT_SECRET || 'change-me') as Secret;
    const signOpts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any };
    const newToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, email: user.email, role: user.role },
      secret,
      signOpts,
    );

    return res.json({ token: newToken });
  }),
);

// RESET PASSWORD
router.post(
  '/reset-password',
  body('token').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8 }),
  validate,
  asyncHandler(resetPassword),
);

// FLOW END: Auth Routes (EN)
// จุดสิ้นสุด: Routes ของ Auth (TH)

export default router;
