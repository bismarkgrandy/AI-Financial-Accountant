import { PrismaClient, AccountType, NormalBalance } from '@prisma/client';

const prisma = new PrismaClient();

export const CHART_OF_ACCOUNTS = [
  { code: '1001', name: 'Cash in hand',              type: 'asset',     subtype: 'cash_hand',         normalBalance: 'debit'  },
  { code: '1002', name: 'MTN MoMo',                  type: 'asset',     subtype: 'cash_momo_mtn',     normalBalance: 'debit'  },
  { code: '1003', name: 'Telecel Cash',              type: 'asset',     subtype: 'cash_momo_telecel', normalBalance: 'debit'  },
  { code: '1004', name: 'AirtelTigo Money',          type: 'asset',     subtype: 'cash_momo_airtel',  normalBalance: 'debit'  },
  { code: '1005', name: 'Bank account',              type: 'asset',     subtype: 'cash_bank',         normalBalance: 'debit'  },
  { code: '1006', name: 'Stock / Inventory',         type: 'asset',     subtype: 'stock',             normalBalance: 'debit'  },
  { code: '1007', name: 'Debtors',                   type: 'asset',     subtype: 'debtors',           normalBalance: 'debit'  },
  { code: '1008', name: 'Fixed assets',              type: 'asset',     subtype: 'fixed_assets',      normalBalance: 'debit'  },
  { code: '2001', name: 'Creditors',                 type: 'liability', subtype: 'creditors',         normalBalance: 'credit' },
  { code: '2002', name: 'Owner loan',                type: 'liability', subtype: 'owner_loan',        normalBalance: 'credit' },
  { code: '3001', name: 'Owner capital',             type: 'equity',    subtype: 'owner_capital',     normalBalance: 'credit' },
  { code: '3002', name: 'Retained earnings',         type: 'equity',    subtype: 'retained_earnings', normalBalance: 'credit' },
  { code: '3003', name: 'Owner drawings',            type: 'equity',    subtype: 'owner_drawings',    normalBalance: 'debit'  },
  { code: '4001', name: 'Sales revenue',             type: 'revenue',   subtype: 'sales',             normalBalance: 'credit' },
  { code: '4002', name: 'Other income',              type: 'revenue',   subtype: 'other_income',      normalBalance: 'credit' },
  { code: '5001', name: 'Cost of goods sold',        type: 'cogs',      subtype: 'cogs',              normalBalance: 'debit'  },
  { code: '6001', name: 'Purchases',                 type: 'expense',   subtype: 'purchases',         normalBalance: 'debit'  },
  { code: '7001', name: 'Rent',                      type: 'expense',   subtype: 'rent',              normalBalance: 'debit'  },
  { code: '7002', name: 'Staff wages',               type: 'expense',   subtype: 'wages',             normalBalance: 'debit'  },
  { code: '7003', name: 'Electricity and utilities', type: 'expense',   subtype: 'utilities',         normalBalance: 'debit'  },
  { code: '7004', name: 'Transport and delivery',    type: 'expense',   subtype: 'transport',         normalBalance: 'debit'  },
  { code: '7005', name: 'Mobile money charges',      type: 'expense',   subtype: 'momo_charges',      normalBalance: 'debit'  },
  { code: '7006', name: 'Bank charges',              type: 'expense',   subtype: 'bank_charges',      normalBalance: 'debit'  },
  { code: '7007', name: 'Packaging materials',       type: 'expense',   subtype: 'packaging',         normalBalance: 'debit'  },
  { code: '7008', name: 'Miscellaneous',             type: 'expense',   subtype: 'miscellaneous',     normalBalance: 'debit'  },
] as const;

// Called by the signup flow — seeds all 24 accounts for one business
export async function seedAccountsForBusiness(
  businessId: string,
  tx = prisma,
): Promise<void> {
  await tx.account.createMany({
    data: CHART_OF_ACCOUNTS.map((a) => ({
      businessId,
      code: a.code,
      name: a.name,
      type: a.type as AccountType,
      subtype: a.subtype,
      normalBalance: a.normalBalance as NormalBalance,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  console.log(`Chart of accounts ready — ${CHART_OF_ACCOUNTS.length} accounts per business.`);
  console.log('Accounts are seeded per business at signup, not globally.');
}

main()
  .catch((e) => {
    console.error(e);
    (globalThis as any).process?.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });