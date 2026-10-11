import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isOwnerEmail } from '@/server/auth/owner';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rotas públicas que não devem ser interceptadas
  if (
    pathname.startsWith('/api/webhooks/pluggy') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Se não estiver autenticado
  if (!user) {
    if (pathname === '/login') {
      return response;
    }
    // Redireciona para /login qualquer tentativa de acessar telas protegidas
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado: verificar se é o proprietário (APP_OWNER_EMAIL)
  if (!isOwnerEmail(user.email)) {
    await supabase.auth.signOut();
    const unauthorizedUrl = new URL('/login?error=unauthorized_owner', request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Verificar nível de autenticação MFA (AAL2)
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const isAal2 = aalData?.currentLevel === 'aal2';
  const hasMfaConfigured = aalData?.nextLevel === 'aal2';

  if (!isAal2) {
    if (hasMfaConfigured) {
      // Já possui TOTP configurado mas precisa validar o código nesta sessão
      if (pathname !== '/seguranca/mfa/verificar') {
        return NextResponse.redirect(new URL('/seguranca/mfa/verificar', request.url));
      }
      return response;
    } else {
      // Ainda não configurou o TOTP
      if (pathname !== '/seguranca/mfa/configurar') {
        return NextResponse.redirect(new URL('/seguranca/mfa/configurar', request.url));
      }
      return response;
    }
  }

  // Se já está AAL2 e tentou acessar login ou telas de MFA, manda para /
  if (
    pathname === '/login' ||
    pathname === '/seguranca/mfa/configurar' ||
    pathname === '/seguranca/mfa/verificar'
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
