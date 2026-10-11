import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPluggyWebhook } from '../src/server/integrations/pluggy/webhook';

// Mock Supabase admin client
const mockExistingRecord: any = null;
const mockFrom = vi.fn();

vi.mock('../src/server/db/supabase', () => ({
  createAdminSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock('../src/server/integrations/pluggy/client', () => ({
  getPluggyClient: () => ({
    fetchItem: vi.fn().mockResolvedValue({ status: 'UPDATED', connector: { name: 'Pluggy Bank' } }),
    fetchAccounts: vi.fn().mockResolvedValue({ results: [] }),
    fetchInvestments: vi.fn().mockResolvedValue({ results: [] }),
  }),
}));

describe('Security & Webhook Idempotency (SPEC 002, 005, SEC)', () => {
  beforeEach(() => {
    process.env.PLUGGY_WEBHOOK_SECRET = 'correct_secret_xyz';
  });

  it('rejects webhook with missing or invalid secret header', async () => {
    await expect(
      processPluggyWebhook({ event: 'item/created' }, 'wrong_secret')
    ).rejects.toThrow('Invalid webhook secret');
  });

  it('accepts webhook with matching secret', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'owner-uuid-1' } }),
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ data: null }),
      }),
      upsert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'conn-1' }, error: null }),
        }),
      }),
    });

    const result = await processPluggyWebhook(
      { event: 'item/created', eventId: 'evt-test-1', itemId: 'item-1' },
      'correct_secret_xyz'
    );
    expect(result.success).toBe(true);
  });

  it('returns idempotent acknowledgement if eventId has already been processed', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { event_id: 'evt-test-1' } }),
        }),
      }),
    });

    const result = await processPluggyWebhook(
      { event: 'item/created', eventId: 'evt-test-1', itemId: 'item-1' },
      'correct_secret_xyz'
    );
    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
  });
});
