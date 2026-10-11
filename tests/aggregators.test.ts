import { describe, it, expect } from 'vitest';
import {
  aggregateHojeData,
  aggregatePatrimonioData,
  aggregateIRData,
} from '../src/domain/finance/aggregators';

describe('Financial Aggregators (M3, M4 & M5 View Models)', () => {
  const accounts = [
    {
      id: 'acc-1',
      name: 'Nubank Conta',
      type: 'BANK' as const,
      balance: 5000,
      is_active: true,
    },
    {
      id: 'acc-2',
      name: 'Nubank Cartão',
      type: 'CREDIT' as const,
      balance: 1500, // invoice liability
      is_active: true,
    },
  ];

  const investments = [
    {
      id: 'inv-1',
      name: 'Tesouro Selic 2029',
      current_value: 30000,
      contributed_value: 28000,
    },
  ];

  const transactions = [
    {
      id: 'tx-1',
      amount: 8000,
      nature: 'INCOME' as const,
      tax_treatment: 'TAXABLE_INCOME' as const,
      transaction_date: '2026-10-05T10:00:00Z',
    },
    {
      id: 'tx-2',
      amount: -2500,
      nature: 'EXPENSE' as const,
      tax_treatment: 'NO_TAX_EFFECT' as const,
      transaction_date: '2026-10-06T14:30:00Z',
    },
    {
      id: 'tx-3',
      amount: -1500,
      nature: 'INVESTMENT' as const,
      tax_treatment: 'ASSET_MOVEMENT' as const,
      transaction_date: '2026-10-07T12:00:00Z',
    },
    {
      id: 'tx-4',
      amount: -1500,
      nature: 'CARD_PAYMENT' as const,
      tax_treatment: 'NO_TAX_EFFECT' as const,
      transaction_date: '2026-10-08T09:00:00Z',
    },
    {
      id: 'tx-5',
      amount: 1000,
      nature: 'INCOME' as const,
      tax_treatment: 'REVIEW' as const,
      transaction_date: '2026-10-09T18:00:00Z',
    },
  ];

  it('aggregates Hoje view model correctly', () => {
    const hoje = aggregateHojeData(accounts, transactions, 0);

    expect(hoje.bankCash).toBe(5000);
    expect(hoje.cardLiability).toBe(1500);
    expect(hoje.freeMoney).toBe(3500); // 5000 - 1500
    expect(hoje.monthIncome).toBe(9000); // 8000 + 1000
    expect(hoje.monthSpending).toBe(2500); // invoice payment not counted as spending!
    expect(hoje.monthInvested).toBe(1500);
    expect(hoje.pendingReviewsCount).toBe(1); // tx-5 has REVIEW
  });

  it('aggregates Patrimonio view model correctly', () => {
    const pat = aggregatePatrimonioData(accounts, investments, transactions);

    expect(pat.cash).toBe(5000);
    expect(pat.investments).toBe(30000);
    expect(pat.cardLiability).toBe(1500);
    expect(pat.netWorth).toBe(33500); // 5000 + 30000 - 1500
    expect(pat.contributionsThisMonth).toBe(1500);
  });

  it('aggregates IR view model correctly for 2026', () => {
    const ir = aggregateIRData(transactions, 2026);

    expect(ir.taxableIncome).toBe(8000);
    expect(ir.exemptIncome).toBe(0);
    expect(ir.pendingReviewsCount).toBe(1);
    expect(ir.estimate.taxDue).toBe(0); // Under exemption threshold
  });
});
