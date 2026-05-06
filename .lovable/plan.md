## Situação atual

A Luna (sales-agent) hoje só tem links prontos para os **produtos educacionais via Kiwify**:

- Pack Editorial — R$ 37 → `https://pay.kiwify.com.br/SLgYyHP`
- Curso Completo — R$ 497 → `https://pay.kiwify.com.br/G0oqvsb`

Para os **serviços** (Essencial R$ 97, Impacto R$ 247, Campanha Completa R$ 497, fotos/vídeos avulsos), ela **não envia link nenhum** — só fala "posso gerar o link de pagamento" e o fluxo trava. Hoje o site gera pagamento via `create-payment` (Stripe Checkout), mas isso exige passar por todo o funil do site (`/`).

## O que vamos fazer

Dar à Luna a capacidade de enviar link Stripe correto para qualquer combinação de serviço, sem ela depender do site.

### 1. Criar Payment Links fixos no Stripe para os 3 pacotes

Usar Stripe Payment Links (URLs permanentes, sem precisar criar sessão a cada venda). Vou criar via tool `stripe`:

- Pacote Essencial — R$ 97 (3 fotos)
- Pacote Impacto — R$ 247 (5 fotos + 2 vídeos)
- Pacote Campanha Completa — R$ 497 (10 fotos + 5 vídeos)

Resultado: 3 URLs estáveis (`https://buy.stripe.com/...`) que a Luna manda direto no WhatsApp.

### 2. Criar edge function `create-custom-payment-link` para orçamentos fora dos pacotes

Quando o cliente quiser combinação custom (ex: 4 fotos + 1 vídeo, ou 20 fotos), a Luna chama essa função via tool-calling e recebe um link Stripe gerado na hora.

- Input: `photos_qty`, `videos_qty`, `customer_email`, `customer_name`, `whatsapp`
- Lógica: aplica preço de combo se bater com pacote, senão calcula avulso (29,90/foto + 49,90/vídeo) — mesma regra de `create-payment`
- Cria `order` no banco com status `pending` e gera Stripe Checkout Session
- Retorna `url` para a Luna mandar

### 3. Atualizar o prompt da Luna em `sales-agent/index.ts`

Adicionar na seção "O QUE A VELORA OFERECE":

```
LINKS DE PAGAMENTO — SERVIÇOS (Stripe):
- Essencial R$ 97 → [link gerado]
- Impacto R$ 247 → [link gerado]
- Campanha Completa R$ 497 → [link gerado]

Para combinações customizadas (qualquer outra qty de foto/vídeo):
chame a tool generate_custom_payment_link com photos_qty, videos_qty,
customer_email e customer_name. A função retorna a URL para você enviar.
```

E adicionar tool-calling no payload do LLM (já usa Lovable AI Gateway, suporta tools) para `generate_custom_payment_link`.

### 4. Resposta direta à sua pergunta — o que a Luna **já consegue passar hoje**

Apenas estes dois links (educacionais Kiwify):
- Pack Editorial R$ 37: `https://pay.kiwify.com.br/SLgYyHP`
- Curso Velora R$ 497: `https://pay.kiwify.com.br/G0oqvsb`

**Nenhum link de serviço.** É exatamente isso que o plano resolve.

## Arquivos

- **Novo:** `supabase/functions/create-custom-payment-link/index.ts`
- **Editar:** `supabase/functions/sales-agent/index.ts` (adicionar links + tool-calling)
- **Editar:** `supabase/config.toml` (registrar nova função com `verify_jwt = false`)
- **Stripe (via tool):** criar 3 produtos + payment links
