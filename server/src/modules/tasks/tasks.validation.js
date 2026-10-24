import { z } from 'zod';

export const createTaskSchema = z
  .object({
    title: z
      .string({ required_error: 'Task title is required' })
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters'),
    description: z
      .string()
      .trim()
      .max(5000, 'Description cannot exceed 5000 characters')
      .optional()
      .nullable(),
    status: z
      .enum(['todo', 'in_progress', 'in_review', 'done'], {
        errorMap: () => ({ message: 'Status must be todo, in_progress, in_review, or done' }),
      })
      .default('todo'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Priority must be low, medium, high, or urgent' }),
      })
      .default('medium'),
    assignee_id: z
      .string()
      .regex(/^[0-9a-f-]{36}$/i, 'Assignee ID must be a valid UUID')
      .optional()
      .nullable(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    position: z
      .number()
      .min(0, 'Position must be a non-negative number')
      .optional()
      .default(0),
  })
  .strict({
    message: 'Unexpected fields in payload',
  });

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, 'Description cannot exceed 5000 characters')
      .optional()
      .nullable(),
    status: z
      .enum(['todo', 'in_progress', 'in_review', 'done'], {
        errorMap: () => ({ message: 'Status must be todo, in_progress, in_review, or done' }),
      })
      .optional(),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Priority must be low, medium, high, or urgent' }),
      })
      .optional(),
    assignee_id: z
      .string()
      .regex(/^[0-9a-f-]{36}$/i, 'Assignee ID must be a valid UUID')
      .optional()
      .nullable(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    position: z
      .number()
      .min(0, 'Position must be a non-negative number')
      .optional(),
  })
  .strict({
    message: 'Unexpected fields in payload',
  });
