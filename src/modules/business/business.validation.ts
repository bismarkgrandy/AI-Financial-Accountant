import { z } from 'zod';
import { BusinessType } from '@prisma/client';

export const updateBusinessSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    type: z.nativeEnum(BusinessType).optional(),
    ownerName: z.string().trim().min(2).max(120).optional(),
    phoneNumber: z.string().trim().min(9).max(20).optional(),
    locationRegion: z.string().trim().min(2).max(80).optional(),
    locationDistrict: z.string().trim().min(2).max(80).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Provide at least one field to update',
  });

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;