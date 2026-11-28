import { TenantPrismaClient } from '../../utils/tenantPrisma';

export class ReportsRepository {
  async getFinancialSummary(db: TenantPrismaClient) {
    const [servicesIncome, productsIncome, otherIncome, generalExpenses, purchaseTotal] = await Promise.all([
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: 'Medical Services', voidedAt: null },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: 'Product Sales', voidedAt: null },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Income', category: { notIn: ['Medical Services', 'Product Sales'] }, voidedAt: null },
        _sum: { amount: true }
      }),
      db.financialTransaction.aggregate({
        where: { type: 'Expense', category: { not: 'Procurement' }, voidedAt: null },
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
      where: { type: 'Income', category: 'Medical Services', voidedAt: null },
      _sum: { amount: true }
    });
    
    const products = await db.financialTransaction.aggregate({
      where: { type: 'Income', category: 'Product Sales', voidedAt: null },
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
    const [transactions, purchases] = await Promise.all([
      db.financialTransaction.findMany({
        where: { voidedAt: null },
        orderBy: { date: 'asc' }
      }),
      // Inventory purchases are real money out and must show in the flow like other expenses
      db.purchase.findMany({
        where: { status: { not: 'Cancelled' } },
        select: {
          id: true,
          invoiceNo: true,
          totalAmount: true,
          purchaseDate: true,
          vendor: { select: { name: true } }
        },
        orderBy: { purchaseDate: 'asc' }
      })
    ]);

    const flow: Record<string, any> = {};
    const dayKey = (d: any) => (d ? new Date(d) : new Date()).toISOString().split('T')[0];
    const ensure = (date: string) => {
      if (!flow[date]) flow[date] = { date, income: 0, expense: 0, incomeByCategory: {} as Record<string, number>, expenseByCategory: {} as Record<string, number>, items: [] as any[] };
      return flow[date];
    };

    transactions.forEach(tx => {
      const day = ensure(dayKey(tx.date));
      const amount = Number(tx.amount || 0);
      const category = tx.category || 'Other';
      const isIncome = tx.type === 'Income';
      if (isIncome) {
        day.income += amount;
        day.incomeByCategory[category] = (day.incomeByCategory[category] || 0) + amount;
      } else {
        day.expense += amount;
        day.expenseByCategory[category] = (day.expenseByCategory[category] || 0) + amount;
      }
      day.items.push({
        kind: isIncome ? 'income' : 'expense',
        category,
        description: tx.description || '',
        amount
      });
    });

    purchases.forEach(p => {
      const day = ensure(dayKey(p.purchaseDate));
      const amount = Number(p.totalAmount || 0);
      day.expense += amount;
      day.expenseByCategory['Inventory Purchases'] = (day.expenseByCategory['Inventory Purchases'] || 0) + amount;
      day.items.push({
        kind: 'expense',
        category: 'Inventory Purchases',
        description: `Purchase ${p.invoiceNo || '#' + p.id}${p.vendor?.name ? ' - ' + p.vendor.name : ''}`,
        amount
      });
    });

    return Object.values(flow).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const reportsRepo = new ReportsRepository();

