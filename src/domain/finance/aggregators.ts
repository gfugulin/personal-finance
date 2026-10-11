import { AccountType, TransactionNature, TaxTreatment } from './types';
import { calculateFreeMoney, calculateNetWorth, calculateSavingsRate } from './engine';
import { estimateAnnualTax } from '../tax/engine';

export interface AccountRecord {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  is_active: boolean;
  credit_limit?: number | null;
  available_credit_limit?: number | null;
  invoice_due_date?: string | null;
  invoice_close_date?: string | null;
}

export interface InvestmentRecord {
  id: string;
  name?: string | null;
  current_value: number;
  contributed_value?: number | null;
  type?: string | null;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  nature: TransactionNature;
  tax_treatment: TaxTreatment;
  transaction_date: string;
  description?: string;
  merchant_name?: string | null;
  account_id?: string;
  category_id?: string | null;
  reviewed?: boolean;
}

/**
 * Agrega métricas para a tela "Hoje" (Dashboard)
 */
export function aggregateHojeData(
  accounts: AccountRecord[],
  transactions: TransactionRecord[],
  reserveFloor: number = 0
) {
  const activeAccounts = accounts.filter((a) => a.is_active);

  // 1. Saldo em contas bancárias
  const bankCash = activeAccounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // 2. Passivo de fatura de cartão (valor absoluto do saldo usado)
  const cardLiability = activeAccounts
    .filter((a) => a.type === 'CREDIT')
    .reduce((sum, a) => sum + Math.abs(Number(a.balance) || 0), 0);

  // 3. Dinheiro Livre (FIN-006)
  const freeMoney = calculateFreeMoney({
    cash: bankCash,
    cardLiability,
    futureExpenses: 0,
    futureInvestments: 0,
    reserveFloor,
  });

  // 4. Fluxo operacional do mês corrente
  let monthIncome = 0;
  let monthSpending = 0;
  let monthInvested = 0;
  let pendingReviewsCount = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;

    if (tx.nature === 'INCOME') {
      monthIncome += Math.abs(amt);
    } else if (tx.nature === 'EXPENSE') {
      monthSpending += Math.abs(amt);
    } else if (tx.nature === 'INVESTMENT') {
      monthInvested += Math.abs(amt);
    }

    if (tx.tax_treatment === 'REVIEW' || tx.nature === 'UNKNOWN') {
      pendingReviewsCount++;
    }
  }

  // 5. Taxa de poupança (FIN-008)
  const savingsRate = calculateSavingsRate(monthIncome, monthSpending) ?? 0;

  return {
    freeMoney,
    bankCash,
    cardLiability,
    monthIncome,
    monthSpending,
    monthInvested,
    savingsRate,
    pendingReviewsCount,
  };
}

/**
 * Agrega métricas para a tela "Patrimônio"
 */
export function aggregatePatrimonioData(
  accounts: AccountRecord[],
  investments: InvestmentRecord[],
  transactions: TransactionRecord[]
) {
  const activeAccounts = accounts.filter((a) => a.is_active);

  const cash = activeAccounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const cardLiability = activeAccounts
    .filter((a) => a.type === 'CREDIT')
    .reduce((sum, a) => sum + Math.abs(Number(a.balance) || 0), 0);

  const investmentsTotal = investments.reduce(
    (sum, inv) => sum + (Number(inv.current_value) || 0),
    0
  );

  // FIN-007: Net worth = cash + investments - card liability
  const netWorth = calculateNetWorth({
    cash,
    investments: investmentsTotal,
    cardLiability,
  });

  // Aportes somados das transações de investimento
  const contributionsThisMonth = transactions
    .filter((t) => t.nature === 'INVESTMENT')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

  return {
    cash,
    investments: investmentsTotal,
    cardLiability,
    netWorth,
    contributionsThisMonth,
  };
}

/**
 * Agrega métricas fiscais para a tela "IR"
 */
export function aggregateIRData(transactions: TransactionRecord[], taxYear: number) {
  let taxableIncome = 0;
  let exemptIncome = 0;
  let exclusiveIncome = 0;
  let deductions = 0;
  let taxWithheld = 0;
  let pendingReviewsCount = 0;

  for (const tx of transactions) {
    const amt = Math.abs(Number(tx.amount) || 0);

    switch (tx.tax_treatment) {
      case 'TAXABLE_INCOME':
        taxableIncome += amt;
        break;
      case 'EXEMPT_NON_TAXABLE':
        exemptIncome += amt;
        break;
      case 'EXCLUSIVE_DEFINITIVE':
        exclusiveIncome += amt;
        break;
      case 'DEDUCTIBLE_EXPENSE':
        deductions += amt;
        break;
      case 'TAX_WITHHELD':
        taxWithheld += amt;
        break;
      case 'REVIEW':
        pendingReviewsCount++;
        break;
      default:
        break;
    }
  }

  const estimate = estimateAnnualTax({
    taxableIncome,
    deductions,
    withheldOrPaid: taxWithheld,
  });

  return {
    taxableIncome,
    exemptIncome,
    exclusiveIncome,
    deductions,
    taxWithheld,
    pendingReviewsCount,
    estimate,
  };
}
