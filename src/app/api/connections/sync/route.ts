import { NextRequest, NextResponse } from 'next/server';
import { syncItemData } from '@/server/integrations/pluggy/sync';
import { createServerSupabaseClient } from '@/server/db/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const itemId = body.itemId;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    const result = await syncItemData(itemId, user?.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Manual sync error details:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Sync failed',
        details: err?.stack || err?.toString(),
      },
      { status: 500 }
    );
  }
}
