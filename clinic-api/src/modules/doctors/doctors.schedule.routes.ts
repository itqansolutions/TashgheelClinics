import { Router } from 'express';
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
    const db = req.db!;
    const schedules = await db.doctorSchedule.findMany({
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
    const db = req.db!;
    const doctorId = Number(req.params.id);
    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime }

    // 1. Deactivate old schedules
    await db.doctorSchedule.deleteMany({ where: { doctorId } });

    // 2. Insert new ones
    if (schedules && schedules.length > 0) {
      await db.doctorSchedule.createMany({
        data: schedules.map((s: any) => ({
          doctorId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        }))
      });
    }

    sendSuccess(res, null, 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
});

export default router;

