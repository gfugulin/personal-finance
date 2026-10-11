import { NextRequest, NextResponse } from 'next/server';
import { fetchUserTransactions, updateUserTransactionClassification } from '@/server/db/dashboard';

export async function GET() {
  try {
    const transactions = await fetchUserTransactions();
    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao buscar movimentações' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nature, taxTreatment } = body;

    if (!id) {
      return NextResponse.json({ error: 'id da transação é obrigatório' }, { status: 400 });
    }

    const updated = await updateUserTransactionClassification(id, {
      nature,
      taxTreatment,
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao atualizar movimentação' },
      { status: 500 }
    );
  }
}
