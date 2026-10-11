import { NextRequest, NextResponse } from 'next/server';
import { getPluggyClient } from '@/server/integrations/pluggy/client';
import { createServerSupabaseClient } from '@/server/db/supabase';
import { isOwnerEmail } from '@/server/auth/owner';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // 1. Authenticated user required
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    // 2. Owner restriction
    if (!isOwnerEmail(user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: access restricted to owner' },
        { status: 403 }
      );
    }

    // 3. Strict AAL2 verification
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel !== 'aal2') {
      return NextResponse.json(
        { error: 'AAL2 (TOTP MFA) is required to access Open Finance connections' },
        { status: 403 }
      );
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
      clientUserId: user.id,
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
