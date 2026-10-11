insert into public.tax_rule_sets (
  calendar_year, source_name, source_url, source_updated_at, rules_json, active
) values (
  2026,
  'Receita Federal - Tributação de 2026',
  'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  '2026-04-27',
  '{
    "monthly": {
      "brackets": [
        {"upTo": 2428.80, "rate": 0, "deduction": 0},
        {"upTo": 2826.65, "rate": 0.075, "deduction": 182.16},
        {"upTo": 3751.05, "rate": 0.15, "deduction": 394.16},
        {"upTo": 4664.68, "rate": 0.225, "deduction": 675.49},
        {"upTo": null, "rate": 0.275, "deduction": 908.73}
      ],
      "dependentDeduction": 189.59,
      "simplifiedDeductionLimit": 607.20,
      "fullReductionIncomeMax": 5000.00,
      "fullReductionCap": 312.89,
      "partialReductionIncomeMax": 7350.00,
      "partialReduction": {"constant": 978.62, "coefficient": 0.133145}
    },
    "annual": {
      "brackets": [
        {"upTo": 29145.60, "rate": 0, "deduction": 0},
        {"upTo": 33919.80, "rate": 0.075, "deduction": 2185.92},
        {"upTo": 45012.60, "rate": 0.15, "deduction": 4729.91},
        {"upTo": 55976.16, "rate": 0.225, "deduction": 8105.85},
        {"upTo": null, "rate": 0.275, "deduction": 10904.66}
      ],
      "dependentDeduction": 2275.08,
      "educationExpenseLimit": 3561.50,
      "simplifiedDeductionLimit": 17640.00,
      "fullReductionIncomeMax": 60000.00,
      "fullReductionCap": 2694.15,
      "partialReductionIncomeMax": 88200.00,
      "partialReduction": {"constant": 8429.73, "coefficient": 0.095575}
    }
  }'::jsonb,
  true
)
on conflict (calendar_year) do update
set rules_json = excluded.rules_json,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    source_updated_at = excluded.source_updated_at;
