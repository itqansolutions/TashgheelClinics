import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  const email = 'admin@clinic.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(`❌ User ${email} NOT found in database.`);
  } else {
    console.log(`✅ User ${email} found!`);
    console.log(`Role: ${user.role}`);
    console.log(`Is Active: ${user.isActive}`);
    
    const match = await bcrypt.compare('Admin@123', user.passwordHash);
    console.log(`Password 'Admin@123' matches: ${match}`);
  }
  await prisma.$disconnect();
}

checkAdmin();
