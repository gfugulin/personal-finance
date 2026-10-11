import { getPluggyClient } from './client';
import { createAdminSupabaseClient } from '@/server/db/supabase';
import { classifyFiscalSafety } from '@/domain/tax/engine';
import { TransactionNature, AccountType } from '@/domain/finance/types';

export function inferFinancialNature(
  desc: string,
  amount: number,
  accountType: AccountType
): TransactionNature {
  const lower = (desc || '').toLowerCase();

  // 1. Detecção de Pagamento de Fatura em conta bancária (BANK)
  if (
    lower.includes('pagamento de fatura') ||
    lower.includes('pagamento fatura') ||
    lower.includes('pgto fatura') ||
    lower.includes('fatura nubank') ||
    lower.includes('fatura cartao') ||
    lower.includes('fatura cartão')
  ) {
    return 'CARD_PAYMENT';
  }

  // 2. Detecção de Transferência entre contas próprias
  if (
    lower.includes('transferência entre contas') ||
    lower.includes('mesma titularidade') ||
    lower.includes('transf mesma')
  ) {
    return 'TRANSFER';
  }

  // 3. Aporte em investimento
  if (
    lower.includes('aplicação') ||
    lower.includes('aplicacao') ||
    lower.includes('investimento') ||
    lower.includes('tesouro direto') ||
    lower.includes('cdb')
  ) {
    return 'INVESTMENT';
  }

  // 4. Semântica oficial da Pluggy para Cartão de Crédito (CREDIT):
  //    amount > 0: Compra no cartão (EXPENSE)
  //    amount < 0: Pagamento de fatura, estorno ou crédito (CARD_PAYMENT ou REFUND)
  if (accountType === 'CREDIT') {
    if (amount > 0) {
      return 'EXPENSE';
    }
    if (amount < 0) {
      if (lower.includes('estorno') || lower.includes('reembolso')) {
        return 'REFUND';
      }
      return 'CARD_PAYMENT';
    }
  }

  // 5. Conta bancária (BANK):
  //    amount > 0: entrada (INCOME)
  //    amount < 0: saída (EXPENSE)
  if (amount > 0) return 'INCOME';
  if (amount < 0) return 'EXPENSE';

  return 'UNKNOWN';
}

