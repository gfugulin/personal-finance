export type AccountType = 'BANK' | 'CREDIT';

export type TransactionNature =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'CARD_PAYMENT'
  | 'INVESTMENT'
  | 'REFUND'
  | 'IGNORE'
  | 'UNKNOWN';

export type TaxTreatment =
  | 'TAXABLE_INCOME'
  | 'EXEMPT_NON_TAXABLE'
  | 'EXCLUSIVE_DEFINITIVE'
  | 'DEDUCTIBLE_EXPENSE'
  | 'TAX_WITHHELD'
  | 'ASSET_MOVEMENT'
  | 'NO_TAX_EFFECT'
  | 'REVIEW';

export interface BaseTransaction {
  id?: string;
  amount: number; // positive for inflow, negative for outflow (or standard decimal)
  nature: TransactionNature;
  taxTreatment?: TaxTreatment;
  accountType?: AccountType;
  date?: string | Date;
}

export interface FreeMoneyInput {
  cash: number;
  cardLiability: number;
  futureExpenses: number;
  futureInvestments?: number;
  reserveFloor: number;
}

export interface NetWorthInput {
  cash: number;
  investments: number;
  cardLiability: number;
}
