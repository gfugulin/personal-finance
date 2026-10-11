import { RefreshCw, TrendingUp, AlertCircle, ShieldCheck, Wallet, CreditCard, Tag, CalendarClock, ArrowUpRight, ArrowDownRight, CheckCircle2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { fetchUserFinancialSummary } from '@/server/db/dashboard';

export const dynamic = 'force-dynamic';

export default async function HojePage({
  searchParams,
}: {
  searchParams?: { mes?: string };
}) {
  const targetMonth = searchParams?.mes;
  let summary;
  try {
    summary = await fetchUserFinancialSummary(targetMonth);
  } catch (err) {
    // Caso de fallback em sessão inválida ou sem dados
    summary = null;
  }

  const hoje = summary?.hoje || {
    freeMoney: 0,
    bankCash: 0,
    cardLiability: 0,
    monthIncome: 0,
    monthSpending: 0,
    monthInvested: 0,
    savingsRate: 0,
    pendingReviewsCount: 0,
    categoryBreakdown: [],
    recurringSubscriptions: [],
    totalFixedMonthly: 0,
    selectedMonth: new Date().toISOString().slice(0, 7),
    availableMonths: [new Date().toISOString().slice(0, 7)],
  };

  const netMonth = (hoje.monthIncome || 0) - (hoje.monthSpending || 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatSyncTime = (dateStr: string | null) => {
    if (!dateStr) return 'Sem conexões';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Agora mesmo';
    if (diff < 60) return `Há ${diff} min`;
    const hours = Math.floor(diff / 60);
    return `Há ${hours}h`;
  };

  const formatMonthLabel = (monthKey: string) => {
    if (!monthKey || monthKey.length < 7) return 'Mês Atual';
    const [year, month] = monthKey.split('-');
    const monthsPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mIndex = parseInt(month, 10) - 1;
    const name = monthsPt[mIndex] || month;
    return `${name} de ${year}`;
  };

  const availableMonths = hoje.availableMonths || [];
  const currentMonthIdx = availableMonths.indexOf(hoje.selectedMonth);
  const prevMonth = currentMonthIdx !== -1 && currentMonthIdx < availableMonths.length - 1
    ? availableMonths[currentMonthIdx + 1]
    : null;
  const nextMonth = currentMonthIdx > 0
    ? availableMonths[currentMonthIdx - 1]
    : null;

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Hoje</h1>
          <p className="text-xs text-slate-400">Visão financeira e inteligência de gastos</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatSyncTime(summary?.lastSyncAt || null)}</span>
        </div>
      </div>

      {/* KPI Principal: Dinheiro Livre (SPEC 006, FIN-006) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Dinheiro Livre
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Disponível real
          </span>
        </div>
        <div
          className={`text-3xl font-extrabold tracking-tight ${
            hoje.freeMoney < 0 ? 'text-rose-400' : 'text-white'
          }`}
        >
          {formatCurrency(hoje.freeMoney)}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Saldo em conta descontando faturas em aberto e reserva de emergência.
        </p>
      </div>

      {/* Saldo vs Fatura Cartão */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saldo em Conta</span>
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {formatCurrency(hoje.bankCash)}
          </div>
          <span className="text-[10px] text-slate-500">Nubank / Bancos</span>
        </div>
        <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-rose-400" />
            <span>Fatura em Aberto</span>
          </div>
          <div className="text-lg font-bold text-rose-400 mt-1">
            {formatCurrency(hoje.cardLiability)}
          </div>
          <span className="text-[10px] text-slate-500">Comprometido</span>
        </div>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
        {prevMonth ? (
          <Link
            href={`/?mes=${prevMonth}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[11px]">Anterior</span>
          </Link>
        ) : (
          <div className="w-16" />
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-100 tracking-wide">
            {formatMonthLabel(hoje.selectedMonth)}
          </span>
        </div>

        {nextMonth ? (
          <Link
            href={`/?mes=${nextMonth}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title="Próximo mês"
          >
            <span className="text-[11px]">Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Resumo do Mês (Entrou, Gastou, Balanço Líquido) */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fluxo ({formatMonthLabel(hoje.selectedMonth)})
          </h2>
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            netMonth >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {netMonth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{netMonth >= 0 ? `Superávit ${formatCurrency(netMonth)}` : `Déficit ${formatCurrency(Math.abs(netMonth))}`}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
            <span className="text-[11px] text-slate-400">Entrou</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {formatCurrency(hoje.monthIncome)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
            <span className="text-[11px] text-slate-400">Gastou</span>
            <div className="text-sm font-bold text-rose-300 mt-0.5">
              {formatCurrency(hoje.monthSpending)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
            <span className="text-[11px] text-slate-400">Investiu</span>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">
              {formatCurrency(hoje.monthInvested)}
            </div>
          </div>
        </div>

        {/* Taxa de poupança */}
        <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Taxa de Poupança
          </span>
          <span className="font-semibold text-emerald-400">
            {(hoje.savingsRate * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Gastos por Categoria neste Mês */}
      {hoje.categoryBreakdown && hoje.categoryBreakdown.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Gastos por Categoria ({formatMonthLabel(hoje.selectedMonth)})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Total {formatCurrency(hoje.monthSpending)}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {hoje.categoryBreakdown.slice(0, 5).map((cat: any) => (
              <div key={cat.category} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-semibold">{formatCurrency(cat.total)}</span>
                    <span className="text-[10px] text-slate-500 w-8 text-right">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assinaturas & Custos Fixos Detectados */}
      {hoje.recurringSubscriptions && hoje.recurringSubscriptions.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-cyan-400" />
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Assinaturas & Custos Fixos
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-cyan-400">
              {formatCurrency(hoje.totalFixedMonthly)}/mês
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {hoje.recurringSubscriptions.map((sub: any) => (
              <div
                key={sub.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{sub.name}</span>
                  <span className="text-[10px] text-slate-500">{sub.category} • Mensal</span>
                </div>
                <span className="text-xs font-bold text-slate-100">
                  {formatCurrency(sub.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de Revisão Pendente */}
      {hoje.pendingReviewsCount > 0 && (
        <Link
          href="/movimentacoes?filter=review"
          className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold block">Precisa revisar</span>
              <span className="text-amber-300/80 text-[11px]">
                {hoje.pendingReviewsCount} movimentações aguardando classificação
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">
            Revisar
          </span>
        </Link>
      )}

      {/* Resumo Fiscal Compacto YTD */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              IR 2026 (YTD)
            </h2>
          </div>
          <Link href="/ir" className="text-xs text-indigo-400 hover:underline">
            Ver detalhes
          </Link>
        </div>
        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
          <span className="text-slate-400">Rendimentos Tributáveis</span>
          <span className="font-medium text-slate-200">
            {formatCurrency(hoje.monthIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-400">Estimativa de Imposto</span>
          <span className="font-medium text-emerald-400">R$ 0,00</span>
        </div>
      </div>
    </div>
  );
}
