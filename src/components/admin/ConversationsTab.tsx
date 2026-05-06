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

  // Mobile-first: show list OR chat
  if (selectedConv && selectedConvData) {
    return (
      <div className="border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
        {/* Chat header */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSelectedConv(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {selectedConvData.leads?.name || "Desconhecido"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{selectedConvData.whatsapp_number}</span>
              <Badge variant="outline" className="text-[10px] ml-1">
                {stageLabels[selectedConvData.stage] || selectedConvData.stage}
              </Badge>
              <Badge className={`text-[10px] ${statusColors[selectedConvData.status] || ""}`}>
                {selectedConvData.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchMessages(selectedConv)}>
            <RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Messages area */}
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
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.direction === "outbound"
                          ? "bg-primary/20 text-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-[10px] font-medium mb-1 opacity-60">
                        {msg.direction === "outbound" ? "Velora" : "Lead"}
                      </p>
                      {isTemplate ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            Template
                          </Badge>
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

        {/* Context summary */}
        {selectedConvData.context_summary && (
          <div className="border-t border-border bg-card/50 px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Resumo do contexto</p>
            <p className="text-xs text-muted-foreground line-clamp-3">{selectedConvData.context_summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
