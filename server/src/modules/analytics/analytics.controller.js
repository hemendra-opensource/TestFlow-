import * as analyticsService from './analytics.service.js';
import { successResponse } from '../../utils/response.js';

export async function getOverview(req, res, next) {
  try {
    const data = await analyticsService.getOverviewMetrics(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, data, 200, 'Analytics overview retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getTaskStatus(req, res, next) {
  try {
    const data = await analyticsService.getTaskStatusDistribution(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, data, 200, 'Task status distribution retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getPriority(req, res, next) {
  try {
    const data = await analyticsService.getPriorityDistribution(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, data, 200, 'Priority distribution retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getWorkload(req, res, next) {
  try {
    const data = await analyticsService.getWorkloadAnalytics(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, data, 200, 'Team workload analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
}
