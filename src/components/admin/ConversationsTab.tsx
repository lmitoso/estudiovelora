import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

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

export default function ConversationsTab({ password }: { password: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

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
    if (messages[convId]) {
      setExpandedConv(expandedConv === convId ? null : convId);
      return;
    }
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "conversation_messages", orderId: convId },
      });
      if (res.error) throw res.error;
      setMessages((prev) => ({ ...prev, [convId]: res.data?.data || [] }));
      setExpandedConv(convId);
    } catch (err: any) {
      toast({ title: "Erro ao carregar mensagens", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchConversations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-card">
              <TableHead className="w-8"></TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Estágio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último contato</TableHead>
              <TableHead>Msgs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhuma conversa ainda.
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conv) => (
                <>
                  <TableRow key={conv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => fetchMessages(conv.id)}>
                    <TableCell>
                      {expandedConv === conv.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{conv.leads?.name || "Desconhecido"}</p>
                        <p className="text-xs text-muted-foreground">{conv.leads?.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{conv.whatsapp_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {stageLabels[conv.stage] || conv.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[conv.status] || ""}`}>
                        {conv.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {conv.conversation_messages?.[0]?.count || 0}
                    </TableCell>
                  </TableRow>
                  {expandedConv === conv.id && messages[conv.id] && (
                    <TableRow key={`${conv.id}-msgs`}>
                      <TableCell colSpan={7} className="bg-card/50 p-4">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                          {messages[conv.id].length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhuma mensagem.</p>
                          ) : (
                            messages[conv.id].map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                                    msg.direction === "outbound"
                                      ? "bg-primary/20 text-foreground"
                                      : "bg-muted text-foreground"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(msg.created_at).toLocaleString("pt-BR")}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
