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

    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    const result = await syncItemData(itemId, userId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Manual sync error:', err);
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
