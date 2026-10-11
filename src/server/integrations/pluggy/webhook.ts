import { createAdminSupabaseClient } from '@/server/db/supabase';
import { syncItemData, handleTransactionEvent } from './sync';

export interface PluggyWebhookPayload {
  event: string;
  eventId?: string;
  id?: string;
  itemId?: string;
  data?: any;
  error?: any;
}

export async function processPluggyWebhook(
  payload: PluggyWebhookPayload,
  receivedSecret?: string | null
): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  const eventType = payload.event;
  const isTestOrPing = eventType === 'test' || eventType === 'ping' || !eventType;

  // 1. Mandatory Webhook Secret Verification (SEC-005)
  const expectedSecret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (expectedSecret && !isTestOrPing) {
    if (!receivedSecret || receivedSecret !== expectedSecret) {
      throw new Error('Invalid webhook secret');
    }
  }

  // Quick return for pure test pings
  if (isTestOrPing) {
    return { success: true, message: 'Ping acknowledged' };
  }

  const eventId = payload.eventId || payload.id;
  const itemId = payload.itemId || payload.data?.itemId;

  const supabase = createAdminSupabaseClient();

  // 2. Check Idempotency by eventId in public.processed_webhook_events
  if (eventId) {
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      return { success: true, message: 'Event already processed', duplicate: true };
    }

    // Record initial receipt
    await supabase.from('processed_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      status: 'PROCESSING',
    });
  }

  // 3. Authoritative sync and reconciliation
  try {
    switch (eventType) {
      case 'item/created':
      case 'item/updated': {
        if (itemId) {
          await syncItemData(itemId);
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

      case 'transactions/created':
      case 'transactions/updated':
      case 'transactions/deleted': {
        await handleTransactionEvent(eventType, payload);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
        break;
    }

    // Mark event as processed
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
