import { z } from 'zod';

const inviteableRole = z.enum(['manager', 'stock_manager', 'cashier']);

export const inviteStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: inviteableRole,
  roleTitle: z.string().trim().min(2).max(60).optional(),
});

export const acceptInviteSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Invite code is required'),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateRoleSchema = z.object({
  role: inviteableRole,
  roleTitle: z.string().trim().min(2).max(60).optional().nullable(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;