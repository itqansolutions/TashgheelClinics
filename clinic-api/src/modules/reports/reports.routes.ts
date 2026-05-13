import { Router } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { reportsRepo } from './reports.repo';

const router = Router();

router.use(authenticate);
router.use(rbac('Admin', 'Manager', 'Accountant'));

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
      totalRevenue: Number(revenue._sum.priceCharged || 0)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/financial-summary', async (req, res, next) => {
  try {
    const stats = await reportsRepo.getFinancialSummary();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
});

router.get('/income-breakdown', async (req, res, next) => {
  try {
    const stats = await reportsRepo.getIncomeBreakdown();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
});

router.get('/doctor-commissions', async (req, res, next) => {
  try {
    const stats = await reportsRepo.getDoctorCommissions();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
});

router.get('/cash-flow', async (req, res, next) => {
  try {
    const stats = await reportsRepo.getCashFlow();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
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
    const stats = await reportsRepo.getDoctorCommissions();
    sendSuccess(res, stats.map(s => ({
      doctorName: s.doctorName,
      revenue: s.totalRevenue,
      count: s.appointmentCount
    })));
  } catch (error) { next(error); }
});

export default router;
