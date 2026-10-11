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
  provider_category?: string | null;
  reviewed?: boolean;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface RecurringSubscriptionItem {
  name: string;
  amount: number;
  frequency: 'MONTHLY';
  lastDate: string;
  category: string;
}

/**
 * Heurística de categorização automática baseada em palavras-chave e provider_category
 */
export function inferCategoryName(description?: string, providerCategory?: string | null): string {
  const desc = (description || '').toLowerCase();
  const prov = (providerCategory || '').toLowerCase();

  if (
    desc.includes('posto') ||
    desc.includes('combustivel') ||
    desc.includes('gasolina') ||
    desc.includes('etanol') ||
    desc.includes('shell') ||
    desc.includes('ipiranga') ||
    desc.includes('graal') ||
    prov.includes('combustivel')
  ) {
    return 'Transporte / Combustível';
  }

  if (
    desc.includes('uber') ||
    desc.includes('99app') ||
    desc.includes('99pop') ||
    desc.includes('cabify') ||
    desc.includes('taxi') ||
    prov.includes('transporte')
  ) {
    return 'Transporte / Mobilidade';
  }

  if (
    desc.includes('mercado') ||
    desc.includes('supermercado') ||
    desc.includes('carrefour') ||
    desc.includes('pao de acucar') ||
    desc.includes('assai') ||
    desc.includes('atacadista') ||
    desc.includes('hortifruti') ||
    desc.includes('extra') ||
    prov.includes('mercado') ||
    prov.includes('supermercado')
  ) {
    return 'Alimentação / Supermercado';
  }

  if (
    desc.includes('ifood') ||
    desc.includes('rappi') ||
    desc.includes('restaurante') ||
    desc.includes('mcdonald') ||
    desc.includes('burger king') ||
    desc.includes('padaria') ||
    desc.includes('lanchonete') ||
    prov.includes('refeicao') ||
    prov.includes('restaurante')
  ) {
    return 'Alimentação / Refeições';
  }

  if (
    desc.includes('netflix') ||
    desc.includes('spotify') ||
    desc.includes('amazon prime') ||
    desc.includes('prime video') ||
    desc.includes('disney') ||
    desc.includes('hbo') ||
    desc.includes('youtube') ||
    desc.includes('apple') ||
    prov.includes('streaming') ||
    prov.includes('assinatura')
  ) {
    return 'Serviços / Assinaturas';
  }

  if (
    desc.includes('farmacia') ||
    desc.includes('drogaria') ||
    desc.includes('drogasil') ||
    desc.includes('raia') ||
    prov.includes('saude') ||
    prov.includes('farmacia')
  ) {
    return 'Saúde / Farmácia';
  }

  if (providerCategory && providerCategory.trim().length > 0) {
    return providerCategory.trim();
  }

  return 'Outros Gastos';
}

/**
 * Heurística para detecção de despesas recorrentes / assinaturas
 */
