import { NextResponse } from 'next/server';
import { getPluggyClient } from '@/server/integrations/pluggy/client';
import { createServerSupabaseClient } from '@/server/db/supabase';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure AAL level is AAL2 (or allow during local dev if MFA not yet enforced in dev mode)
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (process.env.NODE_ENV === 'production' && aalData?.currentLevel !== 'aal2') {
      return NextResponse.json(
        { error: 'AAL2 (TOTP MFA) is required to access Open Finance connections' },
        { status: 403 }
      );
    }

    const pluggy = getPluggyClient();
    const connectToken = await pluggy.createConnectToken(undefined, {
      clientUserId: user.id,
    });

    return NextResponse.json({ accessToken: connectToken.accessToken });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Pluggy Connect token' },
      { status: 500 }
    );
  }
}
