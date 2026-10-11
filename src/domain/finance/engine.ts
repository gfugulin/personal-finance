import { BaseTransaction, FreeMoneyInput, NetWorthInput } from './types';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateMonthlySummary(transactions: BaseTransaction[]): {
  income: number;
  spending: number;
  invested: number;
} {
  let income = 0;
  let spending = 0;
  let invested = 0;

  for (const tx of transactions) {
    const absAmount = Math.abs(tx.amount);

    switch (tx.nature) {
      case 'INCOME':
        income += absAmount;
        break;
      case 'EXPENSE':
        spending += absAmount;
        break;
      case 'REFUND':
        spending -= absAmount;
        break;
      case 'INVESTMENT':
        invested += absAmount;
        break;
      case 'CARD_PAYMENT':
      case 'TRANSFER':
      case 'IGNORE':
      case 'UNKNOWN':
      default:
        // By invariant: CARD_PAYMENT and TRANSFER do not affect income or spending
        break;
    }
  }

  return {
    income: round2(income),
    spending: round2(spending),
    invested: round2(invested),
  };
}

export function calculateFreeMoney(input: FreeMoneyInput): number {
  const futureInvestments = input.futureInvestments ?? 0;
  const freeMoney =
    input.cash -
    input.cardLiability -
    input.futureExpenses -
    futureInvestments -
    input.reserveFloor;

  return round2(freeMoney);
}

export function calculateNetWorth(input: NetWorthInput): number {
  const netWorth = input.cash + input.investments - input.cardLiability;
  return round2(netWorth);
}

export function calculateSavingsRate(income: number, spending: number): number | null {
  if (income <= 0) return null;
  return round2((income - spending) / income);
}

export function calculateInvestmentRate(income: number, invested: number): number | null {
  if (income <= 0) return null;
  return round2(invested / income);
}
