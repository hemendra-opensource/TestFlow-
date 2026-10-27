import * as reportsService from './reports.service.js';
import { successResponse } from '../../utils/response.js';

export async function getProjectReports(req, res, next) {
  try {
    const result = await reportsService.getProjectReports(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, result.data, 200, 'Project report generated successfully', {
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskReports(req, res, next) {
  try {
    const result = await reportsService.getTaskReports(
      req.user.id,
      req.scopedSupabase,
      req.query
    );
    return successResponse(res, result.data, 200, 'Task report generated successfully', {
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req, res, next) {
  try {
    const { csvContent, filename } = await reportsService.generateReportExport(
      req.user.id,
      req.scopedSupabase,
      req.query
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
