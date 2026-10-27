import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import workspacesRoutes from './modules/workspaces/workspaces.routes.js';
import { projectsRouter, workspaceProjectsRouter } from './modules/projects/projects.routes.js';
import { tasksRouter, projectTasksRouter } from './modules/tasks/tasks.routes.js';
import { commentsRouter, taskCommentsRouter } from './modules/comments/comments.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import { workspaceActivityRouter } from './modules/activity/activity.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { successResponse, errorResponse } from './utils/response.js';

export const createApp = () => {
  const app = express();

  // CORS Configuration
  const allowedOrigins = [
    config.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev, or origin check
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Payload limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // API v1 Router
  const apiV1Router = express.Router();

  // Health endpoint: GET /api/v1/health
  apiV1Router.get('/health', (req, res) => {
    return successResponse(
      res,
      {
        status: 'ok',
        service: 'teamflow-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      200,
      'TeamFlow API is running smoothly'
    );
  });

  // Mount modules
  apiV1Router.use('/auth', authRoutes);
  apiV1Router.use('/workspaces/:workspaceId/projects', workspaceProjectsRouter);
  apiV1Router.use('/workspaces/:workspaceId/activity', workspaceActivityRouter);
  apiV1Router.use('/projects/:projectId/tasks', projectTasksRouter);
  apiV1Router.use('/tasks/:taskId/comments', taskCommentsRouter);
  apiV1Router.use('/comments', commentsRouter);
  apiV1Router.use('/notifications', notificationsRouter);
  apiV1Router.use('/workspaces', workspacesRoutes);
  apiV1Router.use('/projects', projectsRouter);
  apiV1Router.use('/tasks', tasksRouter);
  apiV1Router.use('/dashboard', dashboardRoutes);
  apiV1Router.use('/analytics', analyticsRoutes);
  apiV1Router.use('/reports', reportsRoutes);

  // Attach API prefixes: support both /api/v1 and /api
  app.use('/api/v1', apiV1Router);
  app.use('/api', apiV1Router);

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
