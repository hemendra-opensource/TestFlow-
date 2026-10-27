import { z } from 'zod';

export const analyticsQuerySchema = z.object({
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
  dateField: z.enum(['created_at', 'due_date']).optional().default('created_at'),
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
