import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'superadmin@itqansolutions.org';
  const password = process.argv[3] || 'SuperAdmin@2026';
  const fullName = process.argv[4] || 'Platform Super Admin';

  console.log(`\n🔧 Creating or updating Super Admin user: ${email} ...`);

  const passwordHash = await bcrypt.hash(password, 12);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        systemRole: 'SYSTEM_ADMIN',
        tenantId: null, // Critical: System Admin has no tenantId (XOR constraint)
        role: 'Admin',
        passwordHash,
        isActive: true,
      },
    });
    console.log(`✅ User ${email} promoted to SYSTEM_ADMIN successfully!`);
    console.log(`   ID: ${updated.id}, systemRole: ${updated.systemRole}, tenantId: ${updated.tenantId}`);
  } else {
    const created = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'Admin',
        systemRole: 'SYSTEM_ADMIN',
        tenantId: null, // Critical: System Admin has no tenantId
        isActive: true,
      },
    });
    console.log(`✅ Super Admin created successfully!`);
    console.log(`   Email: ${created.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   systemRole: ${created.systemRole}, tenantId: ${created.tenantId}`);
  }

  console.log('\n👉 You can now log in with these credentials at /login to access /superadmin.\n');
}

main()
  .catch((err) => {
    console.error('❌ Failed to create superadmin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
