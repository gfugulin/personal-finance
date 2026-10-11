import { FiscalTreatment, TaxEstimateInput, TaxEstimateResult, TaxRuleSet } from './types';
import { TAX_CONFIG_2026, TAX_DISCLAIMER } from './config-2026';
import { TransactionNature } from '../finance/types';

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function classifyFiscalSafety(
  amount: number,
  nature: TransactionNature,
  hasExplicitRule: boolean = false,
  explicitFiscalTreatment?: FiscalTreatment
): FiscalTreatment {
  // Rule: Own transfer has NO_TAX_EFFECT
  if (nature === 'TRANSFER' || nature === 'CARD_PAYMENT') {
    return 'NO_TAX_EFFECT';
  }

  // If owner defined an explicit rule, apply it
  if (hasExplicitRule && explicitFiscalTreatment) {
    return explicitFiscalTreatment;
  }

  // Incoming money without owner rule MUST be REVIEW, never TAXABLE_INCOME automatically
  if (amount > 0 || nature === 'INCOME') {
    return 'REVIEW';
  }

  return 'REVIEW';
}

export function estimateAnnualTax(
  input: TaxEstimateInput,
  ruleSet: TaxRuleSet = TAX_CONFIG_2026
): TaxEstimateResult {
  const taxableIncome = Math.max(0, input.taxableIncome);
  const deductions = Math.max(0, input.deductions ?? 0);
  const dependentsCount = Math.max(0, input.dependentsCount ?? 0);
  const dependentsDeduction = dependentsCount * ruleSet.annual.dependentDeduction;
  const withheldOrPaid = Math.max(0, input.withheldOrPaid ?? 0);

  // Calculate net calculation base
  const calculationBase = Math.max(0, taxableIncome - deductions - dependentsDeduction);

  // Progressive bracket lookup
  let baseTax = 0;
  for (const bracket of ruleSet.annual.brackets) {
    if (bracket.upTo === null || calculationBase <= bracket.upTo) {
      baseTax = Math.max(0, calculationBase * bracket.rate - bracket.deduction);
      break;
    }
  }

  // Annual reduction calculation (2026 specific rules)
  let reduction = 0;
  if (taxableIncome <= ruleSet.annual.fullReductionIncomeMax) {
    reduction = Math.min(baseTax, ruleSet.annual.fullReductionCap);
  } else if (taxableIncome <= ruleSet.annual.partialReductionIncomeMax) {
    const calculatedReduction =
      ruleSet.annual.partialReductionFormula.constant -
      ruleSet.annual.partialReductionFormula.coefficient * taxableIncome;
    reduction = Math.max(0, Math.min(baseTax, calculatedReduction));
  } else {
    reduction = 0;
  }

  const taxDue = round2(Math.max(0, baseTax - reduction));
  const taxReserveTarget = round2(Math.max(0, taxDue - withheldOrPaid));

  return {
    taxableIncome: round2(taxableIncome),
    baseTax: round2(baseTax),
    reduction: round2(reduction),
    taxDue,
    withheldOrPaid: round2(withheldOrPaid),
    taxReserveTarget,
    disclaimer: TAX_DISCLAIMER,
  };
}
