import { describe, it, expect } from 'vitest';
import {
  calculateMonthlySummary,
  calculateFreeMoney,
  calculateNetWorth,
  calculateSavingsRate,
  calculateInvestmentRate,
} from '../src/domain/finance/engine';
import financeCases from '../fixtures/finance-cases.json';

describe('Financial Accounting Semantics (SPEC 003 & FIN requirements)', () => {
  it('FIN-001: Credit card invoice does not double count spending', () => {
    const { transactions, expectedMonthlySpending } = financeCases.card_double_count;
    const summary = calculateMonthlySummary(transactions as any);
    expect(summary.spending).toBe(expectedMonthlySpending);
  });

  it('FIN-002: Own transfer does not become income or spending', () => {
    const transactions = [
      { amount: -1000, nature: 'TRANSFER' as const, accountType: 'BANK' as const },
      { amount: 1000, nature: 'TRANSFER' as const, accountType: 'BANK' as const },
    ];
    const summary = calculateMonthlySummary(transactions);
    expect(summary.income).toBe(0);
    expect(summary.spending).toBe(0);
  });

  it('FIN-003: Investment contribution is not lifestyle spending', () => {
    const transactions = [
      { amount: -500, nature: 'INVESTMENT' as const, accountType: 'BANK' as const },
    ];
    const summary = calculateMonthlySummary(transactions);
    expect(summary.spending).toBe(0);
    expect(summary.invested).toBe(500);
  });

  it('FIN-006: Free money calculation can be negative and matches fixture', () => {
    const result = calculateFreeMoney(financeCases.free_money_negative);
    expect(result).toBe(financeCases.free_money_negative.expectedFreeMoney);
  });

  it('FIN-007: Net worth calculates cash + investments - card liability', () => {
    const result = calculateNetWorth(financeCases.net_worth);
    expect(result).toBe(financeCases.net_worth.expectedNetWorth);
  });

  it('FIN-008 & FIN-009: Savings and Investment rates handle income <= 0 and positive', () => {
    expect(calculateSavingsRate(0, 100)).toBeNull();
    expect(calculateInvestmentRate(0, 50)).toBeNull();

    expect(calculateSavingsRate(10000, 4000)).toBe(0.6);
    expect(calculateInvestmentRate(10000, 3000)).toBe(0.3);
  });
});
