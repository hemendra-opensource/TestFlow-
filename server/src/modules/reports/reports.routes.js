import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  projectReportQuerySchema,
  taskReportQuerySchema,
  exportReportQuerySchema,
} from './reports.validation.js';
import * as reportsController from './reports.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/projects',
  validate(projectReportQuerySchema, 'query'),
  reportsController.getProjectReports
);

router.get(
  '/tasks',
  validate(taskReportQuerySchema, 'query'),
  reportsController.getTaskReports
);

router.get(
  '/export',
  validate(exportReportQuerySchema, 'query'),
  reportsController.exportReport
);

export default router;
