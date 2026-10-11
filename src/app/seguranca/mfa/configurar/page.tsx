'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/server/db/client';
import { QrCode, ShieldCheck, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

export default function ConfigurarMfaPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function startEnroll() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Personal Finance Authenticator',
        });

        if (enrollErr) {
          setError(enrollErr.message);
          setLoading(false);
          return;
        }

        if (data) {
          setFactorId(data.id);
          setQrCodeUrl(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err: any) {
        setError(err.message || 'Falha ao iniciar configuração de MFA');
      } finally {
        setLoading(false);
      }
    }

    startEnroll();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || verifyCode.trim().length !== 6) {
      setError('Insira o código de 6 dígitos.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode.trim(),
      });

      if (verifyErr) {
        setError(verifyErr.message || 'Código incorreto. Tente novamente.');
        setVerifying(false);
        return;
      }

      // Sucesso! Sessão elevada para AAL2
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código TOTP.');
      setVerifying(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400">Gerando chave de segurança TOTP...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 animate-fadeIn">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-white">Configurar Autenticação (MFA)</h1>
          <p className="text-xs text-slate-400">
            Escaneie o QR Code no seu aplicativo autenticador (Google Authenticator, Authy ou 1Password).
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* QR Code Container */}
        {qrCodeUrl && (
          <div className="flex flex-col items-center p-4 bg-white rounded-2xl mx-auto shadow-inner">
            <img src={qrCodeUrl} alt="QR Code TOTP" className="w-48 h-48 object-contain" />
          </div>
        )}

        {/* Chave manual */}
        {secret && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex flex-col truncate pr-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Chave Manual</span>
              <span className="font-mono text-slate-200 select-all truncate">{secret}</span>
            </div>
            <button
              onClick={copySecret}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Copiar chave"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Formulário de Confirmação */}
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Código de 6 dígitos gerado
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-widest text-lg font-mono bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || verifyCode.length !== 6}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <span>Ativar MFA e Entrar</span>
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
