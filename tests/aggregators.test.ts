import { describe, it, expect } from 'vitest';
import {
  aggregateHojeData,
  aggregatePatrimonioData,
  aggregateIRData,
  detectRecurringExpenses,
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

  it('calculates category breakdown and recurring subscriptions correctly', () => {
    const expenseTxs = [
      {
        id: 'tx-gas-1',
        description: 'Auto Posto Shell Ipiranga',
        amount: -250,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-02T10:00:00Z',
        provider_category: 'Transporte',
      },
      {
        id: 'tx-gas-2',
        description: 'Posto Graal Combustiveis',
        amount: -150,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-15T15:00:00Z',
      },
      {
        id: 'tx-net-sep',
        description: 'Netflix.com',
        amount: -55.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-10T08:00:00Z',
      },
      {
        id: 'tx-net-oct',
        description: 'Netflix.com',
        amount: -55.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-10T08:00:00Z',
      },
      {
        id: 'tx-spot-sep',
        description: 'Spotify Premium',
        amount: -34.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-05T08:00:00Z',
      },
      {
        id: 'tx-spot-oct',
        description: 'Spotify Premium',
        amount: -34.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-05T08:00:00Z',
      },
    ];

    const hoje = aggregateHojeData(accounts, expenseTxs, 0);

    // 1. Category breakdown deve agrupar os gastos de combustível
    expect(hoje.categoryBreakdown.length).toBeGreaterThan(0);
    const gasCategory = hoje.categoryBreakdown.find((c) =>
      c.category.toLowerCase().includes('combustível') || c.category.toLowerCase().includes('transporte')
    );
    expect(gasCategory).toBeDefined();
    expect(gasCategory?.total).toBe(400); // 250 + 150

    // 2. Subscriptions detectadas (Netflix e Spotify cobrados em meses distintos com mesmo valor)
    expect(hoje.recurringSubscriptions.length).toBe(2);
    expect(hoje.totalFixedMonthly).toBeCloseTo(55.9 + 34.9, 2);
  });

  it('calculates investment yield / profit correctly in Patrimonio', () => {
    const investmentsWithYield = [
      {
        id: 'inv-1',
        name: 'Tesouro Selic 2029',
        current_value: 30000,
        contributed_value: 28000,
      },
      {
        id: 'inv-2',
        name: 'CDB 110% CDI',
        current_value: 12500,
        contributed_value: 12000,
      },
    ];

    const pat = aggregatePatrimonioData(accounts, investmentsWithYield, transactions);

    expect(pat.investmentsProfit).toBe(2500); // (30000 - 28000) + (12500 - 12000)
    expect(pat.investmentsYieldRate).toBeCloseTo(2500 / 40000, 3); // 2500 / 40000 = 6.25%
  });

  it('filters month metrics strictly by targetMonth and ignores other months', () => {
    const multiMonthTxs = [
      {
        id: 'tx-sep',
        amount: -500,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-15T12:00:00Z',
      },
      {
        id: 'tx-oct-income',
        amount: 8000,
        nature: 'INCOME' as const,
        tax_treatment: 'TAXABLE_INCOME' as const,
        transaction_date: '2026-10-05T12:00:00Z',
      },
      {
        id: 'tx-oct-expense',
        amount: -1200,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-10T12:00:00Z',
      },
    ];

    // Se passar targetMonth: '2026-10', a despesa de setembro (500) NÃO deve entrar
    const hojeOct = aggregateHojeData(accounts, multiMonthTxs, 0, '2026-10');
    expect(hojeOct.monthIncome).toBe(8000);
    expect(hojeOct.monthSpending).toBe(1200);
    expect(hojeOct.selectedMonth).toBe('2026-10');

    // Se passar targetMonth: '2026-09'
    const hojeSep = aggregateHojeData(accounts, multiMonthTxs, 0, '2026-09');
    expect(hojeSep.monthIncome).toBe(0);
    expect(hojeSep.monthSpending).toBe(500);
    expect(hojeSep.selectedMonth).toBe('2026-09');
  });

  it('ignores installments (e.g. 3/12, 6/6), Pix, and deduplicates subscription variants', () => {
    const noisyTxs = [
      // Parcela de curso (NÃO é assinatura)
      {
        id: 'tx-p1',
        description: 'Vindi *Finclass 3/12',
        amount: -69.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-10T10:00:00Z',
      },
      {
        id: 'tx-p2',
        description: 'Vindi *Finclass 4/12',
        amount: -69.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-10T10:00:00Z',
      },
      // Parcela de aluguel de carro (NÃO é assinatura)
      {
        id: 'tx-car-1',
        description: 'Foco Aluguel de Carros 5/6',
        amount: -216.89,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-02T10:00:00Z',
      },
      {
        id: 'tx-car-2',
        description: 'Foco Aluguel de Carros 6/6',
        amount: -216.89,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-02T10:00:00Z',
      },
      // Pix avulso (NÃO é assinatura)
      {
        id: 'tx-pix-1',
        description: 'Transferência enviada pelo Pix M4 LTDA',
        amount: -30,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-14T10:00:00Z',
      },
      {
        id: 'tx-pix-2',
        description: 'Transferência enviada pelo Pix M4 LTDA',
        amount: -30,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-14T10:00:00Z',
      },
      // Assinatura real: Netflix (com duas descrições ligeiramente diferentes)
      {
        id: 'tx-net-1',
        description: 'Netflix.com',
        amount: -20.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-09-15T10:00:00Z',
      },
      {
        id: 'tx-net-2',
        description: 'Netflix Entretenimento',
        amount: -20.9,
        nature: 'EXPENSE' as const,
        tax_treatment: 'NO_TAX_EFFECT' as const,
        transaction_date: '2026-10-15T10:00:00Z',
      },
    ];

    const subs = detectRecurringExpenses(noisyTxs);
    // Deve conter APENAS 1 assinatura (Netflix deduplicada), sem parcelas 3/12, 6/6 ou Pix!
    expect(subs.length).toBe(1);
    expect(subs[0].name.toLowerCase()).toContain('netflix');
    expect(subs[0].amount).toBe(20.9);
  });

  it('calculates zero card liability when available credit limit equals total credit limit (paid bill)', () => {
    const paidCardAccounts = [
      {
        id: 'acc-card-paid',
        name: 'Nubank Mastercard Black',
        type: 'CREDIT' as const,
        balance: -1500, // Saldo antigo em cache
        credit_limit: 10000,
        available_credit_limit: 10000, // Limite 100% restabelecido (fatura paga)
        is_active: true,
      },
    ];

    const hoje = aggregateHojeData(paidCardAccounts, [], 0);
    // Como o limite disponível é igual ao limite total, o passivo do cartão é 0, NÃO 1500!
    expect(hoje.cardLiability).toBe(0);
  });
});

