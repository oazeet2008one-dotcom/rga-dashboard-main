-- ============================================
-- สคริปต์สำหรับสร้าง Admin User แรก
-- สำหรับการใช้งานจริง (Production)
-- ============================================
-- 
-- วิธีใช้งาน:
-- 1. แก้ไขข้อมูลด้านล่างตามต้องการ
-- 2. รันสคริปต์นี้ใน pgAdmin4 Query Tool
-- 3. เก็บ password ไว้ในที่ปลอดภัย
--
-- ============================================

 CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ตั้งค่าตัวแปร (แก้ไขตามต้องการ)
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_password VARCHAR(255) := 'YourSecurePassword123!';
    v_super_admin_email VARCHAR(255) := 'superadmin@yourcompany.com';
    v_admin_full_email VARCHAR(255) := 'adminfull@yourcompany.com';
    v_admin_user_email VARCHAR(255) := 'adminuser@yourcompany.com';
    v_manager_email VARCHAR(255) := 'manager@yourcompany.com';
    v_viewer_email VARCHAR(255) := 'viewer@yourcompany.com';
    v_tenant_name VARCHAR(255) := 'Your Company Name';  -- แก้ไขชื่อบริษัท
    v_tenant_slug VARCHAR(100) := 'your-company';  -- แก้ไข slug (ใช้ตัวพิมพ์เล็ก, - แทนช่องว่าง)
BEGIN
    -- สร้าง Tenant
    INSERT INTO tenants (id, name, slug, subscription_plan, subscription_status, updated_at)
    VALUES (
        gen_random_uuid(),
        v_tenant_name,
        v_tenant_slug,
        'enterprise',
        'active',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_tenant_id;
    
    -- ถ้า tenant มีอยู่แล้ว ให้ดึง ID
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM tenants WHERE slug = v_tenant_slug;
    END IF;
    
    RAISE NOTICE 'Tenant created/updated: % (ID: %)', v_tenant_name, v_tenant_id;

    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_super_admin_email, crypt(v_password, gen_salt('bf', 10)), 'Super', 'Admin', 'super_admin', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'super_admin',
        is_active = true,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_id;

    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_admin_full_email, crypt(v_password, gen_salt('bf', 10)), 'Admin', 'Full', 'admin_full', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'admin_full',
        is_active = true,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_admin_user_email, crypt(v_password, gen_salt('bf', 10)), 'Admin', 'User', 'admin_user', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'admin_user',
        is_active = true,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_manager_email, crypt(v_password, gen_salt('bf', 10)), 'Manager', 'User', 'manager', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'manager',
        is_active = true,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_viewer_email, crypt(v_password, gen_salt('bf', 10)), 'Viewer', 'User', 'viewer', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = 'viewer',
        is_active = true,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Login with:';
    RAISE NOTICE 'Tenant Slug: %', v_tenant_slug;
    RAISE NOTICE 'Password (same for all roles): %', v_password;
    RAISE NOTICE 'super_admin: %', v_super_admin_email;
    RAISE NOTICE 'admin_full: %', v_admin_full_email;
    RAISE NOTICE 'admin_user: %', v_admin_user_email;
    RAISE NOTICE 'manager: %', v_manager_email;
    RAISE NOTICE 'viewer: %', v_viewer_email;

END $$;

-- ============================================
-- ตรวจสอบ Tenant ที่สร้าง
-- ============================================
SELECT 
    id,
    name,
    slug,
    subscription_plan,
    subscription_status,
    created_at
FROM tenants
WHERE slug = 'your-company'  -- แก้ไข slug ตามที่ตั้งไว้
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- ตรวจสอบ Admin User ที่สร้าง
-- ============================================
SELECT
    u.id,
    u.email,
    u.role,
    u.is_active,
    u.email_verified,
    u.created_at
FROM users u
JOIN tenants t ON t.id = u.tenant_id
WHERE t.slug = 'your-company'  -- แก้ไข slug ตามที่ตั้งไว้
  AND u.email IN (
    'superadmin@yourcompany.com',
    'adminfull@yourcompany.com',
    'adminuser@yourcompany.com',
    'manager@yourcompany.com',
    'viewer@yourcompany.com'
  )
ORDER BY u.created_at DESC
LIMIT 50;
