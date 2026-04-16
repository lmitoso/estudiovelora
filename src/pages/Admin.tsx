import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Search, ChevronDown, ChevronUp, ArrowLeft, Lock, LogOut, Download, Users, MessageSquare, Phone, Mail, Calendar, ShoppingBag, DollarSign } from "lucide-react";
import ConversationsTab from "@/components/admin/ConversationsTab";
import { useNavigate } from "react-router-dom";

type Order = {
  id: string;
  created_at: string;
  customer_name: string | null;
  email: string;
  whatsapp: string | null;
  brand_name: string;
  brand_description: string | null;
  campaign_goal: string | null;
  piece_description: string | null;
  model_type: string;
  photos_qty: number;
  videos_qty: number;
  total_price: number;
  status: string;
};

type Generation = {
  id: string;
  type: string;
  status: string;
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  source: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  generation_failed: "bg-destructive/20 text-destructive border-destructive/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  queued: "bg-muted text-muted-foreground border-border",
  lead: "bg-primary/20 text-primary border-primary/30",
};

const STATUS_FILTERS = ["todos", "pending", "paid", "processing", "completed", "generation_failed", "lead"];

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Record<string, Generation[]>>({});
  const [retrying, setRetrying] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (pwd?: string) => {
    const loginPassword = pwd || password;
    if (!loginPassword) return;
    setAuthLoading(true);
    try {
      const res = await supabase.functions.invoke("verify-admin", {
        body: { password: loginPassword },
      });
      if (res.error) throw res.error;
      if (res.data?.valid) {
        setPassword(loginPassword);
        setAuthenticated(true);
        sessionStorage.setItem("admin_pwd", btoa(loginPassword));
      } else {
        toast({ title: "Senha incorreta", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na verificação", description: err.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pwd");
    if (stored) {
      try {
        handleLogin(atob(stored));
      } catch {
        sessionStorage.removeItem("admin_pwd");
      }
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "orders" },
      });
      if (res.error) throw res.error;
      setOrders(res.data?.data || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar pedidos", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

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
      fetchOrders();
      fetchLeads();
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authenticated]);

  const fetchGenerations = async (orderId: string) => {
    if (generations[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "generations", orderId },
      });
      if (res.error) throw res.error;
      setGenerations((prev) => ({ ...prev, [orderId]: res.data?.data || [] }));
      setExpandedOrder(orderId);
    } catch (err: any) {
      toast({ title: "Erro ao carregar gerações", description: err.message, variant: "destructive" });
    }
  };

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      const res = await supabase.functions.invoke("retry-generations", {
        body: { orderId, adminPassword: password },
      });
      if (res.error) throw res.error;
      toast({ title: "Retry iniciado", description: `Pedido ${orderId.slice(0, 8)}... em reprocessamento.` });
      const genRes = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "generations", orderId },
      });
      setGenerations((prev) => ({ ...prev, [orderId]: genRes.data?.data || [] }));
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Erro no retry", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setRetrying(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "todos" || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (o.customer_name?.toLowerCase().includes(q)) ||
        o.email.toLowerCase().includes(q) ||
        o.brand_name.toLowerCase().includes(q) ||
        (o.whatsapp?.includes(q));
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  const customers = useMemo(() => {
    const map: Record<string, { name: string | null; whatsapp: string | null; email: string; orders: number; total: number }> = {};
    orders.forEach((o) => {
      if (!map[o.email]) {
        map[o.email] = { name: o.customer_name, whatsapp: o.whatsapp, email: o.email, orders: 0, total: 0 };
      }
      map[o.email].orders++;
      map[o.email].total += Number(o.total_price);
      if (o.customer_name && !map[o.email].name) map[o.email].name = o.customer_name;
      if (o.whatsapp && !map[o.email].whatsapp) map[o.email].whatsapp = o.whatsapp;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [orders]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status !== "pending").length;
    const failed = orders.filter((o) => o.status === "generation_failed").length;
    const revenue = orders.filter((o) => o.status !== "pending").reduce((s, o) => s + Number(o.total_price), 0);
    return { total, paid, failed, revenue, customers: customers.length, leads: leads.length };
  }, [orders, customers, leads]);

  const exportCSV = (type: "pedidos" | "clientes" | "leads") => {
    let csv = "";
    if (type === "pedidos") {
      csv = "Data,Nome,Email,WhatsApp,Marca,Modelo,Fotos,Videos,Valor,Status\n";
      filtered.forEach((o) => {
        csv += `${new Date(o.created_at).toLocaleDateString("pt-BR")},"${o.customer_name || ""}","${o.email}","${o.whatsapp || ""}","${o.brand_name}","${o.model_type}",${o.photos_qty},${o.videos_qty},${Number(o.total_price).toFixed(2)},${o.status}\n`;
      });
    } else if (type === "clientes") {
      csv = "Nome,Email,WhatsApp,Pedidos,Total Gasto\n";
      customers.forEach((c) => {
        csv += `"${c.name || ""}","${c.email}","${c.whatsapp || ""}",${c.orders},${c.total.toFixed(2)}\n`;
      });
    } else {
      csv = "Data,Nome,Email,WhatsApp,Fonte\n";
      leads.forEach((l) => {
        csv += `${new Date(l.created_at).toLocaleDateString("pt-BR")},"${l.name}","${l.email}","${l.whatsapp || ""}","${l.source || ""}"\n`;
      });
    }
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velora-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={() => { fetchOrders(); fetchLeads(); }} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1.5">Atualizar</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3" onClick={() => { sessionStorage.removeItem("admin_pwd"); setAuthenticated(false); setPassword(""); }}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1.5">Sair</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
          {[
            { label: "Leads", value: metrics.leads },
            { label: "Pedidos", value: metrics.total },
            { label: "Pagos", value: metrics.paid },
            { label: "Falhados", value: metrics.failed },
            { label: "Receita", value: `R$ ${metrics.revenue.toFixed(0)}` },
            { label: "Clientes", value: metrics.customers },
          ].map((m) => (
            <div key={m.label} className="bg-card border border-border rounded-lg p-2.5 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="bg-card border border-border w-full justify-start overflow-x-auto">
            <TabsTrigger value="leads" className="text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="conversas" className="text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Conversas
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="text-xs sm:text-sm">Pedidos</TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs sm:text-sm">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="conversas">
            <ConversationsTab password={password} />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV("leads")}>
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

          <TabsContent value="pedidos" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCSV("pedidos")} className="shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
                  {s === "todos" ? "Todos" : s.replace("_", " ")}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum pedido encontrado.</div>
            ) : (
              <>
                <div className="grid gap-2.5 md:hidden">
                  {filtered.map((order) => (
                    <div key={order.id} className="bg-card border border-border rounded-lg overflow-hidden">
                      <div
                        className="p-3 cursor-pointer active:bg-muted/20"
                        onClick={() => fetchGenerations(order.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{order.customer_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.email}</p>
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${statusColors[order.status] || ""}`}>
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-foreground font-medium">
                              R$ {Number(order.total_price).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{order.brand_name}</span>
                            {expandedOrder === order.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="capitalize">{order.model_type}</span>
                          <span>{order.photos_qty}F {order.videos_qty}V</span>
                          {order.whatsapp && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {order.whatsapp}
                            </span>
                          )}
                        </div>
                      </div>
                      {expandedOrder === order.id && (
                        <div className="border-t border-border bg-card/50 p-3 space-y-3">
                          <div className="space-y-1.5 text-xs">
                            <p><span className="text-muted-foreground">Marca:</span> {order.brand_description || "—"}</p>
                            <p><span className="text-muted-foreground">Campanha:</span> {order.campaign_goal || "—"}</p>
                            <p><span className="text-muted-foreground">Peça:</span> {order.piece_description || "—"}</p>
                          </div>
                          {order.status === "generation_failed" && (
                            <Button variant="outline" size="sm" className="text-xs w-full" disabled={retrying === order.id} onClick={() => handleRetry(order.id)}>
                              <RefreshCw className={`h-3 w-3 mr-1 ${retrying === order.id ? "animate-spin" : ""}`} />
                              Retry
                            </Button>
                          )}
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Gerações</p>
                          {generations[order.id]?.length ? (
                            <div className="space-y-2">
                              {generations[order.id].map((g) => (
                                <div key={g.id} className="flex items-center gap-2 bg-background border border-border rounded-md p-2.5 text-xs flex-wrap">
                                  <Badge className={`text-[10px] ${statusColors[g.status] || ""}`}>{g.status}</Badge>
                                  <span className="capitalize text-muted-foreground">{g.type}</span>
                                  {g.output_url && (
                                    <a href={g.output_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-[10px]">Ver</a>
                                  )}
                                  {g.error_message && (
                                    <span className="text-destructive text-[10px] break-all">{g.error_message}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Nenhuma geração encontrada.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden md:block border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-card border-b border-border">
                        <th className="w-8 px-3 py-3"></th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Data</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Cliente</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">WhatsApp</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Marca</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 hidden lg:table-cell">Modelo</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 hidden lg:table-cell">Qtd</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Valor</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                        <th className="w-20 px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((order) => (
                        <>
                          <tr key={order.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => fetchGenerations(order.id)}>
                            <td className="px-3 py-3">
                              {expandedOrder === order.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </td>
                            <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-sm">{order.customer_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{order.email}</p>
                            </td>
                            <td className="px-3 py-3 text-sm">{order.whatsapp || "—"}</td>
                            <td className="px-3 py-3 text-sm">{order.brand_name}</td>
                            <td className="px-3 py-3 text-sm capitalize hidden lg:table-cell">{order.model_type}</td>
                            <td className="px-3 py-3 text-sm hidden lg:table-cell">{order.photos_qty}F {order.videos_qty}V</td>
                            <td className="px-3 py-3 text-sm font-medium">R$ {Number(order.total_price).toFixed(2)}</td>
                            <td className="px-3 py-3">
                              <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>{order.status.replace("_", " ")}</Badge>
                            </td>
                            <td className="px-3 py-3">
                              {order.status === "generation_failed" && (
                                <Button variant="outline" size="sm" className="text-xs" disabled={retrying === order.id} onClick={(e) => { e.stopPropagation(); handleRetry(order.id); }}>
                                  <RefreshCw className={`h-3 w-3 mr-1 ${retrying === order.id ? "animate-spin" : ""}`} />
                                  Retry
                                </Button>
                              )}
                            </td>
                          </tr>
                          {expandedOrder === order.id && (
                            <tr key={`${order.id}-detail`}>
                              <td colSpan={10} className="bg-card/50 p-4">
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Descrição da marca:</span> {order.brand_description || "—"}</p>
                                    <p><span className="text-muted-foreground">Objetivo da campanha:</span> {order.campaign_goal || "—"}</p>
                                    <p><span className="text-muted-foreground">Descrição da peça:</span> {order.piece_description || "—"}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Gerações</p>
                                {generations[order.id]?.length ? (
                                  <div className="space-y-2">
                                    {generations[order.id].map((g) => (
                                      <div key={g.id} className="flex items-center gap-3 bg-background border border-border rounded-md p-3 text-sm">
                                        <Badge className={`text-[10px] ${statusColors[g.status] || ""}`}>{g.status}</Badge>
                                        <span className="capitalize text-muted-foreground">{g.type}</span>
                                        {g.output_url && (
                                          <a href={g.output_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Ver resultado</a>
                                        )}
                                        {g.error_message && (
                                          <span className="text-destructive text-xs truncate max-w-xs">{g.error_message}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Nenhuma geração encontrada.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="clientes" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportCSV("clientes")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado.</div>
            ) : (
              <>
                <div className="grid gap-2.5 md:hidden">
                  {customers.map((c) => (
                    <div key={c.email} className="bg-card border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{c.name || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            {c.email}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-primary shrink-0">R$ {c.total.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {c.orders} pedido{c.orders > 1 ? "s" : ""}
                        </span>
                        {c.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.whatsapp}
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
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nome</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">E-mail</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">WhatsApp</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pedidos</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Total gasto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.email} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                          <td className="px-4 py-3">{c.email}</td>
                          <td className="px-4 py-3">{c.whatsapp || "—"}</td>
                          <td className="px-4 py-3">{c.orders}</td>
                          <td className="px-4 py-3 font-medium">R$ {c.total.toFixed(2)}</td>
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
