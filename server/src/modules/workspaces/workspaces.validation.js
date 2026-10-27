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
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
  })
  .strict({
    message: 'Unexpected fields in payload. Role or member attributes are strictly prohibited.',
  });

/**
 * Schema for PATCH /workspaces/:id
 * All fields optional but at least one required.
 * Slug changes are owner-only (enforced in the service layer).
 */
export const updateWorkspaceSchema = z
  .object({
    name: z
      .string({ invalid_type_error: 'Workspace name must be a string' })
      .trim()
      .min(2, 'Workspace name must be at least 2 characters')
      .max(100, 'Workspace name cannot exceed 100 characters')
      .optional(),
    slug: z
      .string({ invalid_type_error: 'Workspace slug must be a string' })
      .trim()
      .toLowerCase()
      .min(2, 'Workspace slug must be at least 2 characters')
      .max(60, 'Workspace slug cannot exceed 60 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must consist of lowercase alphanumeric characters and single hyphens'
      )
      .optional(),
    description: z
      .string({ invalid_type_error: 'Description must be a string' })
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
  })
  .strict({
    message: 'Only name, slug, and description may be updated.',
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field (name, slug, or description) must be provided' }
  );

export const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});
