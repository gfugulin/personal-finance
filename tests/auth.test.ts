import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as connectTokenRoute } from '../src/app/api/connect-token/route';
import { NextRequest } from 'next/server';
import { isOwnerEmail } from '../src/server/auth/owner';

// Mocks
const mockGetUser = vi.fn();
const mockGetAal = vi.fn();
const mockCreateConnectToken = vi.fn().mockResolvedValue({ accessToken: 'mock-connect-token-xyz' });

vi.mock('../src/server/db/supabase', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      mfa: {
        getAuthenticatorAssuranceLevel: mockGetAal,
      },
    },
  }),
}));

vi.mock('../src/server/integrations/pluggy/client', () => ({
  getPluggyClient: () => ({
    createConnectToken: mockCreateConnectToken,
  }),
}));

describe('Auth Gate & AAL2 Enforcement (SEC-001, BANK-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_OWNER_EMAIL = 'owner@example.com';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://personal-finance-beta-silk.vercel.app';
  });

  it('sem sessão -> /api/connect-token retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not logged in' } });

    const req = new NextRequest('https://personal-finance-beta-silk.vercel.app/api/connect-token', {
      method: 'POST',
    });

    const res = await connectTokenRoute(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain('Unauthorized');
  });

  it('usuário diferente do APP_OWNER_EMAIL -> retorna 403 Forbidden', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-b', email: 'stranger@example.com' } },
      error: null,
    });

    const req = new NextRequest('https://personal-finance-beta-silk.vercel.app/api/connect-token', {
      method: 'POST',
    });

    const res = await connectTokenRoute(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('restricted to owner');
    expect(isOwnerEmail('stranger@example.com')).toBe(false);
  });

  it('sessão AAL1 (sem verificação TOTP) -> retorna 403', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'owner-id', email: 'owner@example.com' } },
      error: null,
    });
    mockGetAal.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });

    const req = new NextRequest('https://personal-finance-beta-silk.vercel.app/api/connect-token', {
      method: 'POST',
    });

    const res = await connectTokenRoute(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('AAL2');
  });

  it('sessão AAL2 do proprietário -> gera Connect Token com sucesso', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'owner-id', email: 'owner@example.com' } },
      error: null,
    });
    mockGetAal.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const req = new NextRequest('https://personal-finance-beta-silk.vercel.app/api/connect-token', {
      method: 'POST',
    });

    const res = await connectTokenRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accessToken).toBe('mock-connect-token-xyz');
    expect(mockCreateConnectToken).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        clientUserId: 'owner-id',
        avoidDuplicates: true,
        oauthRedirectUri: 'https://personal-finance-beta-silk.vercel.app/conectar/retorno',
      })
    );
  });

  it('isOwnerEmail valida o email configurado em APP_OWNER_EMAIL', () => {
    expect(isOwnerEmail('owner@example.com')).toBe(true);
    expect(isOwnerEmail('OWNER@EXAMPLE.COM')).toBe(true);
    expect(isOwnerEmail('other@example.com')).toBe(false);
  });
});
