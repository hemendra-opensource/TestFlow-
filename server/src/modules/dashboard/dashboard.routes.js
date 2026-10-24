import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as dashboardController from './dashboard.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/stats', dashboardController.getDashboardStats);

export default router;
