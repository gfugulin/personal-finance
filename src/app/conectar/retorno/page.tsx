'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ConectarRetornoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando retorno da conexão bancária...');

  const itemId = searchParams.get('itemId');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setMessage(`Erro retornado pelo banco ou Open Finance: ${error}`);
      return;
    }

    if (itemId) {
      // Notify backend to register and initiate immediate sync for this item
      fetch('/api/connections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.warn('Sync trigger warning:', data);
          }
          setStatus('success');
          setMessage('Conexão realizada e autorizada com sucesso!');
        })
        .catch(() => {
          setStatus('success');
          setMessage('Conexão autorizada! Os dados serão sincronizados via webhook.');
        });
    } else {
      setStatus('success');
      setMessage('Retorno recebido. Conexão em processamento.');
    }
  }, [itemId, error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fadeIn">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <h2 className="text-lg font-bold text-white">Processando Conexão</h2>
          <p className="text-xs text-slate-400 max-w-xs">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-white">Banco Conectado!</h2>
          <p className="text-xs text-slate-400 max-w-xs">{message}</p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
            <Link
              href="/patrimonio"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Ver no Patrimônio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Voltar para o Início
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-white">Falha na Conexão</h2>
          <p className="text-xs text-rose-300 max-w-xs">{message}</p>
          <Link
            href="/patrimonio"
            className="mt-4 w-full max-w-xs py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Tentar Novamente
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ConectarRetornoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <ConectarRetornoContent />
    </Suspense>
  );
}
