## Objetivo

1. Trocar Stripe pelos novos links Kiwify dos pacotes + Pix manual para personalizados.
2. Criar fluxo de **handoff Luna → CEO** com briefing estruturado.
3. Empacotar o `/admin` como **app mobile** (Capacitor) com **notificações em tempo real** dos eventos-chave.

Sem mexer no prompt da Luna além da troca de links/regras de pagamento (você reescreve o prompt fora).

---

## Parte 1 — Pagamentos (sem Stripe agora)

### Links Kiwify oficiais (substituir nos lugares certos)

- Essencial R$ 97 → `https://pay.kiwify.com.br/8OjgeBH`
- Impacto R$ 247 → `https://pay.kiwify.com.br/HLTtg0k`
- Campanha Completa R$ 497 → `https://pay.kiwify.com.br/KKZmrag`

### Edits no `sales-agent/index.ts`

- Inserir os 3 links na seção "O QUE A VELORA OFERECE" do prompt.
- Remover/desativar a tool `generate_custom_payment_link` (ou deixar inativa) — para personalizado, Luna deve:
  - Calcular preço (29,90/foto + 49,90/vídeo).
  - Enviar Pix CPF: **05894688396** (titular: você).
  - Pedir comprovante por foto.
  - Avisar: *"No momento, orçamentos personalizados são pagos só por Pix. Nos próximos dias liberamos cartão de crédito também."*
- Adicionar nota fixa em todas as mensagens de pagamento: *"Se o link não estiver clicável, salve nosso contato na agenda e o link aparece azul/clicável."*

### Edge function `create-custom-payment-link`

Manter o arquivo mas marcar como deprecated (comentário no topo). Não desregistrar do `config.toml` por enquanto — sem custo, e útil quando Stripe voltar.

---

## Parte 2 — Handoff Luna → CEO (briefing)

### Migration no banco

Adicionar em `conversations`:
- `handoff_status` text default `'luna'` — valores: `luna`, `ceo_pending`, `ceo_active`
- `handoff_at` timestamptz
- `briefing` jsonb — `{ nome, marca, segmento, pacote, valor, prazo, observacoes, pix_pago }`

### Lógica no `sales-agent`

No início da função, se `handoff_status != 'luna'`:
- Salva mensagem inbound, **NÃO chama LLM**, **não responde**, só dispara push pra você.

Quando Luna detectar fechamento (cliente diz "paguei", manda comprovante, ou confirma pacote):
1. Chamada extra ao LLM pedindo JSON estruturado de briefing.
2. Salva em `conversations.briefing`, muda `handoff_status='ceo_pending'`.
3. Última mensagem ao cliente: *"Perfeito! Vou te conectar com o André, nosso diretor criativo, que cuida pessoalmente da execução. Ele te chama em instantes por aqui mesmo."*

### Endpoints novos (edge functions)

- **`conversation-takeover`** — body: `{ conversation_id, action: 'assume' | 'release' }`. Muda status para `ceo_active` ou volta pra `luna`. Protegido por `adminPassword`.
- **`conversation-send-message`** — body: `{ conversation_id, content, adminPassword }`. Manda via Twilio (`whatsapp-send`), grava como `outbound`/`message_type='ceo'`. Se `handoff_status='ceo_pending'`, vira `ceo_active` automaticamente.

---

## Parte 3 — UI Admin (já vira app)

### `ConversationsTab` — nova seção topo

**🔥 Aguardando você (`ceo_pending`)**: cards com nome, marca, pacote, valor, briefing completo formatado, botões **"Assumir conversa"** e **"Abrir chat"**.

### Tela da conversa

- Badge mostrando quem está respondendo (Luna / Você / Pendente).
- Botão **"Assumir"** (se `luna` ou `ceo_pending`) e **"Devolver pra Luna"** (se `ceo_active`).
- Campo de input + Send (já existe parcialmente) chamando `conversation-send-message`.

### Nova aba **"Briefings"** (opcional, mas leve)

Lista todas as conversas com briefing preenchido, filtro por status (pendente / em atendimento / concluído).

---

## Parte 4 — App mobile (Capacitor) + notificações

`capacitor.config.ts` já existe. Notifications lib já existe (`src/lib/notifications.ts`).

### Realtime → Local Notifications

Migration: habilitar realtime em `leads`, `conversations`, `conversation_messages`.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
```

No `Admin.tsx` (após login), abrir um channel global escutando:
- INSERT em `leads` → push *"🌱 Novo lead: {nome}"*
- INSERT em `conversations` → push *"💬 Nova conversa: {whatsapp}"*
- INSERT em `conversation_messages` com `direction='inbound'` → push *"✉️ {whatsapp}: {prévia}"*
- UPDATE em `conversations` com `handoff_status='ceo_pending'` → push *"🎯 Cliente fechado — briefing pronto"*

Local notifications (grátis, sem servidor de push). Funciona com app aberto/background recente. Quando precisar de push com app fechado, migramos pra FCM depois.

### Build mobile

Você roda no seu lado quando quiser:
1. Export to GitHub → `git pull`
2. `npm install`
3. `npx cap add android` (e/ou `ios`)
4. `npx cap sync`
5. `npx cap run android`

Custo: **R$ 0** Android (APK direto no celular). iOS pede Mac + Apple Developer (US$99/ano) — pula por enquanto.

---

## Fluxo final

```
Lead entra ─────────────► 🔔 push "Novo lead"
        │
Luna conversa, qualifica
        │
Cliente escolhe pacote ──► Luna manda link Kiwify
   ou personalizado ─────► Luna manda Pix 05894688396
        │
Cliente paga, manda comprovante
        │
Luna gera briefing JSON
muda handoff_status=ceo_pending
        │
        ▼
🔔 push "🎯 Cliente fechado: {nome} — briefing pronto"
        │
Você abre o app, lê briefing,
clica "Assumir conversa"
        │
Luna trava. Você responde pelo app.
Cliente vê tudo no mesmo número WhatsApp.
```

---

## Arquivos

**Migration:**
- Adicionar colunas em `conversations`
- Habilitar realtime nas 3 tabelas

**Editar:**
- `supabase/functions/sales-agent/index.ts` (links Kiwify, regra Pix, regra link clicável, gate handoff, gerar briefing)
- `src/components/admin/ConversationsTab.tsx` (seção pendentes, botões assumir/devolver, badges)
- `src/pages/Admin.tsx` (subscribe realtime + dispara notificações)

**Criar:**
- `supabase/functions/conversation-takeover/index.ts`
- `supabase/functions/conversation-send-message/index.ts`
- Atualizar `supabase/config.toml` com as 2 novas funções

**Não tocar:** prompt comportamental da Luna (você reescreve fora), Stripe.