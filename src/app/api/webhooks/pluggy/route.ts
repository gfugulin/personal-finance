import { NextRequest, NextResponse } from 'next/server';
import { processPluggyWebhook } from '@/server/integrations/pluggy/webhook';

export async function POST(req: NextRequest) {
  try {
    const secretHeader =
      req.headers.get('x-finance-webhook-secret') ||
      req.headers.get('x-webhook-secret') ||
      req.headers.get('authorization');

    const payload = await req.json();

    const result = await processPluggyWebhook(payload, secretHeader);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message === 'Invalid webhook secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
