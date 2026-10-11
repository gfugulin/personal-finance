-- Migration 006: Reclassificar pagamentos de fatura e transferencias existentes
-- Garante invariantes de dominio (AGENTS.md):
-- 1. Pagamento de fatura de cartao nao e segunda despesa (CARD_PAYMENT)
-- 2. Transferencias nao sao despesa de consumo (TRANSFER)

-- Atualiza pagamentos de fatura de cartao
UPDATE public.transactions
SET nature = 'CARD_PAYMENT', updated_at = now()
WHERE (
  description ILIKE '%pagamento de fatura%'
  OR description ILIKE '%pagamento fatura%'
  OR description ILIKE '%pgto fatura%'
  OR description ILIKE '%fatura nubank%'
  OR description ILIKE '%fatura cartao%'
  OR description ILIKE '%fatura cartão%'
  OR description ILIKE '%nu pagamentos%'
  OR description ILIKE '%pagamento recebido%'
) AND nature <> 'CARD_PAYMENT';

-- Atualiza transferencias (Transfers Open Finance ou TED/Transferencia bancaria)
UPDATE public.transactions
SET nature = 'TRANSFER', updated_at = now()
WHERE (
  provider_category ILIKE 'transfers%'
  OR provider_category ILIKE 'transferências%'
  OR provider_category ILIKE 'transferencias%'
  OR description ILIKE '%transferência entre contas%'
  OR description ILIKE '%transferencia entre contas%'
  OR description ILIKE '%mesma titularidade%'
  OR description ILIKE '%transferência enviada%'
  OR description ILIKE '%transferencia enviada%'
  OR description ILIKE '%transferência recebida%'
  OR description ILIKE '%transferencia recebida%'
  OR description ILIKE '%ted enviada%'
  OR description ILIKE '%ted recebida%'
) AND nature <> 'TRANSFER';
