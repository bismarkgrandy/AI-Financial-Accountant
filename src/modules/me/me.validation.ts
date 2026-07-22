import { z } from 'zod';

export const updateMeSchema = z
  .object({
    phoneNumber: z.string().trim().min(9).max(20).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email('Enter a valid email'),
});

export const confirmEmailChangeSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;