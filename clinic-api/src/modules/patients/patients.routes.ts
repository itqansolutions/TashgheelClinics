import { Router } from 'express';
import { patientsController } from './patients.controller';
import { authenticate } from '../../middleware/auth';
import { adminOnly, adminOrReception, allRoles } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
  updateAreasSchema,
} from './patients.schema';

const router = Router();
router.use(authenticate);

// List & Create
router.get('/',    allRoles,         validate(patientQuerySchema, 'query'), patientsController.list);
router.post('/',   adminOrReception, validate(createPatientSchema),         patientsController.create);

// Single patient
router.get('/:id',    allRoles,         patientsController.getById);
router.put('/:id',    adminOrReception, validate(updatePatientSchema), patientsController.update);
router.delete('/:id', adminOnly,        patientsController.deactivate);

// Sub-resources
router.get('/:id/appointments', allRoles,         patientsController.getAppointments);
router.get('/:id/areas',        allRoles,         patientsController.getAreas);
router.put('/:id/areas',        allRoles,         validate(updateAreasSchema), patientsController.updateAreas);
router.delete('/:id/areas/:areaId', adminOrReception, patientsController.removeArea);
router.get('/:id/ratings',      allRoles,         patientsController.getRatings);
router.get('/:id/images',       allRoles,         patientsController.getImages);

export default router;
