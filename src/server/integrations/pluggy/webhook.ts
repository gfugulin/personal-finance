import { getPluggyClient } from './client';
import { createAdminSupabaseClient } from '@/server/db/supabase';

export interface PluggyWebhookPayload {
  event: string;
  eventId?: string;
  id?: string; // some webhook events pass id
  itemId?: string;
  data?: any;
  error?: any;
}

export async function processPluggyWebhook(
  payload: PluggyWebhookPayload,
  receivedSecret?: string | null
): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  // 1. Verify Secret
  const expectedSecret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (expectedSecret && receivedSecret !== expectedSecret) {
    throw new Error('Invalid webhook secret');
  }

  const eventId = payload.eventId || payload.id;
  const eventType = payload.event;
  const itemId = payload.itemId || payload.data?.itemId;

  const supabase = createAdminSupabaseClient();

  // 2. Check Idempotency by eventId if provided
  if (eventId) {
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      return { success: true, message: 'Event already processed', duplicate: true };
    }

    // Record receipt
    await supabase.from('processed_webhook_events').insert({
      event_id: eventId,
      event_type: eventType || 'unknown',
      status: 'PROCESSING',
    });
  }

  // 3. Process events
  try {
    const pluggy = getPluggyClient();

    switch (eventType) {
      case 'item/created':
      case 'item/updated': {
        if (itemId) {
          const item = await pluggy.fetchItem(itemId);
          await supabase
            .from('financial_connections')
            .update({
              status: item.status === 'UPDATED' ? 'ACTIVE' : (item.status as any),
              last_sync_at: new Date().toISOString(),
              last_successful_sync_at: item.status === 'UPDATED' ? new Date().toISOString() : undefined,
              last_error_code: item.error ? JSON.stringify(item.error.code) : null,
              updated_at: new Date().toISOString(),
            })
            .eq('external_item_id', itemId);
        }
        break;
      }

      case 'item/error': {
        if (itemId) {
          await supabase
            .from('financial_connections')
            .update({
              status: 'ERROR',
              last_error_code: payload.error ? JSON.stringify(payload.error) : 'UNKNOWN_ERROR',
              updated_at: new Date().toISOString(),
            })
            .eq('external_item_id', itemId);
        }
        break;
      }

      default:
        // Transactions and other events
        break;
    }

    if (eventId) {
      await supabase
        .from('processed_webhook_events')
        .update({
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);
    }

    return { success: true, message: 'Webhook processed successfully' };
  } catch (err: any) {
    if (eventId) {
      await supabase
        .from('processed_webhook_events')
        .update({
          status: 'ERROR',
          error_code: err.message,
        })
        .eq('event_id', eventId);
    }
    throw err;
  }
}
