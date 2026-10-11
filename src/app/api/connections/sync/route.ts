import { NextRequest, NextResponse } from 'next/server';
import { syncItemData } from '@/server/integrations/pluggy/sync';
import { createServerSupabaseClient } from '@/server/db/supabase';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const itemId = body.itemId;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required', requestId }, { status: 400 });
    }

    console.info(`[Sync][${requestId}] Starting sync for itemId: ${itemId}, user: ${user?.id || 'none'}`);
    const result = await syncItemData(itemId, user?.id);

    const httpStatus = result.status === 'SYNC_REQUESTED' ? 202 : 200;
    return NextResponse.json({ ...result, requestId }, { status: httpStatus });
  } catch (err: any) {
    console.error(`[Sync][${requestId}] Error during sync:`, err);
    return NextResponse.json(
      {
        error: err?.message || 'Sync failed',
        details: err?.stack || err?.toString(),
        requestId,
      },
      { status: 500 }
    );
  }
}
