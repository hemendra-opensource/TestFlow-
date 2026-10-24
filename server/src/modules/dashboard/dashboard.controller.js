import * as dashboardService from './dashboard.service.js';
import { successResponse } from '../../utils/response.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardMetrics(req.scopedSupabase, req.user.id);
    return successResponse(res, stats, 200, 'Dashboard statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};
