import { NextRequest, NextResponse } from 'next/server';
import { processPluggyWebhook } from '@/server/integrations/pluggy/webhook';

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'pluggy-webhook' }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');

    // Strict header validation: prioritize X-Finance-Webhook-Secret
    const secretHeader =
      req.headers.get('x-finance-webhook-secret') ||
      req.headers.get('authorization') ||
      querySecret;

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      // Empty ping or health check
      return NextResponse.json({ received: true, note: 'empty ping' }, { status: 200 });
    }

    // Isolated treatment for test ping
    if (!payload?.event || payload?.event === 'test' || payload?.event === 'ping') {
      return NextResponse.json({ received: true, test: true }, { status: 200 });
    }

    const result = await processPluggyWebhook(payload, secretHeader);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message === 'Invalid webhook secret') {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}
