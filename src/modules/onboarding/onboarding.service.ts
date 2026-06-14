import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { postOpeningBalance, OpeningBalanceInput } from '@/journal/postingEngine';
import {
  computeStockValueFromCatalogue,
  countActiveProducts,
} from './computeStockValue';

export const completeOnboarding = async (
  businessId: string,
  userId: string,
  input: OpeningBalanceInput,
) => {
  // Load the business (need its tier)
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  // Guard — don't let onboarding run twice
  if (business.onboardingComplete) {
    throw new AppError('Onboarding has already been completed', 409);
  }

  // Determine the stock value based on tier
  let stockValue: number;

  if (business.tier === 'tier1') {
    // Tier 1: stock value is REQUIRED and must be positive.
    // A stock business always has stock — there is no valid
    // "zero stock" opening position.
    if (input.stockValue === undefined || input.stockValue <= 0) {
      throw new AppError(
        'Stock value is required. Enter the estimated value of ' +
          'the goods your business currently has in stock.',
        400,
      );
    }
    stockValue = input.stockValue;
  } else {
    // Tier 2: stock value is DERIVED from the catalogue.
    // The business must have built its catalogue first.
    stockValue = await prisma.$transaction(async (tx) => {
      const productCount = await countActiveProducts(tx, businessId);

      if (productCount === 0) {
        throw new AppError(
          'Please add your products before completing setup. ' +
            'Your opening stock value is calculated from your product catalogue.',
          400,
        );
      }

      return computeStockValueFromCatalogue(tx, businessId);
    });
  }

  // Build the opening balance input.
  // For Tier 2, override whatever stockValue was sent with the
  // computed value (the catalogue is the source of truth).
  const openingInput: OpeningBalanceInput = {
    ...input,
    stockValue,
  };

  // Post the opening balance (same engine for both tiers)
  const result = await postOpeningBalance(businessId, userId, openingInput);

  // Flip the flag
  await prisma.business.update({
    where: { id: businessId },
    data: { onboardingComplete: true },
  });

  return {
    referenceNumber: result.entry.referenceNumber,
    tier: business.tier,
    stockValue,
    ownerCapital: result.ownerCapital,
    linesPosted: result.lineCount,
    onboardingComplete: true,
  };
};