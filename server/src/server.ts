import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testSupabaseConnection, ensureEventBannersBucket } from './config/supabase';
import { seedCategoriesIfEmpty } from './controllers/category.controller';
import { seedEventsIfEmpty } from './controllers/event.controller';
import healthRoutes from './routes/health.routes';
import categoryRoutes from './routes/category.routes';
import eventRoutes from './routes/event.routes';
import registrationRoutes from './routes/registration.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// Root informational endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Event Management System API (Supabase Backend)',
    version: '2.0.0',
    database: 'Supabase PostgreSQL',
    endpoints: {
      health: 'GET /api/health',
      categories: 'GET /api/categories',
      events: 'GET /api/events',
      eventDetail: 'GET /api/events/:id',
      eventRegister: 'POST /api/events/:eventId/register',
      myRegistrations: 'GET /api/registrations/me',
      cancelRegistration: 'PATCH /api/registrations/:id/cancel',
      adminCreateEvent: 'POST /api/events',
      adminUpdateEvent: 'PATCH /api/events/:id',
      adminDeleteEvent: 'DELETE /api/events/:id',
      adminRegistrations: 'GET /api/admin/registrations',
      adminDashboard: 'GET /api/admin/dashboard',
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Test Supabase connection
  await testSupabaseConnection();

  // Ensure default categories exist in Supabase
  await seedCategoriesIfEmpty();

  // Ensure initial events exist in Supabase
  await seedEventsIfEmpty();

  // Ensure event-banners Supabase Storage bucket exists
  await ensureEventBannersBucket();

  app.listen(PORT, () => {
    console.log(`🚀 Supabase Express Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🎉 Events Endpoint: http://localhost:${PORT}/api/events`);
    console.log(`🏷️ Categories Endpoint: http://localhost:${PORT}/api/categories`);
  });
};

startServer();

export default app;
