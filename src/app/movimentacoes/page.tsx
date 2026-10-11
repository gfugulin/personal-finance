'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { TransactionNature, TaxTreatment } from '@/domain/finance/types';

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  nature: TransactionNature;
  taxTreatment: TaxTreatment;
  category: string;
  accountName: string;
  reviewed: boolean;
}

const initialTransactions: TransactionItem[] = [
  {
    id: '1',
    description: 'Pix recebido de João Silva',
    amount: 1500.0,
    date: '10/10/2026',
    nature: 'INCOME',
    taxTreatment: 'REVIEW',
    category: 'Outros',
    accountName: 'Nubank Conta',
    reviewed: false,
  },
  {
    id: '2',
    description: 'Supermercado Pão de Açúcar',
    amount: -342.5,
    date: '09/10/2026',
    nature: 'EXPENSE',
    taxTreatment: 'NO_TAX_EFFECT',
    category: 'Alimentação',
    accountName: 'Nubank Cartão',
    reviewed: true,
  },
  {
    id: '3',
    description: 'Pagamento de fatura Nubank',
    amount: -1870.0,
    date: '05/10/2026',
    nature: 'CARD_PAYMENT',
    taxTreatment: 'NO_TAX_EFFECT',
    category: 'Fatura Cartão',
    accountName: 'Nubank Conta',
    reviewed: true,
  },
  {
    id: '4',
    description: 'Aplicação Tesouro Selic',
    amount: -1000.0,
    date: '03/10/2026',
    nature: 'INVESTMENT',
    taxTreatment: 'ASSET_MOVEMENT',
    category: 'Investimentos',
    accountName: 'Nubank Conta',
    reviewed: true,
  },
  {
    id: '5',
    description: 'Transferência para conta própria Inter',
    amount: -500.0,
    date: '02/10/2026',
    nature: 'TRANSFER',
    taxTreatment: 'NO_TAX_EFFECT',
    category: 'Transferência',
    accountName: 'Nubank Conta',
    reviewed: true,
  },
];

export default function MovimentacoesPage() {
  const [filter, setFilter] = useState<'ALL' | 'REVIEW' | 'INCOME' | 'EXPENSE'>('ALL');
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [saveAsRule, setSaveAsRule] = useState(false);

  const filtered = transactions.filter((t) => {
    if (filter === 'REVIEW') return !t.reviewed || t.taxTreatment === 'REVIEW';
    if (filter === 'INCOME') return t.nature === 'INCOME';
    if (filter === 'EXPENSE') return t.nature === 'EXPENSE';
    return true;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSaveClassification = () => {
    if (!selectedTx) return;
    setTransactions((prev) =>
      prev.map((t) => (t.id === selectedTx.id ? { ...selectedTx, reviewed: true } : t))
    );
    setSelectedTx(null);
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold tracking-tight text-white">Movimentações</h1>
        <p className="text-xs text-slate-400">Classificação financeira e fiscal independente</p>
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
        {filtered.map((tx) => {
          const isPending = !tx.reviewed || tx.taxTreatment === 'REVIEW';
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
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Revisar
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{tx.date}</span>
                  <span>•</span>
                  <span>{tx.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={clsx(
                    'text-xs font-bold',
                    isPositive ? 'text-emerald-400' : 'text-slate-100'
                  )}
                >
                  {formatCurrency(tx.amount)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhuma movimentação encontrada neste filtro.
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal for Editing Classifications */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-2xl p-5 flex flex-col gap-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                  {selectedTx.description}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatCurrency(selectedTx.amount)} • {selectedTx.accountName}
                </span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Classification */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Classificação Financeira
              </label>
              <select
                value={selectedTx.nature}
                onChange={(e) =>
                  setSelectedTx({ ...selectedTx, nature: e.target.value as TransactionNature })
                }
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="INCOME">Receita (INCOME)</option>
                <option value="EXPENSE">Despesa (EXPENSE)</option>
                <option value="TRANSFER">Transferência Própria (TRANSFER)</option>
                <option value="CARD_PAYMENT">Pagamento de Fatura (CARD_PAYMENT)</option>
                <option value="INVESTMENT">Aporte em Investimento (INVESTMENT)</option>
                <option value="REFUND">Reembolso / Estorno (REFUND)</option>
                <option value="UNKNOWN">Não Identificado (UNKNOWN)</option>
              </select>
            </div>

            {/* Fiscal Classification */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Classificação Fiscal (IR)
              </label>
              <select
                value={selectedTx.taxTreatment}
                onChange={(e) =>
                  setSelectedTx({ ...selectedTx, taxTreatment: e.target.value as TaxTreatment })
                }
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="TAXABLE_INCOME">Rendimento Tributável</option>
                <option value="EXEMPT_NON_TAXABLE">Rendimento Isento / Não Tributável</option>
                <option value="EXCLUSIVE_DEFINITIVE">Tributação Exclusiva / Definitiva</option>
                <option value="DEDUCTIBLE_EXPENSE">Despesa Dedutível</option>
                <option value="TAX_WITHHELD">Imposto Retido na Fonte</option>
                <option value="ASSET_MOVEMENT">Movimentação Patrimonial</option>
                <option value="NO_TAX_EFFECT">Sem Efeito Fiscal</option>
                <option value="REVIEW">Precisa Revisar (REVIEW)</option>
              </select>
            </div>

            {/* Save rule checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rule"
                checked={saveAsRule}
                onChange={(e) => setSaveAsRule(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <label htmlFor="rule" className="text-xs text-slate-300">
                Sempre classificar assim para este estabelecimento
              </label>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleSaveClassification}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Classificação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
