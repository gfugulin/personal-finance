'use client';

import { useState } from 'react';
import { FileSpreadsheet, ShieldAlert, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { TAX_DISCLAIMER, TAX_FILING_NOTICE } from '@/domain/tax/config-2026';
import { estimateAnnualTax } from '@/domain/tax/engine';

export default function IRPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [checklist, setChecklist] = useState([
    { id: '1', label: 'Informe de Rendimentos do Empregador / Empresa', completed: false },
    { id: '2', label: 'Informe de Rendimentos do Nubank / Bancos', completed: true },
    { id: '3', label: 'Informe de Rendimentos de Corretoras / Investimentos', completed: false },
    { id: '4', label: 'Recibos e Notas Fiscais de Despesas Médicas', completed: false },
    { id: '5', label: 'Revisão de todas as entradas Pix sem categoria', completed: false },
  ]);

  // Tax metrics mock/current read model for 2026
  const taxableIncome = 42000.0;
  const exemptIncome = 12500.0;
  const exclusiveIncome = 3200.0;
  const deductions = 2400.0;
  const taxWithheld = 0.0;

  const estimate = estimateAnnualTax({
    taxableIncome,
    deductions,
    withheldOrPaid: taxWithheld,
  });

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Header and Year selector */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">IR — Imposto de Renda</h1>
          <p className="text-xs text-slate-400">Organizador fiscal pessoal e dossiê anual</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
        >
          <option value={2026}>Ano 2026</option>
          <option value={2025}>Ano 2025</option>
        </select>
      </div>

      {/* Estimativa do Exercício */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Estimativa de Imposto Devido
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            Exercício {selectedYear + 1}
          </span>
        </div>
        <div className="text-3xl font-extrabold tracking-tight text-white mt-1">
          {formatCurrency(estimate.taxDue)}
        </div>
        {estimate.reduction > 0 && (
          <p className="mt-2 text-xs text-emerald-400 font-medium">
            Redução legal aplicada: {formatCurrency(estimate.reduction)}
          </p>
        )}
      </div>

      {/* Disclaimer legal obrigatório (TAX-010 / TAX-006) */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Aviso Importante</span>
        </div>
        <p>{TAX_DISCLAIMER}</p>
        <p className="text-slate-500">{TAX_FILING_NOTICE}</p>
      </div>

      {/* Cards de Rendimentos e Despesas */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Tributáveis</span>
          <span className="text-sm font-bold text-slate-100 mt-1 block">
            {formatCurrency(taxableIncome)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Isentos / Não Trib.</span>
          <span className="text-sm font-bold text-slate-100 mt-1 block">
            {formatCurrency(exemptIncome)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Tributação Exclusiva</span>
          <span className="text-sm font-bold text-slate-100 mt-1 block">
            {formatCurrency(exclusiveIncome)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Deduções Registradas</span>
          <span className="text-sm font-bold text-emerald-400 mt-1 block">
            {formatCurrency(deductions)}
          </span>
        </div>
      </div>

      {/* Checklist do Dossiê Anual (TAX-008) */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Checklist do Dossiê Anual
          </h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklist(item.id)}
              className="flex items-center gap-2.5 cursor-pointer text-xs group"
            >
              {item.completed ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400 flex-shrink-0" />
              )}
              <span
                className={item.completed ? 'text-slate-400 line-through' : 'text-slate-200'}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
