// Test setup file
import dotenv from 'dotenv';

// FLOW START: Test Setup (EN)
// จุดเริ่มต้น: ตั้งค่า Tests (TH)

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rga_dashboard_test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// FLOW END: Test Setup (EN)
// จุดสิ้นสุด: ตั้งค่า Tests (TH)
