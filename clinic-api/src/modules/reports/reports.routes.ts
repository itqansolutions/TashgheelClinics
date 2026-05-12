import { Router } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);
router.use(rbac('Admin'));

/**
 * @route GET /api/reports/summary
 * @desc  Get high-level clinic summary
 */
router.get('/summary', async (req, res, next) => {
  try {
    const [patientsCount, appointmentsCount, doctorsCount, revenue] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.doctor.count(),
      prisma.appointment.aggregate({
        _sum: { priceCharged: true },
        where: { status: 'Done' }
      })
    ]);

    sendSuccess(res, {
      patientsCount,
      appointmentsCount,
      doctorsCount,
      totalRevenue: revenue._sum.priceCharged || 0
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/appointments-by-status
 */
router.get('/appointments-status', async (req, res, next) => {
  try {
    const stats = await prisma.appointment.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/revenue-by-doctor
 */
router.get('/revenue-doctor', async (req, res, next) => {
  try {
    const stats = await prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { status: 'Done' },
      _sum: { priceCharged: true },
      _count: { id: true }
    });
    
    // Enrich with doctor names
    const enriched = await Promise.all(stats.map(async (s) => {
      const doc = await prisma.doctor.findUnique({
        where: { id: s.doctorId },
        include: { user: { select: { fullName: true } } }
      });
      return {
        doctorName: doc?.user?.fullName || 'Unknown',
        revenue: s._sum.priceCharged || 0,
        count: s._count.id
      };
    }));

    sendSuccess(res, enriched);
  } catch (error) {
    next(error);
  }
});

export default router;
