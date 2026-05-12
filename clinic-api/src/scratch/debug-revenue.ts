import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRevenue() {
  const allAppts = await prisma.appointment.findMany({
    select: {
      id: true,
      status: true,
      priceCharged: true,
      service: { select: { price: true } }
    }
  });

  console.log('--- All Appointments ---');
  console.table(allAppts.map(a => ({
    id: a.id,
    status: a.status,
    priceCharged: a.priceCharged,
    servicePrice: a.service.price
  })));

  const revenue = await prisma.appointment.aggregate({
    _sum: { priceCharged: true },
    where: { status: 'Done' }
  });

  console.log('--- Aggregate Revenue (Status: Done) ---');
  console.log(revenue);

  const doneNoPrice = await prisma.appointment.count({
    where: { 
      status: 'Done',
      OR: [
        { priceCharged: null },
        { priceCharged: 0 }
      ]
    }
  });

  console.log('--- Done Appointments with Zero/Null Price ---');
  console.log(doneNoPrice);
}

checkRevenue()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
