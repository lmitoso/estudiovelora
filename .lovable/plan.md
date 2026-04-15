

## Plano: Fase 1 — Agente de Vendas IA no WhatsApp via Twilio

### Contexto
O Twilio já está conectado no workspace. Preciso vinculá-lo ao projeto e construir toda a infraestrutura do agente de vendas.

**Nota importante:** A memória do projeto diz "PROIBIDO usar APIs de automação no WhatsApp". Essa restrição será atualizada, pois você decidiu seguir com o agente IA automatizado.

---

### Passo 1: Vincular Twilio ao projeto
- Usar o conector para linkar a conexão Twilio existente ao projeto
- Isso disponibiliza `TWILIO_API_KEY` e `LOVABLE_API_KEY` nas Edge Functions

### Passo 2: Criar tabelas no banco

**`conversations`** — Uma conversa por lead
- `id`, `lead_id` (ref leads), `whatsapp_number`, `status` (new/active/negotiating/closed_won/closed_lost), `stage` (greeting/discovery/proposal/follow_up/closing), `context_summary` (resumo da conversa para a IA), `last_message_at`, `next_follow_up_at`, `created_at`, `updated_at`

**`conversation_messages`** — Histórico completo
- `id`, `conversation_id`, `direction` (inbound/outbound), `content`, `message_type` (text/payment_link/follow_up), `twilio_sid`, `created_at`

**`follow_up_schedule`** — Agenda de follow-ups
- `id`, `conversation_id`, `scheduled_at`, `type` (value_reminder/urgency/check_in), `status` (pending/sent/cancelled), `message_content`, `created_at`

RLS: Todas as tabelas bloqueadas para acesso público (somente Edge Functions com service role).

### Passo 3: Criar Edge Functions

**`whatsapp-webhook`** — Recebe mensagens do cliente
- Twilio envia POST quando o cliente responde
- Salva a mensagem no banco
- Chama o `sales-agent` para gerar resposta
- Envia a resposta via `whatsapp-send`

**`whatsapp-send`** — Envia mensagens via Twilio Gateway
- Usa `https://connector-gateway.lovable.dev/twilio/Messages.json`
- Formato `application/x-www-form-urlencoded`
- Salva mensagem enviada no banco

**`sales-agent`** — Cérebro da IA
- Usa Lovable AI (`google/gemini-2.5-flash`) com `LOVABLE_API_KEY`
- Prompt de sistema treinado com:
  - Identidade Velora (luxo silencioso, direção de arte com IA)
  - Etapas de venda (ouvir → entender → orçar → fechar)
  - Gatilhos de urgência e escassez quando apropriado
  - Tom educado, consultivo, nunca desesperado
  - Capacidade de enviar link de pagamento
  - Lógica de follow-up (se cliente não responde em X horas)

**`process-follow-ups`** — Cron job
- Roda a cada hora via `pg_cron`
- Busca follow-ups pendentes com `scheduled_at <= now()`
- Envia mensagens de follow-up via `whatsapp-send`

### Passo 4: Atualizar a Home
- Após lead se cadastrar, criar automaticamente uma conversa no banco
- Disparar primeira mensagem de boas-vindas via `whatsapp-send` (em vez de abrir `wa.me`)

### Passo 5: Atualizar o Admin
- Adicionar aba "Conversas" no painel admin
- Visualizar conversas ativas, status, e histórico de mensagens
- Alimentar o CRM automaticamente

### Passo 6: Atualizar memória do projeto
- Remover restrição de "PROIBIDO APIs de WhatsApp"
- Documentar nova arquitetura do agente

---

### Sobre a conta Trial do Twilio
- Na trial, você precisa configurar o **WhatsApp Sandbox** (Messaging > Try it out > Send a WhatsApp message)
- Só funciona com números verificados
- Para produção: upgrade da conta Twilio (~$15/mês)

### Custos recorrentes estimados
- Twilio: ~R$ 0,25-0,50 por mensagem
- Lovable AI: incluído no plano
- Infraestrutura: incluída no Lovable Cloud

