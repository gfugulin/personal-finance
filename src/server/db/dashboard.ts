import { createServerSupabaseClient } from './supabase';
import {
  aggregateHojeData,
  aggregatePatrimonioData,
  aggregateIRData,
  AccountRecord,
  InvestmentRecord,
  TransactionRecord,
} from '@/domain/finance/aggregators';
import { TransactionNature, TaxTreatment } from '@/domain/finance/types';

export async function fetchUserFinancialSummary() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // 1. Fetch Accounts
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, name, type, balance, is_active, credit_limit, available_credit_limit, invoice_due_date, invoice_close_date')
    .eq('user_id', user.id);

  const accounts: AccountRecord[] = (accountsData || []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: Number(a.balance) || 0,
    is_active: a.is_active,
    credit_limit: a.credit_limit ? Number(a.credit_limit) : null,
    available_credit_limit: a.available_credit_limit ? Number(a.available_credit_limit) : null,
    invoice_due_date: a.invoice_due_date,
    invoice_close_date: a.invoice_close_date,
  }));

  // 2. Fetch Investments
  const { data: investmentsData } = await supabase
    .from('investments')
    .select('id, name, current_value, contributed_value, type')
    .eq('user_id', user.id);

  const investments: InvestmentRecord[] = (investmentsData || []).map((inv) => ({
    id: inv.id,
    name: inv.name,
    current_value: Number(inv.current_value) || 0,
    contributed_value: inv.contributed_value ? Number(inv.contributed_value) : null,
    type: inv.type,
  }));

  // 3. Fetch Transactions
  const { data: transactionsData } = await supabase
    .from('transactions')
    .select('id, amount, nature, tax_treatment, transaction_date, description, merchant_name, account_id, category_id')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false });

  const transactions: TransactionRecord[] = (transactionsData || []).map((t) => ({
    id: t.id,
    amount: Number(t.amount) || 0,
    nature: t.nature,
    tax_treatment: t.tax_treatment,
    transaction_date: t.transaction_date,
    description: t.description,
    merchant_name: t.merchant_name,
    account_id: t.account_id,
    category_id: t.category_id,
  }));

  // 4. Fetch Profile (para reserve_floor)
  const { data: profile } = await supabase
    .from('profiles')
    .select('reserve_floor, monthly_investment_target')
    .eq('id', user.id)
    .maybeSingle();

  const reserveFloor = profile?.reserve_floor ? Number(profile.reserve_floor) : 0;

  // 5. Fetch Conexão mais recente para last_sync_at e status
  const { data: latestConn } = await supabase
    .from('financial_connections')
    .select('last_sync_at, last_successful_sync_at, status, institution_name, external_item_id')
    .eq('user_id', user.id)
    .order('last_sync_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Aggregate view models
  const hoje = aggregateHojeData(accounts, transactions, reserveFloor);
  const patrimonio = aggregatePatrimonioData(accounts, investments, transactions);

  return {
    user,
    accounts,
    investments,
    transactions,
    hoje,
    patrimonio,
    lastSyncAt: latestConn?.last_sync_at || null,
    lastSuccessfulSyncAt: latestConn?.last_successful_sync_at || null,
    connectionStatus: latestConn?.status || null,
    institutionName: latestConn?.institution_name || null,
    itemId: latestConn?.external_item_id || null,
  };
}

export async function fetchUserTransactions() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, external_transaction_id, description, merchant_name, amount, currency_code, transaction_date, status, nature, tax_treatment, accounts(name, type)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`Erro ao carregar movimentações: ${error.message}`);
  }

  return (txs || []).map((t: any) => ({
    id: t.id,
    description: t.description,
    merchantName: t.merchant_name,
    amount: Number(t.amount) || 0,
    currencyCode: t.currency_code,
    date: t.transaction_date,
    nature: t.nature as TransactionNature,
    taxTreatment: t.tax_treatment as TaxTreatment,
    accountName: t.accounts?.name || 'Conta Bancária',
    accountType: t.accounts?.type,
    reviewed: t.tax_treatment !== 'REVIEW' && t.nature !== 'UNKNOWN',
  }));
}

export async function updateUserTransactionClassification(
  txId: string,
  updates: { nature?: TransactionNature; taxTreatment?: TaxTreatment }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      nature: updates.nature,
      tax_treatment: updates.taxTreatment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', txId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar transação: ${error.message}`);
  }

  return data;
}

export async function fetchUserTaxSummary(taxYear: number = 2026) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: txs } = await supabase
    .from('transactions')
    .select('id, amount, nature, tax_treatment, transaction_date')
    .eq('user_id', user.id)
    .eq('tax_year', taxYear);

  const transactions: TransactionRecord[] = (txs || []).map((t) => ({
    id: t.id,
    amount: Number(t.amount) || 0,
    nature: t.nature,
    tax_treatment: t.tax_treatment,
    transaction_date: t.transaction_date,
  }));

  return aggregateIRData(transactions, taxYear);
}
