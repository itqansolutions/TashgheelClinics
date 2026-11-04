import { Router, Request, Response, NextFunction } from 'express';
import { startOfDay, endOfDay } from 'date-fns';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { allRoles } from '../../middleware/rbac';

const router = Router();
router.use(authenticate, allRoles);

router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = req.db!;
    const today = new Date();
    const start = startOfDay(today);
    const end   = endOfDay(today);

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
        where:   { paidAt: { gte: start, lte: end } },
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
    const today = new Date();
    const appointments = await db.appointment.findMany({
      where: {
        startTime: { gte: startOfDay(today), lte: endOfDay(today) },
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

