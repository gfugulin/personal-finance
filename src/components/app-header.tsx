'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/server/db/client';
import { LogOut, ShieldCheck } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Não renderizar em rotas públicas ou de auth/mfa
  if (pathname === '/login' || pathname.startsWith('/seguranca')) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="w-full flex items-center justify-between pb-3 pt-1 border-b border-slate-900/80 mb-2">
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Sessão AAL2 Segura</span>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors"
        title="Encerrar sessão"
      >
        <span>Sair</span>
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </header>
  );
}
