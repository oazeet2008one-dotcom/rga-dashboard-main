import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

// FLOW START: Swagger Config (EN)
// จุดเริ่มต้น: ตั้งค่า Swagger (TH)

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'RGA Dashboard API',
    version: '1.0.0',
    description: 'RGA Dashboard Backend API Documentation',
    contact: {
      name: 'RGA Analytics',
      email: 'support@rgadashboard.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
    {
      url: 'https://api.rgadashboard.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management' },
    { name: 'Tenants', description: 'Tenant management' },
    { name: 'Campaigns', description: 'Campaign management' },
    { name: 'Metrics', description: 'Metrics and analytics' },
    { name: 'Alerts', description: 'Alert management' },
    { name: 'Integrations', description: 'Platform integrations' },
    { name: 'Reports', description: 'Report generation' },
    { name: 'AI', description: 'AI features' },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './dist/routes/*.js', // For compiled files
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// FLOW END: Swagger Config (EN)
// จุดสิ้นสุด: ตั้งค่า Swagger (TH)
