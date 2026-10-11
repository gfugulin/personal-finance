import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTransactionEvent } from '../src/server/integrations/pluggy/sync';

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null }) });
const mockUpsert = vi.fn().mockResolvedValue({ data: null });
const mockFrom = vi.fn();

vi.mock('../src/server/db/supabase', () => ({
  createAdminSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock('../src/server/integrations/pluggy/client', () => ({
  getPluggyClient: () => ({
    fetchTransaction: vi.fn().mockResolvedValue({
      id: 'tx-123',
      accountId: 'acc-1',
      description: 'Compra Mercado',
      amount: -150,
      currencyCode: 'BRL',
      date: '2026-10-10T12:00:00Z',
      status: 'POSTED',
    }),
  }),
}));

describe('Pluggy Sync Engine (SPEC 002 & sync.feature)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks transaction as DELETED on transactions/deleted without destroying history', async () => {
    mockFrom.mockReturnValue({
      update: mockUpdate,
    });

    const result = await handleTransactionEvent('transactions/deleted', {
      id: 'tx-123',
    });

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('transactions');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DELETED',
      })
    );
  });

  it('upserts authoritative transaction data on transactions/created or updated', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'accounts') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'acc-uuid-1', user_id: 'user-1', type: 'BANK' },
              }),
            }),
          }),
        };
      }
      if (table === 'transactions') {
        return {
          upsert: mockUpsert,
        };
      }
      return {};
    });

    const result = await handleTransactionEvent('transactions/created', {
      id: 'tx-123',
    });

    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        external_transaction_id: 'tx-123',
        amount: -150,
        status: 'POSTED',
      }),
      { onConflict: 'account_id,external_transaction_id' }
    );
  });
});
