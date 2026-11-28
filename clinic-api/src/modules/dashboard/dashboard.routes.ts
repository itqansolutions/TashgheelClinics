import { Router, Request, Response, NextFunction } from 'express';
import { getTenantTz, dayRange, toZoned } from '../../utils/tz';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { allRoles } from '../../middleware/rbac';

const router = Router();
router.use(authenticate, allRoles);

router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const tz = await getTenantTz(db);
    const { start, end: endExcl } = dayRange(toZoned(new Date(), tz).ymd, tz);
    const end = new Date(endExcl.getTime() - 1);

    // Payments whose income entry was voided must not count toward dashboard revenue
    const voidedIncomeTx = await db.financialTransaction.findMany({
      where: { type: 'Income', referenceType: 'Appointment', voidedAt: { not: null } },
      select: { referenceId: true }
    });
    const voidedApptIds = voidedIncomeTx.map((t: any) => t.referenceId).filter((x: any) => x != null);

    const [
      totalPatients,
      todayAppointments,
      todayRevenue,
      activeDoctors,
      pendingToday,
      confirmedToday,
    ] = await Promise.all([
      db.patient.count({ where: { isActive: true } }),

      db.appointment.count({
        where: { startTime: { gte: start, lte: end } },
      }),

      db.payment.aggregate({
        where:   { paidAt: { gte: start, lte: end }, appointmentId: { notIn: voidedApptIds } },
        _sum:    { amount: true },
      }),

      db.doctor.count({ where: { isActive: true } }),

      db.appointment.count({
        where: { startTime: { gte: start, lte: end }, status: 'Pending' },
      }),

      db.appointment.count({
        where: { startTime: { gte: start, lte: end }, status: 'Confirmed' },
      }),
    ]);

    sendSuccess(res, {
      totalPatients,
      todayAppointments,
      todayRevenue:    Number(todayRevenue._sum.amount ?? 0),
      activeDoctors,
      pendingToday,
      confirmedToday,
    });
  } catch (e) { next(e); }
});

router.get('/appointments-today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const tz = await getTenantTz(db);
    const dr = dayRange(toZoned(new Date(), tz).ymd, tz);
    const appointments = await db.appointment.findMany({
      where: {
        startTime: { gte: dr.start, lt: dr.end },
      },
      include: {
        patient: { select: { id: true, fullName: true, code: true, phone: true } },
        doctor:  { include: { user: { select: { fullName: true } } } },
        service: { select: { id: true, name: true, durationMin: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    sendSuccess(res, appointments);
  } catch (e) { next(e); }
});

export default router;

