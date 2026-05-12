import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function test() {
  console.log('Testing login logic...');
  const email = 'admin@clinic.com';
  const password = 'Admin@123';

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.log('User not found in database.');
      return;
    }

    console.log('User found:', user.email);
    console.log('User role:', user.role);
    console.log('User isActive:', user.isActive);

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('Password does not match.');
    } else {
      console.log('Login successful logic works.');
    }
  } catch (error) {
    console.error('Error during login logic test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
