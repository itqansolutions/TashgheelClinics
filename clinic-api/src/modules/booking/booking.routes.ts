import { Router } from 'express';
import prisma from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * @route GET /api/public/settings
 * @desc  Get public clinic settings (name, etc)
 */
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.clinicSetting.findMany({
      where: { key: { in: ['clinic_name', 'clinic_slogan'] } }
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    sendSuccess(res, map);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/specialties
 * @desc  Get available specialties
 */
router.get('/specialties', async (req, res, next) => {
  try {
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    sendSuccess(res, specialties);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/lead-sources
 * @desc  Get lead sources for registration
 */
router.get('/lead-sources', async (req, res, next) => {
  try {
    const sources = await prisma.leadSource.findMany({
      select: { id: true, name: true }
    });
    sendSuccess(res, sources);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/check-patient
 * @desc  Check if patient exists by phone and return basic history
 */
router.get('/check-patient', async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) throw new AppError('Phone is required', 400);

    const patient = await prisma.patient.findFirst({
      where: { phone: String(phone) },
      select: {
        id: true,
        fullName: true,
        email: true,
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          select: {
            id: true,
            startTime: true,
            status: true,
            service: { select: { name: true } },
            doctor: { select: { id: true, fullName: true, user: { select: { fullName: true } } } }
          }
        }
      }
    });

    sendSuccess(res, patient || { isNew: true });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/doctors
 * @desc  Get available doctors for public booking with schedules
 */
router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        user: { select: { fullName: true } },
        specialty: { select: { id: true, name: true } },
        schedules: {
          where: { isActive: true },
          select: { dayOfWeek: true, startTime: true, endTime: true }
        }
      }
    });
    sendSuccess(res, doctors);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/services
 * @desc  Get available services for public booking
 */
router.get('/services', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, durationMin: true, specialtyId: true }
    });
    sendSuccess(res, services);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/public/doctor-busy-times
 * @desc  Get busy slots for a doctor on a specific date
 */
router.get('/doctor-busy-times', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) throw new AppError('Doctor ID and Date are required', 400);

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: Number(doctorId),
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Pending', 'Confirmed', 'Done'] }
      },
      select: { startTime: true, endTime: true }
    });

    sendSuccess(res, appointments);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/public/book
 * @desc  Create a booking request from an unauthenticated user
 */
router.post('/book', async (req, res, next) => {
  try {
    const { 
      fullName, phone, email, 
      doctorId, serviceId, startTime, notes,
      dateOfBirth, gender, nationality, leadSourceId
    } = req.body;

    let patient = await prisma.patient.findFirst({ where: { phone } });

    if (!patient) {
      const count = await prisma.patient.count();
      const code = `G-${(count + 1).toString().padStart(4, '0')}`;
      patient = await prisma.patient.create({
        data: { 
          fullName, 
          phone, 
          email, 
          code, 
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          nationality,
          leadSourceId: leadSourceId ? Number(leadSourceId) : null,
          notes: 'Public Booking Guest' 
        }
      });
    }

    const service = serviceId ? await prisma.service.findUnique({ where: { id: Number(serviceId) } }) : null;
    
    const start = new Date(startTime);
    const duration = service?.durationMin || 30;
    const end = new Date(start.getTime() + duration * 60000);

    const dayOfWeek = start.getDay();
    const schedule = await prisma.doctorSchedule.findFirst({
      where: { doctorId: Number(doctorId), dayOfWeek, isActive: true }
    });

    if (!schedule) throw new AppError('Doctor does not work on this day', 400);

    const requestedTime = start.toTimeString().slice(0, 5);
    if (requestedTime < schedule.startTime || requestedTime > schedule.endTime) {
      throw new AppError(`Doctor available from ${schedule.startTime} to ${schedule.endTime}`, 400);
    }

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: Number(doctorId),
        status: { in: ['Pending', 'Confirmed'] },
        OR: [
          { startTime: { lt: end, gte: start } },
          { endTime: { gt: start, lte: end } }
        ]
      }
    });

    if (conflict) throw new AppError('This time slot is already taken.', 409);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: Number(doctorId),
        serviceId: serviceId ? Number(serviceId) : null,
        startTime: start,
        endTime: end,
        status: 'Pending',
        notes: notes || 'Booked via Online Portal',
        priceCharged: service?.price || 0,
      }
    });

    sendSuccess(res, appointment, 'Your booking request has been received!', 201);
  } catch (error) {
    next(error);
  }
});

export default router;
