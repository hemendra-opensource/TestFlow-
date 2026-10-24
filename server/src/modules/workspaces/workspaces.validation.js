import { z } from 'zod';

export const createWorkspaceSchema = z
  .object({
    name: z
      .string({ required_error: 'Workspace name is required', invalid_type_error: 'Workspace name must be a string' })
      .trim()
      .min(2, 'Workspace name must be at least 2 characters')
      .max(100, 'Workspace name cannot exceed 100 characters'),
    slug: z
      .string({ required_error: 'Workspace slug is required', invalid_type_error: 'Workspace slug must be a string' })
      .trim()
      .toLowerCase()
      .min(2, 'Workspace slug must be at least 2 characters')
      .max(60, 'Workspace slug cannot exceed 60 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must consist of lowercase alphanumeric characters and single hyphens without leading or trailing hyphens'
      ),
  })
  .strict({
    message: 'Unexpected fields in payload. Role or member attributes are strictly prohibited.',
  });
