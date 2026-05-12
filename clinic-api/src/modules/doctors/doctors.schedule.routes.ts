import { Router } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { adminOrReception } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

/**
 * @route GET /api/doctors/:id/schedule
 * @desc  Get weekly schedule for a doctor
 */
router.get('/:id/schedule', async (req, res, next) => {
  try {
    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: Number(req.params.id), isActive: true },
      orderBy: { dayOfWeek: 'asc' }
    });
    sendSuccess(res, schedules);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/doctors/:id/schedule
 * @desc  Update weekly schedule for a doctor (Bulk)
 */
router.put('/:id/schedule', adminOrReception, async (req, res, next) => {
  try {
    const doctorId = Number(req.params.id);
    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime }

    // Use transaction to ensure consistency
    await prisma.$transaction([
      // 1. Deactivate old schedules
      prisma.doctorSchedule.deleteMany({ where: { doctorId } }),
      // 2. Insert new ones
      prisma.doctorSchedule.createMany({
        data: schedules.map((s: any) => ({
          doctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        }))
      })
    ]);

    sendSuccess(res, null, 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
