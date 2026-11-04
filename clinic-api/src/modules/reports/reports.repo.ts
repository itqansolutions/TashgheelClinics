import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class ReportsRepository {
  async getFinancialSummary(db: TenantPrismaClient) {
    const [servicesIncome, productsIncome, otherIncome, generalExpenses, purchaseTotal] = await Promise.all([
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: 'Medical Services' },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: 'Product Sales' },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: { notIn: ['Medical Services', 'Product Sales'] } },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Expense', category: { not: 'Procurement' } },
        _sum: { amount: true }
      }),
      db.purchase.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    const totalIncome = Number(servicesIncome._sum?.amount || 0) + 
                      Number(productsIncome._sum?.amount || 0) + 
                      Number(otherIncome._sum?.amount || 0);
    
    const totalExpenses = Number(generalExpenses._sum?.amount || 0) + 
                         Number(purchaseTotal._sum?.totalAmount || 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      breakdown: {
        services: Number(servicesIncome._sum?.amount || 0),
        products: Number(productsIncome._sum?.amount || 0),
        other: Number(otherIncome._sum?.amount || 0),
        general: Number(generalExpenses._sum?.amount || 0),
        purchases: Number(purchaseTotal._sum?.totalAmount || 0)
      }
    };
  }

  async getIncomeBreakdown(db: TenantPrismaClient) {
    const services = await db.financialTransaction.aggregate({
      where: { type: 'Income', category: 'Medical Services' },
      _sum: { amount: true }
    });
    
    const products = await db.financialTransaction.aggregate({
      where: { type: 'Income', category: 'Product Sales' },
      _sum: { amount: true }
    });

    return {
      services: Number(services._sum?.amount || 0),
      products: Number(products._sum?.amount || 0)
    };
  }

  async getDoctorCommissions(db: TenantPrismaClient) {
    const appointments = await db.appointment.findMany({
      where: { status: 'Done' },
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            commission: true,
            user: { select: { fullName: true } }
          }
        }
      }
    });

    const docMap = new Map<number, any>();

    for (const apt of appointments) {
      const docId = apt.doctorId;
      const totalCharged = Number(apt.priceCharged || 0);
      const commissionPct = Number(apt.doctor?.commission || 0);
      const docCommission = (totalCharged * commissionPct) / 100;

      if (!docMap.has(docId)) {
        docMap.set(docId, {
          doctorId: docId,
          doctorName: apt.doctor?.user?.fullName || apt.doctor?.fullName || 'Unknown Doctor',
          totalRevenue: 0,
          totalCommission: 0,
          appointmentCount: 0
        });
      }

      const stats = docMap.get(docId);
      stats.totalRevenue += totalCharged;
      stats.totalCommission += docCommission;
      stats.appointmentCount += 1;
    }

    return Array.from(docMap.values());
  }

  async getCashFlow(db: TenantPrismaClient) {
    const transactions = await db.financialTransaction.findMany({
      orderBy: { date: 'asc' }
    });

    const flow: Record<string, any> = {};

    transactions.forEach(tx => {
      const date = tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!flow[date]) flow[date] = { date, income: 0, expense: 0 };
      
      if (tx.type === 'Income') flow[date].income += Number(tx.amount || 0);
      else flow[date].expense += Number(tx.amount || 0);
    });

    return Object.values(flow);
  }
}

export const reportsRepo = new ReportsRepository();

