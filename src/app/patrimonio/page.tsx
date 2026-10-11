'use client';

import { useState, useEffect } from 'react';
import { Landmark, TrendingUp, CreditCard, Wallet, PlusCircle, CheckCircle2, Loader2, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically load PluggyConnect to avoid SSR document/window issues
const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false }
);

interface AccountItem {
  id: string;
  name: string;
  type: 'BANK' | 'CREDIT';
  balance: number;
}

interface InvestmentItem {
  id: string;
  name?: string | null;
  current_value: number;
}

export default function PatrimonioPage() {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string | null>(null);

  // Real data state
  const [cash, setCash] = useState<number>(0);
  const [investments, setInvestments] = useState<number>(0);
  const [cardLiability, setCardLiability] = useState<number>(0);
  const [netWorth, setNetWorth] = useState<number>(0);
  const [contributionsThisMonth, setContributionsThisMonth] = useState<number>(0);
  const [accountsList, setAccountsList] = useState<AccountItem[]>([]);
  const [investmentsList, setInvestmentsList] = useState<InvestmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Pendente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  const loadPatrimonioData = async () => {
    try {
      const res = await fetch('/api/patrimonio');
      if (res.ok) {
        const data = await res.json();
        const p = data.patrimonio || {};
        setCash(p.cash || 0);
        setInvestments(p.investments || 0);
        setCardLiability(p.cardLiability || 0);
        setNetWorth(p.netWorth || 0);
        setContributionsThisMonth(p.contributionsThisMonth || 0);
        setAccountsList(data.accounts || []);
        setInvestmentsList(data.investments || []);
        setInstitutionName(data.institutionName || null);
        setConnectionStatus(data.connectionStatus || null);
        setLastSuccessfulSyncAt(data.lastSuccessfulSyncAt || null);

        if (data.lastSyncAt) {
          const diff = Math.floor((Date.now() - new Date(data.lastSyncAt).getTime()) / 60000);
          setLastSyncDate(diff < 1 ? 'Agora mesmo' : diff < 60 ? `Há ${diff} min` : 'Hoje');
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar patrimônio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatrimonioData();
  }, []);

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

  const processItemSync = async (itemId: string, statusHint?: string) => {
    try {
      setIsSyncing(true);
      setSyncStatus(`Item criado (${statusHint || 'UPDATING'}). Sincronizando contas e dados do Meu Pluggy...`);
      
      const res = await fetch('/api/connections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();

      if (res.status === 200) {
        setSyncStatus(`Conectado com sucesso via Meu Pluggy! ${data.accountsCount || 0} conta(s) importada(s).`);
        setLastSyncDate('Agora mesmo');
        await loadPatrimonioData();
      } else if (res.status === 202) {
        setSyncStatus('Conexão registrada! O conector Meu Pluggy está processando os dados via webhook.');
        setLastSyncDate('Em andamento');
        await loadPatrimonioData();
      } else {
        setSyncStatus(`Aviso na sincronização: ${data.error || 'Processando em segundo plano.'}`);
      }
    } catch {
      setSyncStatus('Conexão registrada! Concluindo sincronização via webhook.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSuccess = async (itemData: any) => {
    const itemId = itemData?.item?.id || itemData?.itemId;
    setConnectToken(null);

    if (itemId) {
      await processItemSync(itemId, 'UPDATED');
    } else {
      setSyncStatus('Conexão bancária autorizada.');
    }
  };

  const handleError = async (error: any) => {
    console.error('Pluggy connection error payload:', error);
    setConnectToken(null);

    const itemId = error?.data?.item?.id || error?.item?.id;
    const itemStatus = error?.data?.item?.status || error?.item?.status;

    if (itemId) {
      await processItemSync(itemId, itemStatus || 'UPDATING');
      return;
    }

    setSyncStatus(
      'Falha no conector: ' +
        (error?.message === 'Item was not sync successfully'
          ? 'O conector não respondeu a tempo. Tente novamente selecionando o conector MeuPluggy.'
          : error?.message || 'Verifique suas credenciais.')
    );
  };

  const isMeuPluggyConnected =
    institutionName?.toLowerCase().includes('meupluggy') ||
    institutionName?.toLowerCase().includes('meu pluggy');

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
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
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
              <span className="text-[11px] text-slate-400">
                {investmentsList.length > 0 ? `${investmentsList.length} ativo(s)` : 'Renda Fixa, Ações e Fundos'}
              </span>
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
              <span className="text-[11px] text-slate-400">
                {accountsList.filter((a) => a.type === 'BANK').length > 0
                  ? `${accountsList.filter((a) => a.type === 'BANK').length} conta(s) ativa(s)`
                  : 'Saldo bancário disponível'}
              </span>
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
              <span className="text-[11px] text-slate-400">
                {accountsList.filter((a) => a.type === 'CREDIT').length > 0
                  ? `${accountsList.filter((a) => a.type === 'CREDIT').length} cartão(ões) com saldo`
                  : 'Passivo atual de cartão'}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400">
            - {formatCurrency(cardLiability)}
          </span>
        </div>
      </div>

      {/* Lista detalhada de contas reais */}
      {accountsList.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Contas Conectadas
          </h2>
          {accountsList.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                {acc.type === 'CREDIT' ? (
                  <CreditCard className="w-4 h-4 text-rose-400" />
                ) : (
                  <Wallet className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <span className="text-xs font-medium text-slate-200 block">{acc.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {acc.type === 'CREDIT' ? 'Cartão de Crédito' : 'Conta Corrente'}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  acc.type === 'CREDIT' ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {formatCurrency(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* REQ 5: Status e Atualização Automática via Meu Pluggy */}
      {isMeuPluggyConnected ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-900/50 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Atualização automática via Meu Pluggy
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {connectionStatus === 'ACTIVE' ? 'Ativo' : connectionStatus || 'Sincronizado'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex flex-col gap-1 border-t border-slate-800/80 pt-2.5">
            <div className="flex justify-between">
              <span>Última sincronização com sucesso:</span>
              <span className="font-medium text-slate-200">
                {formatDate(lastSuccessfulSyncAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status do Proxy:</span>
              <span className="font-medium text-emerald-400">
                Conectado (Proxy MeuPluggy)
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">
            Os dados do Nubank são sincronizados continuamente pelo conector Meu Pluggy via webhooks seguros, sem necessidade de atualização manual.
          </p>
        </div>
      ) : (
        /* Seção para Conectar o Conector MeuPluggy */
        <div className="mt-2 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200">Conexão via Meu Pluggy</h3>
              <p className="text-[11px] text-slate-400">
                Conecte o proxy MeuPluggy para importar dados do Nubank
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-400 block mb-0.5">
                Fluxo Seguro via MeuPluggy:
              </span>
              <span>
                No widget, selecione o conector <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300 font-mono">MeuPluggy</code> para vincular suas contas reais do Nubank com segurança.
              </span>
            </div>
          </div>

          {syncStatus && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-200 animate-fadeIn">
              {isSyncing ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{syncStatus}</span>
            </div>
          )}

          <button
            onClick={handleStartConnect}
            disabled={isConnecting || isSyncing}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Gerando token seguro...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>Conectar Meu Pluggy (Nubank)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal / Widget Pluggy Connect */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={() => setConnectToken(null)}
        />
      )}
    </div>
  );
}