export async function syncItemData(itemId: string, defaultUserId?: string) {
  const pluggy = getPluggyClient();
  const supabase = createAdminSupabaseClient();

  // 1. Fetch Item from Pluggy
  const item = await pluggy.fetchItem(itemId);

  // Determine real user_id from arguments, item or Supabase users
  let userId = defaultUserId;

  if (!userId && item.clientUserId) {
    userId = item.clientUserId;
  }

  if (!userId) {
    const { data: existingConn } = await supabase
      .from('financial_connections')
      .select('user_id')
      .eq('external_item_id', itemId)
      .maybeSingle();

    if (existingConn?.user_id) {
      userId = existingConn.user_id;
    }
  }

  if (!userId) {
    const { data: firstProfile } = await supabase.from('profiles').select('id').maybeSingle();
    if (firstProfile?.id) {
      userId = firstProfile.id;
    }
  }

  if (!userId) {
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      if (usersData?.users && usersData.users.length > 0) {
        userId = usersData.users[0].id;
      }
    } catch {
      // ignore
    }
  }

  if (!userId) {
    throw new Error('Não foi possível identificar o usuário proprietário no Supabase para vincular a conexão.');
  }

  // Mapear status da conexão conforme lifecycle da Pluggy
  const institutionName = item.connector?.name || 'Pluggy Bank (Sandbox)';
  const statusMap: Record<string, string> = {
    UPDATED: 'ACTIVE',
    UPDATING: 'SYNCING',
    WAITING_USER_INPUT: 'REAUTH_REQUIRED',
    LOGIN_ERROR: 'ERROR',
    OUTDATED: 'REAUTH_REQUIRED',
  };
  const connStatus = statusMap[item.status] || (item.status === 'UPDATED' ? 'ACTIVE' : 'SYNCING');

  const isUpdated = item.status === 'UPDATED';

  // Upsert financial_connections
  const { data: connectionRecord, error: connErr } = await supabase
    .from('financial_connections')
    .upsert(
      {
        user_id: userId,
        provider: 'PLUGGY',
        institution_name: institutionName,
        external_item_id: itemId,
        connector_id: item.connector?.id?.toString() || null,
        status: connStatus,
        last_sync_at: new Date().toISOString(),
        last_successful_sync_at: isUpdated ? new Date().toISOString() : undefined,
        last_error_code: item.error ? JSON.stringify(item.error.code) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider,external_item_id' }
    )
    .select('id')
    .single();

  if (connErr || !connectionRecord) {
    throw new Error(`Falha ao persistir financial_connections: ${connErr?.message}`);
  }

  const connectionId = connectionRecord.id;

  // Se o item ainda estiver em coleta (UPDATING), registrar conexão e retornar 202
  if (item.status === 'UPDATING') {
    return {
      status: 'SYNC_REQUESTED',
      itemStatus: 'UPDATING',
      message: 'Item em processo de coleta pela instituição financeira.',
      connectionId,
    };
  }

  // 2. Fetch Accounts
  const accountsResponse = await pluggy.fetchAccounts(itemId);
  const accounts = accountsResponse.results || [];

  for (const acc of accounts) {
    const accType: AccountType = acc.type === 'CREDIT' ? 'CREDIT' : 'BANK';
    const balance = typeof acc.balance === 'number' ? acc.balance : 0;
    const creditData = (acc as any).creditData;

    const { data: dbAccount } = await supabase
      .from('accounts')
      .upsert(
        {
          user_id: userId,
          connection_id: connectionId,
          external_account_id: acc.id,
          type: accType,
          subtype: acc.subtype || null,
          name: acc.name || 'Conta ' + (acc.number || ''),
          currency_code: acc.currencyCode || 'BRL',
          balance: balance,
          credit_limit: creditData?.creditLimit ?? null,
          available_credit_limit: creditData?.availableCreditLimit ?? null,
          invoice_due_date: creditData?.balanceDueDate ? new Date(creditData.balanceDueDate) : null,
          invoice_close_date: creditData?.balanceCloseDate ? new Date(creditData.balanceCloseDate) : null,
          is_active: true,
          reference_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'connection_id,external_account_id' }
      )
      .select('id')
      .single();

    if (!dbAccount) continue;

    // 3. Paginação completa de transações com pageSize=500 até totalPages (Seção 6.2 do Runbook)
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const txResponse = await pluggy.fetchTransactions(acc.id, {
        page,
        pageSize: 500,
      });

      const transactions = txResponse.results || [];
      if (transactions.length === 0) break;

      for (const tx of transactions) {
        const txAmount = tx.amount;
        const nature = inferFinancialNature(tx.description, txAmount, accType);
        const taxTreatment = classifyFiscalSafety(txAmount, nature, false);

        await supabase.from('transactions').upsert(
          {
            user_id: userId,
            account_id: dbAccount.id,
            external_transaction_id: tx.id,
            description: tx.description || 'Transação',
            merchant_name: tx.merchant?.name || null,
            amount: txAmount,
            currency_code: tx.currencyCode || 'BRL',
            transaction_date: tx.date || new Date().toISOString(),
            status: tx.status === 'PENDING' ? 'PENDING' : 'POSTED',
            nature,
            tax_treatment: taxTreatment,
            payment_method: tx.paymentData?.paymentMethod || null,
            provider_category: tx.category || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'account_id,external_transaction_id' }
        );
      }

      const totalPages = txResponse.totalPages || 1;
      if (page >= totalPages) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  // 4. Fetch Investments quando disponíveis
  try {
    const invResponse = await pluggy.fetchInvestments(itemId);
    const investments = invResponse.results || [];

    for (const inv of investments) {
      await supabase.from('investments').upsert(
        {
          user_id: userId,
          connection_id: connectionId,
          external_investment_id: inv.id,
          name: inv.name,
          ticker: (inv as any).code || null,
          type: inv.type,
          subtype: inv.subtype || null,
          quantity: (inv as any).quantity ?? null,
          unit_value: (inv as any).unitPrice ?? null,
          current_value: inv.balance ?? (inv as any).amount ?? 0,
          contributed_value: (inv as any).amountOriginal ?? null,
          currency_code: inv.currencyCode || 'BRL',
          reference_date: (inv as any).date ? new Date((inv as any).date).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'connection_id,external_investment_id' }
      );
    }
  } catch (invErr) {
    console.warn('Investimentos não suportados ou vazios para este conector:', invErr);
  }

  return {
    status: 'SYNCED',
    itemStatus: item.status,
    accountsCount: accounts.length,
    connectionId,
  };
}

export async function handleTransactionEvent(
  eventType: 'transactions/created' | 'transactions/updated' | 'transactions/deleted',
  payload: any
) {
  const supabase = createAdminSupabaseClient();
  const transactionId = payload.data?.id || payload.id;
  const transactionIds: string[] = payload.data?.transactionIds || (transactionId ? [transactionId] : []);

  // 1. transactions/deleted: Soft delete marcando status DELETED (Runbook seção 7.3)
  if (eventType === 'transactions/deleted') {
    for (const id of transactionIds) {
      await supabase
        .from('transactions')
        .update({
          status: 'DELETED',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('external_transaction_id', id);
    }
    return { success: true, deleted: transactionIds.length };
  }

  // 2. transactions/created: usar createdTransactionsLink ou buscar transações
  const itemId = payload.itemId || payload.data?.itemId;
  if (itemId) {
    return await syncItemData(itemId);
  }

  // 3. Atualizar transações específicas
  if (transactionIds.length > 0) {
    const pluggy = getPluggyClient();
    for (const id of transactionIds) {
      try {
        const tx = await pluggy.fetchTransaction(id);
        if (tx && tx.accountId) {
          const { data: dbAccount } = await supabase
            .from('accounts')
            .select('id, user_id, type')
            .eq('external_account_id', tx.accountId)
            .maybeSingle();

          if (dbAccount) {
            const nature = inferFinancialNature(tx.description, tx.amount, dbAccount.type);
            const taxTreatment = classifyFiscalSafety(tx.amount, nature, false);

            await supabase.from('transactions').upsert(
              {
                user_id: dbAccount.user_id,
                account_id: dbAccount.id,
                external_transaction_id: tx.id,
                description: tx.description || 'Transação',
                amount: tx.amount,
                currency_code: tx.currencyCode || 'BRL',
                transaction_date: tx.date || new Date().toISOString(),
                status: tx.status === 'PENDING' ? 'PENDING' : 'POSTED',
                nature,
                tax_treatment: taxTreatment,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'account_id,external_transaction_id' }
            );
          }
        }
      } catch (singleErr) {
        console.warn('Falha ao buscar transação individual:', id, singleErr);
      }
    }
  }

  return { success: true };
}
