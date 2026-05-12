import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const email = 'admin@clinic.com';
  const newPasswordHash = await bcrypt.hash('12345678', 12);
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash: newPasswordHash, isActive: true }
  });
  
  console.log(`✅ Password for ${email} has been reset to: 12345678`);
  await prisma.$disconnect();
}

resetAdminPassword();
