import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/server/db/supabase';

/**
 * Limpa conexões antigas de Sandbox/teste do banco, mantendo apenas a conexão real do MeuPluggy.
 * Devido ao ON DELETE CASCADE na tabela accounts, todas as contas e investimentos fictícios
 * do Sandbox são removidos atomicamente.
 */
export async function POST() {
  try {
    const supabaseUser = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    // Buscar conexões de teste do usuário
    const { data: sandboxConns } = await admin
      .from('financial_connections')
      .select('id, institution_name, external_item_id')
      .eq('user_id', user.id)
      .neq('institution_name', 'MeuPluggy');

    const deletedIds: string[] = [];

    if (sandboxConns && sandboxConns.length > 0) {
      for (const conn of sandboxConns) {
        // Se a conexão não for MeuPluggy, remove do banco (CASCADE limpa accounts, transactions, investments)
        await admin.from('financial_connections').delete().eq('id', conn.id);
        deletedIds.push(conn.id);
      }
    }

    return NextResponse.json({
      success: true,
      cleanedCount: deletedIds.length,
      deletedConnections: deletedIds,
      message: 'Conexões antigas do Sandbox removidas com sucesso.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao limpar dados de teste' },
      { status: 500 }
    );
  }
}