export function detectRecurringExpenses(transactions: TransactionRecord[]): RecurringSubscriptionItem[] {
  const expenseTxs = transactions.filter((t) => t.nature === 'EXPENSE');

  // Ignorar compras parceladas (ex: 3/12, 6/6, parcela 1 de 10)
  const isInstallment = (name: string) => {
    return /\d+\s*[\/|\\]\s*\d+/.test(name) || /parcela\s*\d+/i.test(name) || /\b\d+\s+de\s+\d+\b/i.test(name);
  };

  // Ignorar transferências Pix, TED, DOC ou transações financeiras genéricas
  const isTransferOrPix = (name: string) => {
    return /\bpix\b/i.test(name) || /transfer[eê]ncia/i.test(name) || /\bted\b/i.test(name) || /\bdoc\b/i.test(name);
  };

  // Normaliza o nome para agrupar ocorrências e deduplicar serviços conhecidos
  const normalizeRoot = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return 'netflix';
    if (lower.includes('spotify')) return 'spotify';
    if (lower.includes('prime') || lower.includes('amazon video')) return 'amazon prime';
    if (lower.includes('disney')) return 'disney+';
    if (lower.includes('youtube')) return 'youtube premium';
    if (lower.includes('99freelas')) return '99freelas';

    return lower
      .replace(/\.com(\.br)?/g, '')
      .replace(/[\d\-_\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const groups = new Map<string, TransactionRecord[]>();

  for (const tx of expenseTxs) {
    const rawName = tx.merchant_name || tx.description || 'Despesa';
    if (isInstallment(rawName) || isTransferOrPix(rawName)) {
      continue;
    }

    const key = normalizeRoot(rawName);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  }

  const subscriptions: RecurringSubscriptionItem[] = [];

  for (const [key, txs] of Array.from(groups.entries())) {
    if (txs.length < 2) continue;

    // Verificar se ocorrem em meses distintos
    const months = new Set(txs.map((t) => t.transaction_date.slice(0, 7))); // YYYY-MM
    if (months.size < 2) continue;

    // Verificar variação dos valores
    const amounts = txs.map((t) => Math.abs(Number(t.amount) || 0));
    const minAmt = Math.min(...amounts);
    const maxAmt = Math.max(...amounts);

    // Se a variação de valor for menor que 10% ou R$ 5, consideramos assinatura/custo fixo
    if (minAmt > 0 && (maxAmt - minAmt) / minAmt <= 0.1) {
      // Ordena por data decrescente para pegar a última ocorrência e nome mais recente
      txs.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      const latestTx = txs[0];

      let displayName = latestTx.merchant_name || latestTx.description || key;
      if (key === 'netflix') displayName = 'Netflix';
      else if (key === 'spotify') displayName = 'Spotify';
      else if (key === 'amazon prime') displayName = 'Amazon Prime';
      else if (key === '99freelas') displayName = '99Freelas';

      subscriptions.push({
        name: displayName,
        amount: Math.abs(Number(latestTx.amount) || 0),
        frequency: 'MONTHLY',
        lastDate: latestTx.transaction_date,
        category: inferCategoryName(latestTx.description, latestTx.provider_category),
      });
    }
  }

  return subscriptions.sort((a, b) => b.amount - a.amount);
}

/**
 * Obtém todos os meses YYYY-MM disponíveis ordenados do mais recente ao mais antigo
 */
export function getAvailableMonths(transactions: TransactionRecord[]): string[] {
  const months = new Set<string>();
  for (const tx of transactions) {
    if (tx.transaction_date && tx.transaction_date.length >= 7) {
      months.add(tx.transaction_date.slice(0, 7));
    }
  }
  const sorted = Array.from(months).sort().reverse();
  return sorted.length > 0 ? sorted : [new Date().toISOString().slice(0, 7)];
}

/**
 * Agrega métricas para a tela "Hoje" (Dashboard)
 */
export function aggregateHojeData(
  accounts: AccountRecord[],
  transactions: TransactionRecord[],
  reserveFloor: number = 0,
  targetMonth?: string
) {
  const activeAccounts = accounts.filter((a) => a.is_active);

  // 1. Saldo em contas bancárias
  const bankCash = activeAccounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // 2. Passivo de fatura de cartão (FIN-006):
  // Se o banco informar credit_limit e available_credit_limit:
  // a dívida real em aberto é (credit_limit - available_credit_limit).
  // Se available_credit_limit >= credit_limit, o cartão não possui dívida pendente (fatura paga).
  const cardLiability = activeAccounts
    .filter((a) => a.type === 'CREDIT')
    .reduce((sum, a) => {
      if (
        typeof a.credit_limit === 'number' &&
        typeof a.available_credit_limit === 'number' &&
        a.credit_limit > 0
      ) {
        return sum + Math.max(0, a.credit_limit - a.available_credit_limit);
      }
      return sum + Math.abs(Number(a.balance) || 0);
    }, 0);

  // 3. Dinheiro Livre (FIN-006)
  const freeMoney = calculateFreeMoney({
    cash: bankCash,
    cardLiability,
    futureExpenses: 0,
    futureInvestments: 0,
    reserveFloor,
  });

  // 4. Determinação do mês de corte
  const availableMonths = getAvailableMonths(transactions);
  const selectedMonth = targetMonth || availableMonths[0] || new Date().toISOString().slice(0, 7);

  // 5. Fluxo operacional filtrado estritamente para o mês selecionado
  let monthIncome = 0;
  let monthSpending = 0;
  let monthInvested = 0;
  let pendingReviewsCount = 0;

  const categoryTotals = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const isThisMonth = tx.transaction_date && tx.transaction_date.startsWith(selectedMonth);

    if (isThisMonth) {
      const amt = Number(tx.amount) || 0;
      const absAmt = Math.abs(amt);

      if (tx.nature === 'INCOME') {
        monthIncome += absAmt;
      } else if (tx.nature === 'EXPENSE') {
        monthSpending += absAmt;

        // Agrupa na categoria
        const cat = inferCategoryName(tx.description, tx.provider_category);
        const currentCat = categoryTotals.get(cat) || { total: 0, count: 0 };
        categoryTotals.set(cat, {
          total: currentCat.total + absAmt,
          count: currentCat.count + 1,
        });
      } else if (tx.nature === 'INVESTMENT') {
        monthInvested += absAmt;
      }
    }

    if (tx.tax_treatment === 'REVIEW' || tx.nature === 'UNKNOWN') {
      pendingReviewsCount++;
    }
  }

  // 6. Taxa de poupança (FIN-008)
  const savingsRate = calculateSavingsRate(monthIncome, monthSpending) ?? 0;

  // 7. Category breakdown do mês selecionado
  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(categoryTotals.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: monthSpending > 0 ? (data.total / monthSpending) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 8. Despesas Recorrentes / Assinaturas (Heurística Automática)
  const recurringSubscriptions = detectRecurringExpenses(transactions);
  const totalFixedMonthly = recurringSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  return {
    freeMoney,
    bankCash,
    cardLiability,
    monthIncome,
    monthSpending,
    monthInvested,
    savingsRate,
    pendingReviewsCount,
    categoryBreakdown,
    recurringSubscriptions,
    totalFixedMonthly,
    selectedMonth,
    availableMonths,
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

  // Rendimento / Lucro dos investimentos
  let investmentsProfit = 0;
  let totalInvestedCost = 0;

  for (const inv of investments) {
    const current = Number(inv.current_value) || 0;
    const contributed =
      inv.contributed_value !== null && inv.contributed_value !== undefined
        ? Number(inv.contributed_value)
        : null;

    if (contributed !== null && contributed > 0) {
      investmentsProfit += current - contributed;
      totalInvestedCost += contributed;
    }
  }

  const investmentsYieldRate = totalInvestedCost > 0 ? investmentsProfit / totalInvestedCost : 0;

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
    investmentsProfit,
    investmentsYieldRate,
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
