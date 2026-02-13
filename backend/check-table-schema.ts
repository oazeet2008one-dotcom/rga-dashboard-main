import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTableSchema() {
  try {
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'seo_anchor_text' 
      ORDER BY ordinal_position
    `;
    console.log('SEO Anchor Text table schema:');
    console.log(schema);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableSchema();
