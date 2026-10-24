import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z
    .string({ invalid_type_error: 'Full name must be a string' })
    .trim()
    .min(1, 'Full name cannot be empty')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  avatar_url: z
    .string({ invalid_type_error: 'Avatar URL must be a valid URL string' })
    .url('Avatar URL must be a valid URL')
    .max(500, 'Avatar URL cannot exceed 500 characters')
    .nullable()
    .optional(),
}).strict({
  message: 'Unexpected fields in request payload',
});
