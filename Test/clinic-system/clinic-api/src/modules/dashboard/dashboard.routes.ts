import { Router, Request, Response, NextFunction } from 'express';
import { startOfDay, endOfDay } from 'date-fns';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { allRoles } from '../../middleware/rbac';

const router = Router();
router.use(authenticate, allRoles);

router.get('/kpis', async (_req: Request, res: Response, next: NextFunction) => {
  try {
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
      prisma.patient.count({ where: { isActive: true } }),

      prisma.appointment.count({
        where: { startTime: { gte: start, lte: end } },
      }),

      prisma.payment.aggregate({
        where:   { paidAt: { gte: start, lte: end } },
        _sum:    { amount: true },
      }),

      prisma.doctor.count({ where: { isActive: true } }),

      prisma.appointment.count({
        where: { startTime: { gte: start, lte: end }, status: 'Pending' },
      }),

      prisma.appointment.count({
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

router.get('/appointments-today', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    const appointments = await prisma.appointment.findMany({
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
