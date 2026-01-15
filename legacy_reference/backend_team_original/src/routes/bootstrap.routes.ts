import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { logger } from '../utils/logger';

// FLOW START: Bootstrap Routes (EN)
// จุดเริ่มต้น: Routes สำหรับ Bootstrap (TH)

const router = Router();

/**
 * Bootstrap endpoint สำหรับสร้าง tenant และ super admin แรก
 * ใช้ได้เฉพาะเมื่อยังไม่มี tenant ในระบบเท่านั้น
 *
 * POST /api/v1/bootstrap
 * Body: {
 *   "tenantName": "Your Company Name",
 *   "tenantSlug": "your-company",
 *   "adminEmail": "admin@yourcompany.com",
 *   "adminPassword": "YourSecurePassword123!",
 *   "adminFirstName": "Admin",
 *   "adminLastName": "User"
 * }
 */
router.post(
  '/',
  [
    body('tenantName').isString().notEmpty().withMessage('Tenant name is required'),
    body('tenantSlug')
      .isString()
      .notEmpty()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Tenant slug must be lowercase alphanumeric with hyphens'),
    body('adminEmail').isEmail().withMessage('Valid email is required'),
    body('adminPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('adminFirstName').optional().isString(),
    body('adminLastName').optional().isString(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      // ตรวจสอบว่ามี tenant อยู่แล้วหรือไม่
      const existingTenants = await prisma.tenant.count();
      if (existingTenants > 0) {
        return res.status(403).json({
          success: false,
          message:
            'Bootstrap already completed. System already has tenants. Use regular API endpoints instead.',
        });
      }

      const { tenantName, tenantSlug, adminEmail, adminPassword, adminFirstName, adminLastName } =
        req.body;

      // ตรวจสอบว่า slug ไม่ซ้ำ
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (existingTenant) {
        return res.status(409).json({
          success: false,
          message: 'Tenant slug already exists',
        });
      }

      // สร้าง Tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          subscriptionPlan: 'enterprise',
          subscriptionStatus: 'active',
        },
      });

      logger.info(`✅ Tenant created: ${tenant.name} (${tenant.slug})`);

      // Hash password
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // สร้าง Super Admin User
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName || 'Admin',
          lastName: adminLastName || 'User',
          role: 'super_admin',
          tenantId: tenant.id,
          isActive: true,
          emailVerified: true,
        },
      });

      logger.info(`✅ Super Admin created: ${user.email}`);

      // Generate JWT token
      const secret = (process.env.JWT_SECRET || 'change-me') as Secret;
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions,
      );

      return res.status(201).json({
        success: true,
        message: 'Bootstrap completed successfully',
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error: any) {
      logger.error('Bootstrap error:', error);
      return res.status(500).json({
        success: false,
        message: 'Bootstrap failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      });
    }
  },
);

/**
 * ตรวจสอบสถานะ bootstrap
 * GET /api/v1/bootstrap/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();

    return res.json({
      success: true,
      data: {
        isBootstrapped: tenantCount > 0,
        tenantCount,
        userCount,
        message:
          tenantCount > 0 ? 'System is already bootstrapped' : 'System is ready for bootstrap',
      },
    });
  } catch (error: any) {
    logger.error('Bootstrap status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check bootstrap status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// FLOW END: Bootstrap Routes (EN)
// จุดสิ้นสุด: Routes สำหรับ Bootstrap (TH)

export default router;
