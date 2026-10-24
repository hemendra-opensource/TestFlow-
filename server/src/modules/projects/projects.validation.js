import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(100, 'Project name cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'completed', 'on_hold', 'archived'], {
        errorMap: () => ({ message: 'Status must be active, completed, on_hold, or archived' }),
      })
      .default('active'),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
  })
  .strict({
    message: 'Unexpected fields in payload',
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return new Date(data.start_date) <= new Date(data.due_date);
      }
      return true;
    },
    {
      message: 'Start date cannot be after due date',
      path: ['due_date'],
    }
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(100, 'Project name cannot exceed 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'completed', 'on_hold', 'archived'], {
        errorMap: () => ({ message: 'Status must be active, completed, on_hold, or archived' }),
      })
      .optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
  })
  .strict({
    message: 'Unexpected fields in payload',
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return new Date(data.start_date) <= new Date(data.due_date);
      }
      return true;
    },
    {
      message: 'Start date cannot be after due date',
      path: ['due_date'],
    }
  );
