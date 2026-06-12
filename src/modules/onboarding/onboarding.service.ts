import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { postOpeningBalance, OpeningBalanceInput } from '@/journal/postingEngine';

export const completeOnboarding = async (
  businessId: string,
  userId: string,
  input: OpeningBalanceInput,
) => {
  // Guard — not leting onboarding run twice
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  if (business.onboardingComplete) {
    throw new AppError('Onboarding has already been completed', 409);
  }

  const result = await postOpeningBalance(businessId, userId, input);

  await prisma.business.update({
    where: { id: businessId },
    data: { onboardingComplete: true },
  });

  return {
    referenceNumber: result.entry.referenceNumber,
    ownerCapital: result.ownerCapital,
    linesPosted: result.lineCount,
    onboardingComplete: true,
  };
};