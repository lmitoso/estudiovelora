import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, Lock, LogOut, Download, Users, MessageSquare, Phone, Mail, Calendar, Send } from "lucide-react";
import ConversationsTab from "@/components/admin/ConversationsTab";
import EmailsTab from "@/components/admin/EmailsTab";
import { useNavigate } from "react-router-dom";
import { downloadCsv } from "@/lib/exportCsv";
import { ensureNotificationPermission, notifyIncomingMessage } from "@/lib/notifications";

type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  source: string | null;
  created_at: string;
};

export default function Admin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (pwd?: string) => {
    const loginPassword = pwd || password;
    if (!loginPassword) return;
    setAuthLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-admin`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ password: loginPassword }),
      });
      if (!response.ok) throw new Error(`Servidor retornou ${response.status}`);
      const data = await response.json();
      if (data?.valid) {
        setPassword(loginPassword);
        setAuthenticated(true);
        sessionStorage.setItem("admin_pwd", btoa(loginPassword));
      } else {
        sessionStorage.removeItem("admin_pwd");
        toast({ title: "Senha incorreta", variant: "destructive" });
      }
    } catch (err: any) {
      sessionStorage.removeItem("admin_pwd");
      toast({ title: "Erro na verificação", description: err.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pwd");
    if (stored) {
      try { handleLogin(atob(stored)); } catch { sessionStorage.removeItem("admin_pwd"); }
    }
  }, []);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "leads" },
      });
      if (res.error) throw res.error;
      setLeads(res.data?.data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar leads", description: err.message, variant: "destructive" });
    }
    setLeadsLoading(false);
  };

  useEffect(() => {
    if (authenticated) {
      fetchLeads();
      ensureNotificationPermission();
    }
  }, [authenticated]);

  // Realtime: notifications for leads, conversations, messages
  useEffect(() => {
    if (!authenticated) return;
    const channel = supabase
      .channel("admin-realtime-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new as any;
        notifyIncomingMessage({
          title: "🌱 Novo lead",
          body: `${lead?.name || "Sem nome"}${lead?.email ? ` · ${lead.email}` : ""}`,
        });
        fetchLeads();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => fetchLeads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
        const c = payload.new as any;
        notifyIncomingMessage({
          title: "💬 Nova conversa",
          body: `Lead respondeu: ${c?.whatsapp_number || ""}`,
          conversationId: c?.id,
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, (payload) => {
        const newConv = payload.new as any;
        const oldConv = payload.old as any;
        if (newConv?.handoff_status === "ceo_pending" && oldConv?.handoff_status !== "ceo_pending") {
          const b = newConv?.briefing || {};
          notifyIncomingMessage({
            title: "🎯 Cliente fechado — briefing pronto",
            body: `${b.nome || newConv.whatsapp_number}${b.pacote ? ` · ${b.pacote}` : ""}${b.valor ? ` · ${b.valor}` : ""}`,
            conversationId: newConv?.id,
          });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg?.direction === "inbound") {
          notifyIncomingMessage({
            title: "✉️ Nova mensagem WhatsApp",
            body: typeof msg.content === "string" ? msg.content.slice(0, 140) : "Você recebeu uma nova mensagem.",
            conversationId: msg.conversation_id,
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authenticated]);

  const exportLeadsCsv = () => {
    downloadCsv(
      `velora-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Data", "Nome", "Email", "WhatsApp", "Fonte"],
      leads.map((l) => [
        new Date(l.created_at).toLocaleDateString("pt-BR"),
        l.name,
        l.email,
        l.whatsapp || "",
        l.source || "",
      ]),
    );
    toast({ title: "CSV exportado com sucesso!" });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-8 w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <Lock className="h-10 w-10 mx-auto text-primary" />
            <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Painel Admin
            </h1>
            <p className="text-sm text-muted-foreground">Digite a senha para acessar</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={authLoading || !password}>
              {authLoading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg sm:text-2xl font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
            Painel CRM
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={fetchLeads} disabled={leadsLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${leadsLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1.5">Atualizar</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3" onClick={() => { sessionStorage.removeItem("admin_pwd"); setAuthenticated(false); setPassword(""); }}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1.5">Sair</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Tabs defaultValue="leads">
          <TabsList className="bg-card border border-border w-full grid grid-cols-3">
            <TabsTrigger value="leads" className="text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="conversas" className="text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Conversas
            </TabsTrigger>
            <TabsTrigger value="emails" className="text-xs sm:text-sm">
              <Send className="h-3.5 w-3.5 mr-1" />
              Emails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversas">
            <ConversationsTab password={password} />
          </TabsContent>

          <TabsContent value="emails">
            <EmailsTab password={password} />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={exportLeadsCsv}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {leadsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum lead capturado ainda.</div>
            ) : (
              <>
                <div className="grid gap-2.5 md:hidden">
                  {leads.map((l) => (
                    <div key={l.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{l.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            {l.email}
                          </p>
                        </div>
                        <Badge className="text-[10px] shrink-0 bg-primary/20 text-primary border-primary/30">
                          {l.source || "campanha"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(l.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        {l.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {l.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-card border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nome</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">E-mail</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">WhatsApp</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Fonte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(l.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">{l.name}</td>
                          <td className="px-4 py-3 text-sm">{l.email}</td>
                          <td className="px-4 py-3 text-sm">{l.whatsapp || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">{l.source || "campanha"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
