import { NextRequest, NextResponse } from 'next/server';
import { getPluggyClient } from '@/server/integrations/pluggy/client';
import { createServerSupabaseClient } from '@/server/db/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // In production, strictly require Supabase authenticated user
    let clientUserId = user?.id;
    if (!clientUserId) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
      }
      // Development fallback id for local sandbox testing
      clientUserId = '00000000-0000-0000-0000-000000000001';
    }

    // AAL2 check in production if MFA enforced
    if (process.env.NODE_ENV === 'production' && user) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel !== 'aal2') {
        return NextResponse.json(
          { error: 'AAL2 (TOTP MFA) is required to access Open Finance connections' },
          { status: 403 }
        );
      }
    }

    let itemId: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body?.itemId) itemId = body.itemId;
    } catch {
      // Body is optional
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://personal-finance-beta-silk.vercel.app'
    ).replace(/\/$/, '');
    const oauthRedirectUri = `${siteUrl}/conectar/retorno`;

    const pluggy = getPluggyClient();
    const connectToken = await pluggy.createConnectToken(itemId, {
      clientUserId,
      avoidDuplicates: true,
      oauthRedirectUri,
    });

    return NextResponse.json({ accessToken: connectToken.accessToken });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Pluggy Connect token' },
      { status: 500 }
    );
  }
}
