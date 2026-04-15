

# Correções Necessárias

## Problema 1: Mensagens não chegam no WhatsApp
O sistema enviou as mensagens com sucesso (Twilio retornou SID), mas como estamos no **Twilio Sandbox**, o destinatário precisa ter feito opt-in antes (enviar "join ..." para o número do sandbox). Sem isso, a mensagem é aceita pela API mas não entregue.

**Solução**: Não é um bug de código. Opções:
- Para testes: a pessoa precisa enviar a mensagem de adesão ao sandbox antes
- Para produção: migrar para um número Twilio com WhatsApp Business aprovado (não requer opt-in prévio)

## Problema 2: Lead não vincula à conversa automaticamente
Os leads do Gilbert e Juliana têm `lead_id: null` na conversa. O trigger `link_conversation_to_lead` compara o `whatsapp_number` da conversa (normalizado com `+55`, ex: `+5537991826936`) com o campo `whatsapp` do lead (salvo sem prefixo, ex: `37991826936`).

O trigger atual faz:
```
stripped_number = remove o "+" → "5537991826936"
WHERE whatsapp = "+5537991826936" OR whatsapp = "5537991826936"
```
Mas o lead tem `whatsapp = "37991826936"` (sem o 55). A comparação falha.

**Solução**: Atualizar o trigger `link_conversation_to_lead` para normalizar o número do lead da mesma forma — extrair apenas dígitos e comparar com/sem o prefixo 55.

### Arquivo: Migration SQL
Recriar a função `link_conversation_to_lead` com normalização robusta:
- Extrair apenas dígitos de ambos os lados
- Comparar sem prefixo de país (últimos 10-11 dígitos)
- Isso cobre todos os formatos: `37991826936`, `+5537991826936`, `5537991826936`

### Detalhes técnicos
```sql
CREATE OR REPLACE FUNCTION public.link_conversation_to_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  found_lead_id uuid;
  conv_digits text;
BEGIN
  -- Extract only digits from conversation number
  conv_digits := regexp_replace(NEW.whatsapp_number, '[^0-9]', '', 'g');
  -- Remove country code 55 if present
  IF left(conv_digits, 2) = '55' AND length(conv_digits) > 11 THEN
    conv_digits := substring(conv_digits from 3);
  END IF;

  SELECT id INTO found_lead_id FROM leads
  WHERE regexp_replace(whatsapp, '[^0-9]', '', 'g') = conv_digits
     OR regexp_replace(
          regexp_replace(whatsapp, '[^0-9]', '', 'g'),
          '^55', ''
        ) = conv_digits
  LIMIT 1;

  IF found_lead_id IS NOT NULL THEN
    NEW.lead_id := found_lead_id;
  END IF;
  RETURN NEW;
END;
$$;
```

Também corrigir retroativamente os 2 leads existentes que não foram vinculados.

