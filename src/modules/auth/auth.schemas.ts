import { z } from 'zod';

export const signupSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum([
    'provision_store', 'supermarket', 'pharmacy', 'spare_parts',
    'hardware', 'boutique', 'wholesale', 'cosmetics',
    'electronics', 'stationery', 'phone_accessories', 'other',
  ]),
  ownerName: z.string().min(2, 'Owner name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  locationRegion: z.string().min(2, 'Region is required'),
  locationDistrict: z.string().min(2, 'District is required'),
  tier: z.enum(['tier1', 'tier2']),
  recordingMode: z.enum(['daily_summary', 'transaction']),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  strategy: z.string().default('email_password'),
}).passthrough();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;