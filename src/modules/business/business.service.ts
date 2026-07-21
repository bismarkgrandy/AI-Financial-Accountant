import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateBusinessInput } from './business.validation';

const BUSINESS_SELECT = {
  id: true,
  name: true,
  type: true,
  ownerName: true,
  phoneNumber: true,
  locationRegion: true,
  locationDistrict: true,
  tier: true,
  recordingMode: true,
  onboardingComplete: true,
  createdAt: true,
} as const;

export const getBusinessProfile = async (businessId: string) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: BUSINESS_SELECT,
  });

  if (!business) throw new AppError('Business not found', 404);

  return business;
};

export const updateBusinessProfile = async (businessId: string, input: UpdateBusinessInput) => {
  const business = await prisma.business.update({
    where: { id: businessId },
    data: input,
    select: BUSINESS_SELECT,
  });

  return business;
};