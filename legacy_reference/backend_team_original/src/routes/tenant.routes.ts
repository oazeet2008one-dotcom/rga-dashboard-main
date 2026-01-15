import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/tenant.middleware';
import { PERMISSIONS } from '../constants/rbac';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

// FLOW START: Tenant Routes (EN)
// จุดเริ่มต้น: Routes ของ Tenant (TH)

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: List all tenants
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 *       401:
 *         description: Unauthorized
 */
router.get('/', requirePermission(PERMISSIONS.manage_tenants), async (_req, res) => {
  const tenants = await prisma.tenant.findMany({ include: { users: true, alertHistory: true } });
  return res.json(tenants);
});

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant information
 *       404:
 *         description: Tenant not found
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.manage_tenants),
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { users: true, alertHistory: true },
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    return res.json(tenant);
  },
);

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Company
 *               slug:
 *                 type: string
 *                 example: my-company
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.manage_tenants),
  body('name').isString().notEmpty(),
  body('slug').isString().notEmpty(),
  validate,
  async (req, res) => {
    const { name, slug } = req.body;
    const tenant = await prisma.tenant.create({ data: { name, slug } });
    return res.json(tenant);
  },
);

// UPDATE tenant
router.put(
  '/:id',
  requirePermission(PERMISSIONS.manage_tenants),
  param('id').isString().notEmpty(),
  body('name').optional().isString(),
  body('slug').optional().isString(),
  validate,
  async (req, res) => {
    const { name, slug } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { name, slug },
    });
    return res.json(tenant);
  },
);

// DELETE tenant
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.manage_tenants),
  param('id').isString().notEmpty(),
  validate,
  async (req, res) => {
    await prisma.tenant.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Tenant deleted' });
  },
);

// FLOW END: Tenant Routes (EN)
// จุดสิ้นสุด: Routes ของ Tenant (TH)

export default router;
