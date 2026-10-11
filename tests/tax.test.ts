import { describe, it, expect } from 'vitest';
import { classifyFiscalSafety, estimateAnnualTax } from '../src/domain/tax/engine';
import { TAX_CONFIG_2026, TAX_DISCLAIMER } from '../src/domain/tax/config-2026';

describe('Personal Fiscal Organization (SPEC 005 & TAX requirements)', () => {
  it('TAX-001 & TAX-002: Unknown incoming money is classified as REVIEW, not TAXABLE_INCOME', () => {
    const treatment = classifyFiscalSafety(2000, 'INCOME', false);
    expect(treatment).toBe('REVIEW');
  });

  it('TAX-001: Own transfer has NO_TAX_EFFECT', () => {
    const treatment = classifyFiscalSafety(-500, 'TRANSFER', false);
    expect(treatment).toBe('NO_TAX_EFFECT');
  });

  it('TAX-001: Explicit verified owner rule applies (e.g. Pró-labore)', () => {
    const treatment = classifyFiscalSafety(5000, 'INCOME', true, 'TAXABLE_INCOME');
    expect(treatment).toBe('TAXABLE_INCOME');
  });

  it('TAX-004 & TAX-005: 2026 annual estimator applies zero tax for income up to 33.000,00', () => {
    const result = estimateAnnualTax({ taxableIncome: 30000 }, TAX_CONFIG_2026);
    expect(result.taxDue).toBe(0);
    expect(result.reduction).toBeGreaterThan(0);
    expect(result.disclaimer).toBe(TAX_DISCLAIMER);
  });

  it('TAX-005: 2026 annual estimator applies reduction cap (2694.15) for 55.000,00', () => {
    const result = estimateAnnualTax({ taxableIncome: 55000 }, TAX_CONFIG_2026);
    expect(result.reduction).toBe(2694.15);
    expect(result.taxDue).toBe(1575);
  });

  it('TAX-005: 2026 annual estimator applies progressive table above 88.200,00', () => {
    const result = estimateAnnualTax({ taxableIncome: 100000, withheldOrPaid: 12000 }, TAX_CONFIG_2026);
    expect(result.baseTax).toBeGreaterThan(0);
    expect(result.reduction).toBe(0);
    expect(result.taxDue).toBe(result.baseTax);
    expect(result.taxReserveTarget).toBe(Math.max(0, result.taxDue - 12000));
  });
});
