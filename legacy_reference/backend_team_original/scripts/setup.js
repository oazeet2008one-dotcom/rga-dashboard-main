/**
 * Setup Script สำหรับสร้าง Tenant และ Super Admin แรก
 * 
 * วิธีใช้งาน:
 * 1. ตั้งค่า .env ให้ถูกต้อง
 * 2. รัน: node scripts/setup.js
 * 
 * หรือใช้ API endpoint: POST /api/v1/bootstrap
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// ตั้งค่าข้อมูล (แก้ไขตามต้องการ)
const CONFIG = {
  tenantName: process.env.SETUP_TENANT_NAME || 'Your Company Name',
  tenantSlug: process.env.SETUP_TENANT_SLUG || 'your-company',
  adminEmail: process.env.SETUP_ADMIN_EMAIL || 'admin@yourcompany.com',
  adminPassword: process.env.SETUP_ADMIN_PASSWORD || 'Admin@123456',
  adminFirstName: process.env.SETUP_ADMIN_FIRST_NAME || 'Admin',
  adminLastName: process.env.SETUP_ADMIN_LAST_NAME || 'User',
};

async function checkStatus() {
  try {
    const response = await axios.get(`${API_URL}${API_PREFIX}/bootstrap/status`);
    return response.data;
  } catch (error) {
    console.error('❌ Error checking bootstrap status:', error.message);
    return null;
  }
}

async function bootstrap() {
  console.log('🚀 Starting RGA Dashboard Bootstrap...\n');
  console.log('Configuration:');
  console.log(`  Tenant Name: ${CONFIG.tenantName}`);
  console.log(`  Tenant Slug: ${CONFIG.tenantSlug}`);
  console.log(`  Admin Email: ${CONFIG.adminEmail}`);
  console.log(`  Admin Name: ${CONFIG.adminFirstName} ${CONFIG.adminLastName}\n`);

  // ตรวจสอบสถานะ
  console.log('📊 Checking bootstrap status...');
  const status = await checkStatus();
  
  if (!status) {
    console.error('❌ Cannot connect to API. Make sure server is running.');
    console.log(`   API URL: ${API_URL}${API_PREFIX}/bootstrap/status`);
    process.exit(1);
  }

  if (status.data.isBootstrapped) {
    console.log('⚠️  System is already bootstrapped!');
    console.log(`   Existing tenants: ${status.data.tenantCount}`);
    console.log(`   Existing users: ${status.data.userCount}`);
    console.log('\n   Use regular API endpoints to create additional tenants/users.');
    process.exit(0);
  }

  console.log('✅ System is ready for bootstrap\n');

  // ทำ bootstrap
  try {
    console.log('🔧 Creating tenant and super admin...');
    const response = await axios.post(`${API_URL}${API_PREFIX}/bootstrap`, CONFIG);

    if (response.data.success) {
      console.log('\n✅ Bootstrap completed successfully!\n');
      console.log('Tenant:');
      console.log(`  ID: ${response.data.data.tenant.id}`);
      console.log(`  Name: ${response.data.data.tenant.name}`);
      console.log(`  Slug: ${response.data.data.tenant.slug}\n`);
      console.log('Super Admin:');
      console.log(`  ID: ${response.data.data.user.id}`);
      console.log(`  Email: ${response.data.data.user.email}`);
      console.log(`  Role: ${response.data.data.user.role}\n`);
      console.log('🔑 Access Token:');
      console.log(`  ${response.data.data.token}\n`);
      console.log('📝 Next Steps:');
      console.log('  1. Save the token securely');
      console.log('  2. Use this token to authenticate API requests');
      console.log('  3. Login at: POST /api/v1/auth/login');
      console.log(`     Body: { "email": "${CONFIG.adminEmail}", "password": "...", "tenantId": "${response.data.data.tenant.id}" }`);
    } else {
      console.error('❌ Bootstrap failed:', response.data.message);
      process.exit(1);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Bootstrap failed:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.message}`);
      if (error.response.data.error) {
        console.error(`   Error: ${error.response.data.error}`);
      }
    } else {
      console.error('❌ Network error:', error.message);
      console.error('   Make sure the server is running on', API_URL);
    }
    process.exit(1);
  }
}

// รัน script
bootstrap();

