import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, ChevronLeft, RefreshCw, Phone, User, Clock, Download, Send, AlertTriangle } from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";

type Conversation = {
  id: string;
  whatsapp_number: string;
  status: string;
  stage: string;
  context_summary: string | null;
  last_message_at: string | null;
  created_at: string;
  handoff_status?: string | null;
  handoff_at?: string | null;
  last_followup_at?: string | null;
  briefing?: any;
  leads: { name: string; email: string } | null;
  conversation_messages: { count: number }[];
};

type Message = {
  id: string;
  direction: string;
  content: string;
  message_type: string;
  created_at: string;
};

const stageLabels: Record<string, string> = {
  greeting: "Saudação",
  discovery: "Descoberta",
  proposal: "Proposta",
  follow_up: "Follow-up",
  closing: "Fechamento",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  negotiating: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  closed_won: "bg-primary/20 text-primary border-primary/30",
  closed_lost: "bg-destructive/20 text-destructive border-destructive/30",
};

const handoffBadge: Record<string, { label: string; cls: string }> = {
  luna: { label: "🤖 Luna", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  ceo_pending: { label: "🔥 Aguardando você", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  ceo_active: { label: "👤 Você ativo", cls: "bg-primary/20 text-primary border-primary/40" },
};

// Mapeia SIDs de templates Twilio aprovados para descrições humanizadas
const templateLabels: Record<string, string> = {
  HX909aba526ab38743bc5b43b321599c90: "Mensagem de boas-vindas Velora",
};

// Renderiza conteúdo da mensagem: se for um template bruto [template:HX...],
// substitui pelo nome humanizado do template.
function renderMessageContent(content: string): { text: string; isTemplate: boolean } {
  const match = content.match(/^\[template:(HX[a-zA-Z0-9]+)\]$/);
  if (match) {
    const sid = match[1];
    return {
      text: templateLabels[sid] || "Mensagem de template aprovado",
      isTemplate: true,
    };
  }
  return { text: content, isTemplate: false };
}

export default function ConversationsTab({ password }: { password: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "conversations" },
      });
      if (res.error) throw res.error;
      setConversations(res.data?.data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar conversas", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "conversation_messages", orderId: convId },
      });
      if (res.error) throw res.error;
      setMessages((prev) => ({ ...prev, [convId]: res.data?.data || [] }));
    } catch (err: any) {
      toast({ title: "Erro ao carregar mensagens", description: err.message, variant: "destructive" });
    }
    setMessagesLoading(false);
  };

  const openConversation = (convId: string) => {
    setSelectedConv(convId);
    fetchMessages(convId);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Realtime: listen for new messages and conversation updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages" }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.conversation_id) {
          // Update messages if this conversation is currently open
          setMessages((prev) => {
            if (!prev[newMsg.conversation_id]) return prev;
            const exists = prev[newMsg.conversation_id].some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return {
              ...prev,
              [newMsg.conversation_id]: [...prev[newMsg.conversation_id], newMsg],
            };
          });
          // Also refresh conversations list for updated counts
          fetchConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [password]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConv]);

  const selectedConvData = conversations.find((c) => c.id === selectedConv);
  const selectedMessages = selectedConv ? messages[selectedConv] || [] : [];

  const lastInboundAt = useMemo(() => {
    const inbound = [...selectedMessages].reverse().find((m) => m.direction === "inbound");
    return inbound ? new Date(inbound.created_at) : null;
  }, [selectedMessages]);
  const within24h = lastInboundAt ? (Date.now() - lastInboundAt.getTime()) < 24 * 60 * 60 * 1000 : false;

  const exportConversationCsv = () => {
    if (!selectedConvData) return;
    const name = selectedConvData.leads?.name || selectedConvData.whatsapp_number;
    downloadCsv(
      `velora-conversa-${name}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Data", "Direção", "Tipo", "Conteúdo"],
      selectedMessages.map((m) => [
        new Date(m.created_at).toLocaleString("pt-BR"),
        m.direction === "outbound" ? "Velora" : "Lead",
        m.message_type,
        renderMessageContent(m.content).text,
      ]),
    );
    toast({ title: "Conversa exportada" });
  };

  const exportAllConversationsCsv = () => {
    downloadCsv(
      `velora-conversas-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Criada em", "Última msg", "Lead", "E-mail", "WhatsApp", "Etapa", "Status", "Mensagens", "Resumo"],
      conversations.map((c) => [
        new Date(c.created_at).toLocaleString("pt-BR"),
        c.last_message_at ? new Date(c.last_message_at).toLocaleString("pt-BR") : "",
        c.leads?.name || "",
        c.leads?.email || "",
        c.whatsapp_number,
        stageLabels[c.stage] || c.stage,
        c.status,
        c.conversation_messages?.[0]?.count ?? 0,
        c.context_summary || "",
      ]),
    );
    toast({ title: "Conversas exportadas" });
  };

  const sendManualMessage = async () => {
    if (!draft.trim() || !selectedConv || !selectedConvData) return;
    const isCeoActive = selectedConvData.handoff_status === "ceo_active" || selectedConvData.handoff_status === "ceo_pending";
    if (!within24h) {
      toast({
        title: "Janela de 24h expirada",
        description: "A Meta só permite mensagens livres dentro de 24h da última resposta do lead.",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      // Se você assumiu, manda pela função CEO (que silencia a Luna). Senão, fluxo padrão.
      const fnName = isCeoActive ? "conversation-send-message" : "whatsapp-send";
      const body = isCeoActive
        ? { adminPassword: password, conversationId: selectedConv, content: draft.trim() }
        : { to: selectedConvData.whatsapp_number, body: draft.trim(), conversationId: selectedConv };
      const res = await supabase.functions.invoke(fnName, { body });
      if (res.error) throw res.error;
      setDraft("");
      fetchMessages(selectedConv);
      fetchConversations();
    } catch (err: any) {
      toast({ title: "Erro ao enviar mensagem", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const followupBlockedUntil = useMemo(() => {
    if (!selectedConvData?.last_followup_at) return null;
    const next = new Date(selectedConvData.last_followup_at).getTime() + 24 * 60 * 60 * 1000;
    return next > Date.now() ? next : null;
  }, [selectedConvData?.last_followup_at]);

  const sendFollowup = async () => {
    if (!selectedConv) return;
    setSendingFollowup(true);
    try {
      const res = await supabase.functions.invoke("conversation-send-followup", {
        body: { adminPassword: password, conversationId: selectedConv },
      });
      if (res.error) throw res.error;
      toast({ title: "Follow-up enviado!" });
      fetchMessages(selectedConv);
      fetchConversations();
    } catch (err: any) {
      toast({ title: "Erro ao enviar follow-up", description: err.message, variant: "destructive" });
    } finally {
      setSendingFollowup(false);
    }
  };

  const toggleHandoff = async (action: "assume" | "release") => {
    if (!selectedConv) return;
    try {
      const res = await supabase.functions.invoke("conversation-takeover", {
        body: { adminPassword: password, conversationId: selectedConv, action },
      });
      if (res.error) throw res.error;
      toast({
        title: action === "assume" ? "Você assumiu a conversa" : "Conversa devolvida pra Luna",
      });
      fetchConversations();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (selectedConv && selectedConvData) {
    return (
      <div className="border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: "calc(100vh - 240px)", minHeight: 400 }}>
        <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedConv(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {selectedConvData.leads?.name || "Desconhecido"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Phone className="h-3 w-3" />
              <span>{selectedConvData.whatsapp_number}</span>
              <Badge variant="outline" className="text-[10px] ml-1">
                {stageLabels[selectedConvData.stage] || selectedConvData.stage}
              </Badge>
              <Badge className={`text-[10px] ${statusColors[selectedConvData.status] || ""}`}>
                {selectedConvData.status.replace("_", " ")}
              </Badge>
              {(() => {
                const h = selectedConvData.handoff_status || "luna";
                const b = handoffBadge[h] || handoffBadge.luna;
                return <Badge className={`text-[10px] ${b.cls}`}>{b.label}</Badge>;
              })()}
            </div>
          </div>
          {(selectedConvData.handoff_status === "luna" || selectedConvData.handoff_status === "ceo_pending") ? (
            <Button variant="default" size="sm" className="h-8" onClick={() => toggleHandoff("assume")}>
              Assumir
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-8" onClick={() => toggleHandoff("release")}>
              Devolver pra Luna
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={exportConversationCsv} title="Exportar conversa">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchMessages(selectedConv)}>
            <RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {selectedConvData.briefing && (
          <div className="bg-amber-500/5 border-b border-amber-500/30 px-4 py-3 text-xs space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold mb-1">📋 Briefing do cliente</p>
            {Object.entries(selectedConvData.briefing).map(([k, v]) => {
              if (v === "" || v === null || v === undefined || v === false) return null;
              return (
                <p key={k} className="text-muted-foreground">
                  <span className="text-foreground/80 capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                  {typeof v === "boolean" ? "Sim" : String(v)}
                </p>
              );
            })}
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          {messagesLoading && selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Carregando mensagens...
            </div>
          ) : selectedMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhuma mensagem nesta conversa.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedMessages.map((msg) => {
                const { text, isTemplate } = renderMessageContent(msg.content);
                return (
                  <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.direction === "outbound" ? "bg-primary/20 text-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      <p className="text-[10px] font-medium mb-1 opacity-60">
                        {msg.direction === "outbound" ? "Velora" : "Lead"}
                      </p>
                      {isTemplate ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Template</Badge>
                          <p className="italic opacity-90">{text}</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(msg.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {selectedConvData.context_summary && (
          <div className="border-t border-border bg-card/50 px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resumo do contexto</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{selectedConvData.context_summary}</p>
          </div>
        )}

        <div className="border-t border-border bg-card px-3 py-2 space-y-2">
          {!within24h && (
            <div className="flex items-start gap-2 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Janela de 24h expirada. Aguarde o lead responder para enviar texto livre.</span>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendManualMessage(); } }}
              placeholder={within24h ? "Escreva uma mensagem..." : "Janela de 24h expirada"}
              disabled={!within24h || sending}
              className="flex-1"
            />
            <Button onClick={sendManualMessage} disabled={!within24h || sending || !draft.trim()} size="icon">
              <Send className={`h-4 w-4 ${sending ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportAllConversationsCsv} disabled={loading || conversations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" onClick={fetchConversations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando conversas...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma conversa ainda.</p>
          <p className="text-xs mt-1">As conversas aparecerão aqui quando leads responderem no WhatsApp.</p>
        </div>
      ) : (
        <>
        {(() => {
          const pending = conversations.filter((c) => c.handoff_status === "ceo_pending");
          if (pending.length === 0) return null;
          return (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-3 mb-3">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                🔥 Aguardando você ({pending.length})
              </p>
              <div className="grid gap-2">
                {pending.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className="bg-card border border-amber-500/30 rounded-md p-3 cursor-pointer hover:border-amber-500/60 transition-colors"
                  >
                    <p className="font-medium text-sm">{c.leads?.name || c.whatsapp_number}</p>
                    {c.briefing && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.briefing.pacote || ""}{c.briefing.valor ? ` · ${c.briefing.valor}` : ""}{c.briefing.marca ? ` · ${c.briefing.marca}` : ""}
                      </p>
                    )}
                    <p className="text-[10px] text-amber-300 mt-1">Toque para abrir e assumir</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        <div className="grid gap-3">
          {conversations.map((conv) => {
            const msgCount = conv.conversation_messages?.[0]?.count || 0;
            const timeSince = conv.last_message_at
              ? getTimeSince(new Date(conv.last_message_at))
              : null;

            return (
              <div
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.leads?.name || "Desconhecido"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.whatsapp_number}
                        {conv.leads?.email ? ` · ${conv.leads.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {timeSince && (
                      <p className="text-[10px] text-muted-foreground">{timeSince}</p>
                    )}
                    <div className="flex gap-1.5 mt-1 justify-end">
                      <Badge variant="outline" className="text-[10px]">
                        {stageLabels[conv.stage] || conv.stage}
                      </Badge>
                      <Badge className={`text-[10px] ${statusColors[conv.status] || ""}`}>
                        {conv.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{msgCount} mensagens</span>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
