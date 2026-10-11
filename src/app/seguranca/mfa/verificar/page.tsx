'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/server/db/client';
import { ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

export default function VerificarMfaPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFactor() {
      try {
        setLoadingFactors(true);
        const { data, error: factorsErr } = await supabase.auth.mfa.listFactors();

        if (factorsErr) {
          setError(factorsErr.message);
          return;
        }

        const totpFactor = data?.totp?.find((f) => f.status === 'verified') || data?.totp?.[0];
        if (totpFactor) {
          setFactorId(totpFactor.id);
        } else {
          // Se não encontrou fator cadastrado, manda configurar
          router.push('/seguranca/mfa/configurar');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao consultar autenticação de dois fatores.');
      } finally {
        setLoadingFactors(false);
      }
    }

    loadFactor();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length !== 6) {
      setError('Insira o código de 6 dígitos.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // 1. Criar challenge
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr) {
        setError(challengeErr.message);
        setVerifying(false);
        return;
      }

      // 2. Verificar código
      const { data: verifyData, error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyErr) {
        setError('Código inválido ou expirado. Tente novamente.');
        setVerifying(false);
        return;
      }

      // 3. Sucesso! Sessão agora é AAL2
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar código MFA.');
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loadingFactors) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400">Verificando segurança da conta...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 animate-fadeIn">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-white">Verificação em Duas Etapas</h1>
          <p className="text-xs text-slate-400">
            Abra seu app autenticador e digite o código de 6 dígitos atual para liberar o acesso.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Código TOTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-widest text-xl font-mono bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <span>Confirmar e Acessar</span>
            )}
          </button>
        </form>

        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-300 text-center"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
