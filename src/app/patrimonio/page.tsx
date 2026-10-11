'use client';

import { useState } from 'react';
import { Landmark, TrendingUp, CreditCard, Wallet, PlusCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically load PluggyConnect to avoid SSR document/window issues
const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false }
);

export default function PatrimonioPage() {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // Core metrics
  const cash = 5320.0;
  const investments = 48500.0;
  const cardLiability = 1870.0;
  const netWorth = cash + investments - cardLiability;
  const contributionsThisMonth = 1500.0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleStartConnect = async () => {
    try {
      setIsConnecting(true);
      setSyncStatus(null);
      const res = await fetch('/api/connect-token', { method: 'POST' });
      const data = await res.json();
      if (data.accessToken) {
        setConnectToken(data.accessToken);
      } else {
        alert('Erro ao obter token da Pluggy: ' + (data.error || 'Verifique variáveis de ambiente.'));
      }
    } catch (err: any) {
      alert('Falha na requisição: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSuccess = async (itemData: any) => {
    const itemId = itemData?.item?.id || itemData?.itemId;
    setConnectToken(null);

    if (itemId) {
      try {
        setIsSyncing(true);
        setSyncStatus('Sincronizando contas, cartões e transações...');
        const res = await fetch('/api/connections/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        });
        const data = await res.json();
        if (res.ok) {
          setSyncStatus(`Sincronização concluída com sucesso (${data.accountsCount || 0} contas importadas)!`);
          setLastSyncDate('Agora mesmo');
        } else {
          setSyncStatus('Conexão autorizada. Dados sendo processados via webhook.');
        }
      } catch {
        setSyncStatus('Conexão realizada! Concluindo sincronização em segundo plano.');
      } finally {
        setIsSyncing(false);
      }
    } else {
      setSyncStatus('Conexão bancária autorizada.');
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Patrimônio</h1>
          <p className="text-xs text-slate-400">Evolução patrimonial e composição líquida</p>
        </div>
        {lastSyncDate && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            {lastSyncDate}
          </span>
        )}
      </div>

      {/* Patrimônio Líquido Total Card (FIN-007) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 shadow-lg">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Patrimônio Líquido
        </span>
        <div className="text-3xl font-extrabold tracking-tight text-white mt-1">
          {formatCurrency(netWorth)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Aportes neste mês
          </span>
          <span className="font-semibold text-emerald-400">
            {formatCurrency(contributionsThisMonth)}
          </span>
        </div>
      </div>

      {/* Componentes do Patrimônio */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Composição
        </h2>

        {/* Investimentos */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-100 block">Investimentos</span>
              <span className="text-[11px] text-slate-400">Renda Fixa, Ações e Fundos</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-100">
            {formatCurrency(investments)}
          </span>
        </div>

        {/* Dinheiro em Conta */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-100 block">Contas Correntes</span>
              <span className="text-[11px] text-slate-400">Saldo bancário disponível</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-100">{formatCurrency(cash)}</span>
        </div>

        {/* Passivo do Cartão */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-100 block">Faturas em Aberto</span>
              <span className="text-[11px] text-slate-400">Passivo atual de cartão</span>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400">
            - {formatCurrency(cardLiability)}
          </span>
        </div>
      </div>

      {/* Seção de Conexão Open Finance / Pluggy Sandbox */}
      <div className="mt-2 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200">Open Finance (Pluggy Sandbox)</h3>
            <p className="text-[11px] text-slate-400">Conecte o Pluggy Bank para testes locais</p>
          </div>
        </div>

        {syncStatus && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
            {isSyncing ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="text-slate-300">{syncStatus}</span>
          </div>
        )}

        {!connectToken ? (
          <button
            onClick={handleStartConnect}
            disabled={isConnecting || isSyncing}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Gerando Connect Token...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Conectar Banco no Sandbox</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
            <PluggyConnect
              connectToken={connectToken}
              includeSandbox={true}
              onSuccess={handleSuccess}
              onError={(error: any) => {
                console.error('Pluggy connection error:', error);
                setSyncStatus('Erro na conexão com o banco.');
                setConnectToken(null);
              }}
              onClose={() => setConnectToken(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
