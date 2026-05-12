import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRevenue() {
  console.log('Searching for Done appointments with no price...');
  
  const affected = await prisma.appointment.findMany({
    where: {
      status: 'Done',
      OR: [
        { priceCharged: null },
        { priceCharged: 0 }
      ]
    },
    include: { service: true }
  });

  console.log(`Found ${affected.length} appointments to fix.`);

  for (const apt of affected) {
    console.log(`Fixing appointment #${apt.id} - Setting price to ${apt.service.price}`);
    await prisma.appointment.update({
      where: { id: apt.id },
      data: { priceCharged: apt.service.price }
    });
  }

  console.log('Fix complete.');
}

fixRevenue()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
