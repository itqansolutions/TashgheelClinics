import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env, isDev } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes       from './modules/auth/auth.routes';
import userRoutes       from './modules/users/users.routes';
import specialtyRoutes  from './modules/specialties/specialties.routes';
import serviceRoutes    from './modules/services/services.routes';
import doctorRoutes     from './modules/doctors/doctors.routes';
import patientRoutes    from './modules/patients/patients.routes';
import settingsRoutes   from './modules/settings/settings.routes';
import dashboardRoutes  from './modules/dashboard/dashboard.routes';
// Sprint 4:
import appointmentRoutes from './modules/appointments/appointments.routes';
import reportRoutes      from './modules/reports/reports.routes';
import bookingRoutes     from './modules/booking/booking.routes';
import stockRoutes       from './modules/stock/stock.routes';
import financeRoutes     from './modules/finance/finance.routes';

const app = express();

// Required for Railway/Heroku/Cloud proxies
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 1000, // Increased for dev/testing
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(isDev ? 'dev' : 'combined'));
app.use('/uploads', express.static(path.join(process.cwd(), env.LOCAL_UPLOAD_DIR)));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Clinic API running', version: '1.0.0', env: env.NODE_ENV });
});

const API = '/api';
app.use(`${API}/auth`,        authRoutes);
app.use(`${API}/users`,       userRoutes);
app.use(`${API}/specialties`, specialtyRoutes);
app.use(`${API}/services`,    serviceRoutes);
app.use(`${API}/doctors`,     doctorRoutes);
app.use(`${API}/patients`,    patientRoutes);
app.use(`${API}/settings`,    settingsRoutes);
app.use(`${API}/dashboard`,   dashboardRoutes);
app.use(`${API}/appointments`, appointmentRoutes);
app.use(`${API}/reports`,      reportRoutes);
app.use(`${API}/public`,       bookingRoutes);
app.use(`${API}/stock`,        stockRoutes);
app.use(`${API}/finance`,      financeRoutes);

// Serve Frontend in Production
if (!isDev) {
  const frontendPath = path.join(__dirname, '../../clinic-web/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
