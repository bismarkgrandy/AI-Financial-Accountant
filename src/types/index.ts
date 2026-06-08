export type UserRole = 'owner' | 'manager' | 'cashier' | 'stock_manager';

export type PaymentMethod =
  | 'cash'
  | 'mtn_momo'
  | 'telecel'
  | 'airtel'
  | 'bank'
  | 'credit'
  | 'mixed';

export type EntryType =
  | 'sale'
  | 'stock_purchase'
  | 'expense'
  | 'debtor_payment'
  | 'creditor_payment'
  | 'daily_summary'
  | 'opening_balance'
  | 'owner_deposit'
  | 'owner_withdrawal'
  | 'stock_count_adjustment';

export type ExpenseCategory =
  | 'rent'
  | 'wages'
  | 'utilities'
  | 'transport'
  | 'momo_charges'
  | 'bank_charges'
  | 'packaging'
  | 'miscellaneous';

export type AccountSubtype =
  | 'cash_hand'
  | 'cash_momo_mtn'
  | 'cash_momo_telecel'
  | 'cash_momo_airtel'
  | 'cash_bank'
  | 'stock'
  | 'debtors'
  | 'fixed_assets'
  | 'creditors'
  | 'owner_loan'
  | 'owner_capital'
  | 'retained_earnings'
  | 'owner_drawings'
  | 'sales'
  | 'other_income'
  | 'cogs'
  | 'purchases'
  | 'rent'
  | 'wages'
  | 'utilities'
  | 'transport'
  | 'momo_charges'
  | 'bank_charges'
  | 'packaging'
  | 'miscellaneous';

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export type NotificationType =
  | 'low_stock'
  | 'debt_overdue'
  | 'stock_count_due'
  | 'creditor_due'
  | 'monthly_summary_ready';
