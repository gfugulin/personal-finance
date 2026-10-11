# IRPF 2026 — Versioned Planning Configuration

Source of truth:
Receita Federal — Tributação de 2026.

This document exists to drive fixtures/tests. Production code should load a versioned configuration structure.

## Monthly progressive table — from Jan 2026

| Base | Rate | Deduction |
|---|---:|---:|
| up to 2,428.80 | 0% | 0 |
| 2,428.81–2,826.65 | 7.5% | 182.16 |
| 2,826.66–3,751.05 | 15% | 394.16 |
| 3,751.06–4,664.68 | 22.5% | 675.49 |
| above 4,664.68 | 27.5% | 908.73 |

Monthly dependent deduction: 189.59  
Monthly simplified deduction limit: 607.20

## Monthly reduction

Qualifying taxable income:
- up to 5,000.00: reduction sufficient for tax due to be zero, capped by official rule;
- 5,000.01–7,350.00: `978.62 - (0.133145 × taxable income)`;
- from 7,350.00: no monthly reduction under this rule.

The official cap up to 5,000 is R$ 312.89.

## Annual progressive table — calendar year 2026 / exercise 2027

| Base | Rate | Deduction |
|---|---:|---:|
| up to 29,145.60 | 0% | 0 |
| 29,145.61–33,919.80 | 7.5% | 2,185.92 |
| 33,919.81–45,012.60 | 15% | 4,729.91 |
| 45,012.61–55,976.16 | 22.5% | 8,105.85 |
| above 55,976.16 | 27.5% | 10,904.66 |

Annual dependent deduction: 2,275.08  
Annual education expense limit: 3,561.50  
Annual simplified deduction limit: 17,640.00

## Annual reduction

Qualifying annual taxable income:
- up to 60,000.00: reduction sufficient for tax due to be zero, official cap R$ 2,694.15;
- 60,000.01–88,200.00: `8,429.73 - (0.095575 × taxable income)`;
- from 88,200.00: no annual reduction under this rule.

## Safety

Do not infer filing obligation from these values.

Do not automatically decide whether simplified or legal deductions are globally optimal without implementing and testing the complete applicable official calculation.

MVP estimator may support:
- a configured deduction basis;
- manual tax paid/withheld;
- explicit caveat.

All tax outputs display:
"Estimativa para organização pessoal. Confira as regras oficiais do exercício."
