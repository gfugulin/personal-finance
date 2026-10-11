import { NextResponse } from 'next/server';
import { fetchUserFinancialSummary } from '@/server/db/dashboard';

export async function GET() {
  try {
    const summary = await fetchUserFinancialSummary();
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao buscar patrimônio' },
      { status: 500 }
    );
  }
}
