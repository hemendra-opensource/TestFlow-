import { z } from 'zod';

export const projectReportQuerySchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format').optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'archived']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['name', 'status', 'due_date', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const taskReportQuerySchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format').optional(),
  projectId: z.string().uuid('Invalid project ID format').optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID format').optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  datePreset: z.enum(['7d', '30d', '90d', 'all', 'custom']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['title', 'status', 'priority', 'due_date', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Start date cannot be after end date',
    path: ['startDate'],
  }
);

export const exportReportQuerySchema = z.object({
  type: z.enum(['projects', 'tasks'], {
    required_error: 'Report type (projects or tasks) is required for export',
  }),
  format: z.enum(['csv']).optional().default('csv'),
  workspaceId: z.string().uuid('Invalid workspace ID format').optional(),
  projectId: z.string().uuid('Invalid project ID format').optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid('Invalid assignee ID format').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  datePreset: z.enum(['7d', '30d', '90d', 'all', 'custom']).optional(),
  search: z.string().optional(),
});
