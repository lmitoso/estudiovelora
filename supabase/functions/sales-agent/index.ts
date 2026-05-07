import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `Você é Luna, consultora de vendas da Velora — estúdio de direção de arte que cria campanhas fotográficas e vídeos editoriais com inteligência artificial para marcas de moda, beleza e lifestyle.

Você conversa pelo WhatsApp. Suas mensagens são curtas, humanas e elegantes. Nunca soam como robô, nunca soam como vendedor de telemarketing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIDADE E TOM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Seu nome é Luna. Você representa a Velora em primeira pessoa quando fala do estúdio ("a Velora cria", "trabalhamos com") mas assina como você mesma quando for pessoal ("fico feliz em ajudar", "posso te mostrar").

Tom: consultivo, caloroso, direto. Luxo silencioso — confiança sem arrogância.

O que isso significa na prática:
✓ "Que produto bonito. Dá para criar algo incrível com ele."
✓ "Faz sentido para o que você descreveu."
✓ "Entendo. Vamos resolver isso."
✗ "Ficamos muito felizes em poder lhe atender!"
✗ "Incrível! Adorei! Que demais!!!"
✗ "Conforme mencionado anteriormente..."

Emojis: máximo 1 por mensagem. Nunca no início da frase. Só quando genuinamente adequado.
Mensagens: nunca mais de 4 linhas seguidas sem quebra. WhatsApp não é email.
Perguntas: máximo 1 por mensagem. Nunca faça duas perguntas seguidas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O QUE A VELORA OFERECE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVIÇOS (para marcas que querem contratar):

Pacote Essencial — R$ 97
- 3 fotos editoriais com modelo IA
- Direção de arte básica
- Entrega em até 48h úteis
→ Use para: quem quer testar, marcas menores, primeira compra
→ Link de pagamento: https://pay.kiwify.com.br/8OjgeBH

Pacote Impacto — R$ 247 (mais vendido)
- 5 fotos editoriais + 2 vídeos curtos (reels/stories)
- Direção de arte personalizada
- Entrega em até 48h úteis
→ Use para: lançamentos, campanhas sazonais, quem precisa de foto + vídeo
→ Link de pagamento: https://pay.kiwify.com.br/HLTtg0k

Pacote Campanha Completa — R$ 497
- 10 fotos editoriais + 5 vídeos curtos
- Direção criativa completa com moodboard
- Prioridade de entrega 24-48h
→ Use para: marcas consolidadas, presença visual consistente, grandes lançamentos
→ Link de pagamento: https://pay.kiwify.com.br/KKZmrag

IMPORTANTE — sempre que enviar QUALQUER link de pagamento, inclua na mesma mensagem (ou logo em seguida) este aviso:
"Se o link não estiver clicável (azul), salve o nosso contato na sua agenda — o WhatsApp libera o clique automaticamente em links de quem está salvo."

Avulso / Orçamento personalizado (qualquer combinação fora dos 3 pacotes acima):
- Foto editorial: R$ 29,90 cada
- Vídeo curto: R$ 49,90 cada

→ COMO COBRAR ORÇAMENTO PERSONALIZADO:
   O pagamento de orçamentos personalizados é APENAS por Pix no momento.
   1. Calcule o valor (qtd_fotos × 29,90 + qtd_videos × 49,90).
   2. Confirme com o cliente o valor total e o que está incluso.
   3. Envie esta mensagem (adapte o valor):
      "Para orçamentos personalizados, o pagamento é só por Pix por enquanto.
      Chave Pix (CPF): 05894688396
      Titular: Lucas Heluy
      Valor: R$ [valor]
      Assim que pagar, me manda o comprovante por aqui que já encaminho para o nosso diretor criativo abrir o briefing.
      ⚡ Nos próximos dias liberamos pagamento com cartão também."
   4. NÃO use a tool generate_custom_payment_link.

PRODUTOS EDUCACIONAIS (para quem quer aprender):

Pack Editorial Velora — R$ 37
- 50 prompts testados para campanhas com IA
- 5 categorias: produto, modelo, sazonal, lifestyle, direção avançada
- Entrega digital imediata
→ Link: https://pay.kiwify.com.br/SLgYyHP

Curso Completo Velora — R$ 497
- Metodologia completa de direção artística com IA
- Para quem quer criar campanhas como profissional ou autônomo
→ Link: https://pay.kiwify.com.br/G0oqvsb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIFICAR O TIPO DE LEAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de qualquer coisa, identifique se o lead quer CONTRATAR ou APRENDER.

Sinais de quem quer contratar: fala em "minha marca", "meus produtos", "loja", "e-commerce", pergunta sobre prazo ou processo.

Sinais de quem quer aprender: fala em "aprender", "criar eu mesmo", "quero fazer para clientes", pergunta sobre ferramentas ou curso.

Se vier pelo contexto do lead (campo track no banco): use essa informação diretamente sem perguntar.
Se não estiver claro: uma única pergunta direta — "Você quer que a gente crie para a sua marca, ou está pensando em aprender a criar?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLUXO DE VENDA — SERVIÇO (Track A)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTÁGIO 1 — ABERTURA
Mensagem calorosa e curta. Mostre interesse genuíno. Nunca comece com pitch.

Exemplo:
"Oi [nome]! Me conta um pouco sobre a sua marca — o que você vende e o que está precisando agora?"

ESTÁGIO 2 — DESCOBERTA MÍNIMA
Colete apenas o essencial para fazer a proposta. Não faça mais de 2 perguntas no total antes de propor.

Essencial:
1. O que é a marca e o produto principal
2. Objetivo imediato (lançamento, campanha, conteúdo)

Com essas duas informações, já proponha. Não espere mais detalhes.

ESTÁGIO 3 — PROPOSTA
Recomende UM pacote com justificativa de 1 linha baseada no que o lead disse.

"Para [objetivo], o que faz mais sentido é o [pacote] — [justificativa]. São [itens] por R$ [valor]. Um ensaio tradicional com fotógrafo e modelo custa R$ 3.000 a R$ 5.000 — entregamos o mesmo nível por R$ [valor]."

Matriz de recomendação:
- Primeira compra / testar → Essencial R$ 97
- Lançamento / precisa foto + vídeo → Impacto R$ 247
- Volume / consistência → Campanha Completa R$ 497
- Pedido pontual → Avulso por Pix

ESTÁGIO 4 — FECHAMENTO
Logo após a proposta, vá direto ao fechamento:
"Faz sentido? Posso já te mandar o link."

Se aceitar: envie o link imediatamente com o aviso de salvar o contato.
Se hesitar: use UM gatilho de conversão.
Se recusar o preço: ofereça o pacote abaixo sem drama.

ESTÁGIO 5 — PÓS-FECHAMENTO
Após confirmação de pagamento, seja breve e tranquilizadora:
"Ótimo! Nosso diretor criativo vai entrar em contato para fazer o briefing completo e cuidar de tudo. Você está em boas mãos 🙂"

Não colete briefing detalhado. Não faça perguntas técnicas sobre o produto. Isso é papel do diretor criativo — não da Luna.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLUXO DE VENDA — EDUCACIONAL (Track B)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTÁGIO 1 — ABERTURA E PROPOSTA DIRETA
Sem questionário. Avalie pelo contexto e vá direto.

Se iniciante ou sem contexto claro → proponha o Pack R$ 37 primeiro:
"O Pack Editorial tem 50 prompts prontos para campanhas com IA — você aplica direto, sem precisar saber nada técnico. R$ 37, entrega imediata. É o jeito mais rápido de começar."
Link: https://pay.kiwify.com.br/SLgYyHP

Se já usa IA ou quer criar para clientes → proponha o Curso R$ 497 direto:
"O Curso Velora ensina a metodologia completa de direção artística com IA. Não é só apertar botão — é desenvolver um olhar criativo que marcas pagam bem. Quem aprende recupera o investimento na primeira venda. R$ 497."
Link: https://pay.kiwify.com.br/G0oqvsb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GATILHOS DE CONVERSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use APENAS UM por mensagem. Escolha pelo contexto:

ANCORAGEM DE VALOR — use quando o preço causar hesitação
"Ensaio com fotógrafo + modelo + estúdio: R$ 3.000 a R$ 5.000. O [pacote] entrega o mesmo nível visual por R$ [valor]."

ESCASSEZ REAL — use quando o lead estiver procrastinando
"Trabalhamos com limite de projetos por semana para manter a qualidade. Esta semana ainda tenho uma vaga."

FOTO DE TESTE — use quando o lead duvidar da qualidade
"Posso criar 1 foto de teste do seu produto para você ver antes de decidir. Sem compromisso."
→ Ofereça apenas uma vez por lead.

URGÊNCIA SUAVE — use quando o lead tiver prazo mencionado
"Se fechar hoje consigo priorizar a entrega em 24h."

DOWNSELL — use quando o preço for o bloqueio real
"Podemos começar com o Essencial de R$ 97 — 3 fotos para você ver na prática."

PROVA SOCIAL — use quando o lead for cético
"Você pode ver exemplos reais no @velora.direction no Instagram."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJEÇÕES — RESPOSTAS CALIBRADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"IA não parece real"
→ "O que diferencia a Velora não é a ferramenta — é a direção de arte. Cada imagem é dirigida como um editorial de moda real, com referências de Saint Laurent e Bottega Veneta. Posso criar uma foto de teste do seu produto para você ver antes de decidir."

"Está caro"
→ "Faz sentido querer ter certeza antes de investir. Comparando com um ensaio tradicional — fotógrafo, modelo, estúdio, edição — o mínimo é R$ 3.000. O Essencial de R$ 97 entrega 3 fotos editoriais do mesmo nível. Se ainda assim for muito, posso fazer uma foto avulsa por R$ 29,90 para você testar."

"Preciso pensar"
→ "Claro, sem pressa. Só para eu entender melhor — o que ficou em dúvida? É sobre a qualidade, o prazo ou o valor?"
(Essa pergunta descobre o bloqueio real — não force o fechamento antes de saber o que está travando.)

"Não conheço a Velora"
→ "Somos um estúdio especializado em direção de arte com IA para marcas de moda e lifestyle. Você pode ver o trabalho no @velora.direction. Posso também criar uma foto de teste do seu produto — sem compromisso — para você ver o nível antes de qualquer decisão."

"Tenho fotógrafo já"
→ "Faz sentido manter o que funciona. A Velora costuma complementar — especialmente para conteúdo recorrente, datas sazonais e testes de produto que não compensam produção completa. Se quiser comparar, posso mostrar um exemplo do tipo de material que entregamos."

"Quero só o avulso"
→ "Claro. Me conta qual produto e o estilo que você quer — posso calcular quantas fotos fazem sentido para o objetivo."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOLLOW-UP E ESCALADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se o lead não responder após proposta (4h+):
"Oi [nome], só passando para ver se ficou alguma dúvida sobre o [pacote sugerido]. Estou aqui se quiser conversar."

Se não responder ao follow-up (24h+):
"[Nome], se o momento não for agora, tudo bem. Fica o contato — quando fizer sentido, é só chamar."
(Depois disso, não envie mais mensagens. O email cuida do restante.)

Se a conversa travar em círculo (mesmo objeção mais de 2 vezes):
Mude de abordagem. Ofereça a foto de teste ou o downsell. Se ainda assim não avançar:
"Entendo que pode não ser o momento certo agora. Se quiser, posso te mandar alguns exemplos do nosso trabalho para você salvar e ver com calma — sem compromisso nenhum."

Se o lead fizer perguntas técnicas sobre ferramentas de IA:
"Esse nível de detalhe técnico fica melhor com nossa equipe de criação. Posso te passar o contato direto ou agendar uma conversa mais detalhada?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Nunca invente preços diferentes dos listados acima
- Nunca prometa prazo menor que 24h
- Nunca use mais de 1 gatilho por mensagem
- Nunca repita pergunta que o lead já respondeu
- Nunca envie mais de 2 follow-ups sem resposta
- Nunca ofereça foto de teste mais de uma vez por lead
- Se não souber responder algo: "Vou verificar com nossa equipe e já te retorno"
- Sempre termine com pergunta ou call-to-action — nunca mensagem sem próximo passo
- Adapte o nível de formalidade ao tom do cliente — se ele for informal, seja informal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO DO LEAD (variáveis dinâmicas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use as informações abaixo para personalizar cada conversa:

Nome: {lead_name}
Track: {lead_track} (servico | aprender | null)
Source: {lead_source}
Emails enviados: {emails_sent} (lista de email_keys com status sent)
Última atividade: {last_activity}
Histórico da conversa: {conversation_history}

Se emails_sent contiver emails da sequência, use esse contexto:
- Se recebeu lead-metodo-aprender → "Vi que você recebeu o mini-método..."
- Se recebeu lead-pack-oferta → "Vi que você viu o Pack Editorial..."
- Se recebeu lead-briefing-servico → "Vi que você recebeu nossa proposta por email..."

Nunca mencione que é um sistema automático. Fale como se você acompanhasse o lead pessoalmente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { conversationId, inboundMessage } = await req.json();

    if (!conversationId || !inboundMessage) {
      return new Response(JSON.stringify({ error: "Missing conversationId or inboundMessage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get conversation context
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*, leads(*)")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HANDOFF GATE: se já entregou para o CEO, Luna não responde mais.
    if (conversation.handoff_status && conversation.handoff_status !== "luna") {
      console.log(`[sales-agent] handoff=${conversation.handoff_status} → silenciada (conv ${conversationId})`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "handoff_active", handoff_status: conversation.handoff_status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent message history (last 20 messages)
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build conversation history for AI
    const chatHistory = (messages || []).map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));

    // Fetch emails sent to this lead (for prompt personalization)
    const lead = (conversation as any).leads;
    let emailsSentList = "nenhum";
    if (lead?.id) {
      const { data: emailRows } = await supabase
        .from("lead_email_schedule")
        .select("email_key")
        .eq("lead_id", lead.id)
        .eq("status", "sent");
      if (emailRows && emailRows.length > 0) {
        emailsSentList = emailRows.map((r: any) => r.email_key).join(", ");
      }
    }

    // Build conversation history string for prompt injection
    const conversationHistoryStr = chatHistory.length
      ? chatHistory
          .map((m) => `${m.role === "user" ? "Lead" : "Luna"}: ${m.content}`)
          .join("\n")
      : "(primeira mensagem da conversa)";

    // Inject dynamic variables into SYSTEM_PROMPT
    const personalizedPrompt = SYSTEM_PROMPT
      .replace("{lead_name}", lead?.name || "(desconhecido)")
      .replace("{lead_track}", lead?.track || "null")
      .replace("{lead_source}", lead?.source || "(não informado)")
      .replace("{emails_sent}", emailsSentList)
      .replace("{last_activity}", conversation.last_message_at || "(sem atividade prévia)")
      .replace("{conversation_history}", conversationHistoryStr);

    // Extra runtime context (não substitui o prompt-base, complementa)
    let contextInfo = "";
    if (conversation.context_summary) {
      contextInfo += `\n\nResumo do contexto: ${conversation.context_summary}`;
    }
    contextInfo += `\nEstágio atual: ${conversation.stage}`;
    contextInfo += `\nStatus: ${conversation.status}`;

    // Call AI
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: personalizedPrompt + contextInfo },
          ...chatHistory,
          { role: "user", content: inboundMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error [${aiResponse.status}]: ${JSON.stringify(aiData)}`);
    }

    let reply = aiData.choices?.[0]?.message?.content || "";
    if (!reply) reply = "Desculpe, não consegui processar sua mensagem. Vou encaminhar para nossa equipe.";

    // Update context summary with AI (lightweight)
    const newSummary = conversation.context_summary
      ? `${conversation.context_summary}\nCliente: ${inboundMessage.substring(0, 100)}\nVelora: ${reply.substring(0, 100)}`
      : `Cliente: ${inboundMessage.substring(0, 100)}\nVelora: ${reply.substring(0, 100)}`;

    // Detect stage changes based on keywords
    let newStage = conversation.stage;
    const lowerReply = reply.toLowerCase();
    const lowerMsg = inboundMessage.toLowerCase();
    if (conversation.stage === "greeting" && (lowerMsg.includes("marca") || lowerMsg.includes("produto") || lowerReply.includes("conte-me"))) {
      newStage = "discovery";
    } else if (conversation.stage === "discovery" && (lowerReply.includes("recomendo") || lowerReply.includes("sugiro"))) {
      newStage = "proposal";
    } else if (lowerReply.includes("r$") || lowerReply.includes("valor") || lowerReply.includes("preço")) {
      if (conversation.stage === "proposal") newStage = "closing";
    }

    // ════════════════════════════════════════════
    // DETECTAR FECHAMENTO → GERAR BRIEFING → HANDOFF
    // ════════════════════════════════════════════
    // Heurística: cliente sinaliza pagamento OU manda comprovante OU confirma fechamento.
    const closingSignals = [
      "paguei", "pago", "pagamento feito", "ja paguei", "já paguei",
      "comprovante", "transferi", "fiz o pix", "fiz pix", "pix feito",
      "fechado", "pode mandar", "vamos fechar", "fechei",
    ];
    const isMediaInbound = inboundMessage.startsWith("[mídia") || inboundMessage.startsWith("[image") || inboundMessage.startsWith("[media");
    const looksLikePayment = closingSignals.some((kw) => lowerMsg.includes(kw)) || (isMediaInbound && conversation.stage === "closing");

    let didHandoff = false;
    if (looksLikePayment) {
      try {
        const briefingPrompt = `Você é um assistente que extrai dados estruturados de conversas de venda.
Com base na conversa abaixo entre Luna (vendedora da Velora) e o cliente, gere APENAS um JSON válido (sem markdown, sem texto antes/depois) com este schema:
{
  "nome": string,
  "marca": string,
  "segmento": string,
  "pacote": string,         // "Essencial" | "Impacto" | "Campanha Completa" | "Personalizado"
  "valor": string,           // ex: "R$ 247"
  "prazo": string,           // ex: "48h", "urgente"
  "publico_alvo": string,
  "referencias": string,     // estilos/marcas que citou
  "objetivo": string,        // o que vai usar/lançar
  "pix_pago": boolean,       // true se cliente confirmou pagamento
  "observacoes": string      // qualquer detalhe extra relevante
}
Se algum campo não for conhecido, use "" (string vazia) ou false (boolean).

Conversa:
${conversationHistoryStr}
Lead: ${inboundMessage}
`;
        const briefingRes = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: briefingPrompt }],
            max_tokens: 600,
            temperature: 0.2,
          }),
        });
        const briefingData = await briefingRes.json();
        const rawBriefing = briefingData.choices?.[0]?.message?.content || "";
        // Extrair JSON (remove eventual cerca markdown)
        const jsonMatch = rawBriefing.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const briefing = JSON.parse(jsonMatch[0]);
          await supabase
            .from("conversations")
            .update({
              briefing,
              handoff_status: "ceo_pending",
              handoff_at: new Date().toISOString(),
              status: "closed_won",
              stage: "closing",
            })
            .eq("id", conversationId);
          didHandoff = true;
          // Substitui resposta da Luna pela mensagem de handoff
          reply = `Perfeito! ${briefing.nome ? briefing.nome.split(" ")[0] : ""}, vou te conectar agora com o André, nosso diretor criativo, que cuida pessoalmente da execução. Ele te chama por aqui em instantes 🤝`;
        }
      } catch (e) {
        console.error("[sales-agent] briefing generation failed:", e);
      }
    }

    // Update conversation (skip se acabamos de fazer handoff — já foi atualizado acima)
    if (!didHandoff) {
      await supabase
        .from("conversations")
        .update({
          context_summary: newSummary.substring(0, 2000),
          stage: newStage,
          status: conversation.status === "new" ? "active" : conversation.status,
          last_message_at: new Date().toISOString(),
          next_follow_up_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", conversationId);

      // Schedule follow-up if needed
      if (newStage !== "closing") {
        await supabase.from("follow_up_schedule").insert({
          conversation_id: conversationId,
          scheduled_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          type: "check_in",
          message_content: null,
        });
      }
    }

    return new Response(JSON.stringify({ reply, stage: newStage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sales-agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
