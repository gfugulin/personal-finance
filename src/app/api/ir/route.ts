import { NextRequest, NextResponse } from 'next/server';
import { fetchUserTaxSummary } from '@/server/db/dashboard';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : 2026;

    const summary = await fetchUserTaxSummary(year);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Falha ao buscar resumo de IR' },
      { status: 500 }
    );
  }
}
