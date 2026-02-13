import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockAccount() {
  try {
    // Find the user first
    const user = await prisma.user.findFirst({
      where: { email: 'admin@rga.com' }
    });
    
    if (user) {
      const result = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          isActive: true
        }
      });
      console.log('Account unlocked successfully:', result.email);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unlockAccount();
