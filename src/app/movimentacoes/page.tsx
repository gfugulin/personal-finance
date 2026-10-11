'use client';

import { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TransactionNature, TaxTreatment } from '@/domain/finance/types';

interface TransactionItem {
  id: string;
  description: string;
  merchantName?: string | null;
  amount: number;
  date: string;
  nature: TransactionNature;
  taxTreatment: TaxTreatment;
  accountName: string;
  accountType?: 'BANK' | 'CREDIT';
  reviewed: boolean;
}

export default function MovimentacoesPage() {
  const [filter, setFilter] = useState<'ALL' | 'REVIEW' | 'INCOME' | 'EXPENSE'>('ALL');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/movimentacoes');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar movimentações:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchMerch = t.merchantName?.toLowerCase().includes(q);
      if (!matchDesc && !matchMerch) return false;
    }

    if (filter === 'REVIEW') return !t.reviewed || t.taxTreatment === 'REVIEW' || t.nature === 'UNKNOWN';
    if (filter === 'INCOME') return t.nature === 'INCOME';
    if (filter === 'EXPENSE') return t.nature === 'EXPENSE';
    return true;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const handleSaveClassification = async () => {
    if (!selectedTx) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/movimentacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTx.id,
          nature: selectedTx.nature,
          taxTreatment: selectedTx.taxTreatment,
        }),
      });

      if (res.ok) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === selectedTx.id ? { ...selectedTx, reviewed: true } : t))
        );
        setSelectedTx(null);
      } else {
        alert('Erro ao salvar classificação.');
      }
    } catch (err: any) {
      alert('Falha na comunicação: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold tracking-tight text-white">Movimentações</h1>
        <p className="text-xs text-slate-400">Classificação financeira e fiscal independente</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar por descrição ou estabelecimento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {[
          { label: 'Todas', value: 'ALL' },
          { label: 'Precisa revisar', value: 'REVIEW' },
          { label: 'Entradas', value: 'INCOME' },
          { label: 'Gastos', value: 'EXPENSE' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value as any)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              filter === chip.value
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span className="text-xs">Carregando movimentações do banco...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400">Nenhuma movimentação encontrada neste filtro.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isPending = !tx.reviewed || tx.taxTreatment === 'REVIEW' || tx.nature === 'UNKNOWN';
            const isPositive = tx.amount > 0;

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 active:bg-slate-850 cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {tx.description}
                    </span>
                    {isPending && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{formatDate(tx.date)}</span>
                    <span>•</span>
                    <span>{tx.accountName}</span>
                    <span>•</span>
                    <span className="font-mono text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-300">
                      {tx.nature}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={clsx(
                        'text-xs font-bold block',
                        tx.nature === 'INCOME'
                          ? 'text-emerald-400'
                          : tx.nature === 'INVESTMENT'
                          ? 'text-cyan-400'
                          : 'text-slate-100'
                      )}
                    >
                      {isPositive ? `+ ${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {tx.taxTreatment === 'TAXABLE_INCOME'
                        ? 'Tributável'
                        : tx.taxTreatment === 'NO_TAX_EFFECT'
                        ? 'Sem efeito'
                        : tx.taxTreatment === 'REVIEW'
                        ? 'Revisar fiscal'
                        : tx.taxTreatment}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Detalhe e Reclassificação (FIN-004 e TAX-001) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Editar Classificação</h3>
                <p className="text-[11px] text-slate-400">Separação financeira e fiscal (TAX-001)</p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-100 block truncate max-w-[200px]">
                  {selectedTx.description}
                </span>
                <span className="text-[10px] text-slate-400">{formatDate(selectedTx.date)}</span>
              </div>
              <span className="text-sm font-bold text-white">
                {formatCurrency(selectedTx.amount)}
              </span>
            </div>

            {/* Natureza Financeira */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Natureza Financeira
              </label>
              <select
                value={selectedTx.nature}
                onChange={(e) =>
                  setSelectedTx({
                    ...selectedTx,
                    nature: e.target.value as TransactionNature,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="INCOME">Receita / Entrada (INCOME)</option>
                <option value="EXPENSE">Gasto de Consumo (EXPENSE)</option>
                <option value="TRANSFER">Transferência Própria (TRANSFER)</option>
                <option value="CARD_PAYMENT">Pagamento de Fatura (CARD_PAYMENT)</option>
                <option value="INVESTMENT">Aporte em Investimento (INVESTMENT)</option>
                <option value="REFUND">Estorno / Devolução (REFUND)</option>
                <option value="IGNORE">Ignorar dos Cálculos (IGNORE)</option>
              </select>
            </div>

            {/* Tratamento Fiscal Independente */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tratamento Fiscal (IRPF)
              </label>
              <select
                value={selectedTx.taxTreatment}
                onChange={(e) =>
                  setSelectedTx({
                    ...selectedTx,
                    taxTreatment: e.target.value as TaxTreatment,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="REVIEW">Revisar Depois (REVIEW)</option>
                <option value="TAXABLE_INCOME">Rendimento Tributável</option>
                <option value="EXEMPT_NON_TAXABLE">Rendimento Isento e Não Tributável</option>
                <option value="EXCLUSIVE_DEFINITIVE">Tributação Exclusiva / Definitiva</option>
                <option value="DEDUCTIBLE_EXPENSE">Despesa Dedutível</option>
                <option value="ASSET_MOVEMENT">Movimentação Patrimonial</option>
                <option value="NO_TAX_EFFECT">Sem Efeito Fiscal</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClassification}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
