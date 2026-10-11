import { NextRequest, NextResponse } from 'next/server';
import { processPluggyWebhook } from '@/server/integrations/pluggy/webhook';

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'pluggy-webhook' }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');

    const secretHeader =
      req.headers.get('x-finance-webhook-secret') ||
      req.headers.get('x-webhook-secret') ||
      req.headers.get('authorization') ||
      querySecret;

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      // Handshake or empty ping payload
      return NextResponse.json({ received: true, note: 'empty ping' }, { status: 200 });
    }

    // Handshake or verification test from Pluggy dashboard
    if (!payload?.event || payload?.event === 'test' || payload?.event === 'ping') {
      return NextResponse.json({ received: true, test: true }, { status: 200 });
    }

    const result = await processPluggyWebhook(payload, secretHeader);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message === 'Invalid webhook secret') {
      // In development or if Pluggy test ping doesn't forward headers, log and return informative error
      console.warn('Webhook secret mismatch:', err.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Webhook processing error:', err);
    // Respond 200 to prevent webhook deactivation if non-fatal
    return NextResponse.json({ received: true, warning: err.message }, { status: 200 });
  }
}
