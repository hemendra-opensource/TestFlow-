import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { analyticsQuerySchema } from './analytics.validation.js';
import * as analyticsController from './analytics.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/overview',
  validate(analyticsQuerySchema, 'query'),
  analyticsController.getOverview
);

router.get(
  '/task-status',
  validate(analyticsQuerySchema, 'query'),
  analyticsController.getTaskStatus
);

router.get(
  '/priority',
  validate(analyticsQuerySchema, 'query'),
  analyticsController.getPriority
);

router.get(
  '/workload',
  validate(analyticsQuerySchema, 'query'),
  analyticsController.getWorkload
);

export default router;
