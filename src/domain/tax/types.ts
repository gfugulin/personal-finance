export type FiscalTreatment =
  | 'TAXABLE_INCOME'
  | 'EXEMPT_NON_TAXABLE'
  | 'EXCLUSIVE_DEFINITIVE'
  | 'DEDUCTIBLE_EXPENSE'
  | 'TAX_WITHHELD'
  | 'ASSET_MOVEMENT'
  | 'NO_TAX_EFFECT'
  | 'REVIEW';

export interface TaxBracket {
  upTo: number | null;
  rate: number;
  deduction: number;
}

export interface ReductionFormula {
  constant: number;
  coefficient: number;
}

export interface TaxRuleSet {
  source: string;
  calendarYear: number;
  monthly: {
    brackets: TaxBracket[];
    dependentDeduction: number;
    simplifiedDeductionLimit: number;
    fullReductionIncomeMax: number;
    fullReductionCap: number;
    partialReductionIncomeMax: number;
    partialReductionFormula: ReductionFormula;
  };
  annual: {
    brackets: TaxBracket[];
    dependentDeduction: number;
    educationExpenseLimit: number;
    simplifiedDeductionLimit: number;
    fullReductionIncomeMax: number;
    fullReductionCap: number;
    partialReductionIncomeMax: number;
    partialReductionFormula: ReductionFormula;
  };
}

export interface TaxEstimateInput {
  taxableIncome: number;
  deductions?: number;
  withheldOrPaid?: number;
  dependentsCount?: number;
}

export interface TaxEstimateResult {
  taxableIncome: number;
  baseTax: number;
  reduction: number;
  taxDue: number;
  withheldOrPaid: number;
  taxReserveTarget: number;
  disclaimer: string;
}
