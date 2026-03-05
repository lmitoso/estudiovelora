import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Search, ChevronDown, ChevronUp, ArrowLeft, Lock } from "lucide-react";
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  generation_failed: "bg-destructive/20 text-destructive border-destructive/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  queued: "bg-muted text-muted-foreground border-border",
};

const STATUS_FILTERS = ["todos", "pending", "paid", "processing", "completed", "generation_failed"];

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [generations, setGenerations] = useState<Record<string, Generation[]>>({});
  const [retrying, setRetrying] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });
      if (res.error) throw res.error;
      if (res.data?.valid) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
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
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar pedidos", description: error.message, variant: "destructive" });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchGenerations = async (orderId: string) => {
    if (generations[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setGenerations((prev) => ({ ...prev, [orderId]: data || [] }));
    setExpandedOrder(orderId);
  };

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      const res = await supabase.functions.invoke("retry-generations", {
        body: { orderId },
      });
      if (res.error) throw res.error;
      toast({ title: "Retry iniciado", description: `Pedido ${orderId.slice(0, 8)}... em reprocessamento.` });
      // Refresh generations
      const { data } = await supabase.from("generations").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      setGenerations((prev) => ({ ...prev, [orderId]: data || [] }));
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

  // Customers aggregation
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

  // Dashboard metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status !== "pending").length;
    const failed = orders.filter((o) => o.status === "generation_failed").length;
    const revenue = orders.filter((o) => o.status !== "pending").reduce((s, o) => s + Number(o.total_price), 0);
    return { total, paid, failed, revenue, customers: customers.length };
  }, [orders, customers]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
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
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Painel Admin
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Pedidos", value: metrics.total },
            { label: "Pagos", value: metrics.paid },
            { label: "Falhados", value: metrics.failed },
            { label: "Receita", value: `R$ ${metrics.revenue.toFixed(2)}` },
            { label: "Clientes", value: metrics.customers },
          ].map((m) => (
            <div key={m.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pedidos">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          {/* PEDIDOS TAB */}
          <TabsContent value="pedidos" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail, marca ou WhatsApp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className="capitalize text-xs"
                  >
                    {s === "todos" ? "Todos" : s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                    <TableHead className="hidden md:table-cell">Marca</TableHead>
                    <TableHead className="hidden lg:table-cell">Modelo</TableHead>
                    <TableHead className="hidden lg:table-cell">Qtd</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        Nenhum pedido encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((order) => (
                      <>
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => fetchGenerations(order.id)}
                        >
                          <TableCell>
                            {expandedOrder === order.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{order.customer_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{order.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {order.whatsapp || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{order.brand_name}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm capitalize">{order.model_type}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {order.photos_qty}F {order.videos_qty}V
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {Number(order.total_price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>
                              {order.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(order.status === "generation_failed") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                disabled={retrying === order.id}
                                onClick={(e) => { e.stopPropagation(); handleRetry(order.id); }}
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${retrying === order.id ? "animate-spin" : ""}`} />
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedOrder === order.id && (
                          <TableRow key={`${order.id}-detail`}>
                            <TableCell colSpan={10} className="bg-card/50 p-4">
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
                                        <a href={g.output_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                                          Ver resultado
                                        </a>
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
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* CLIENTES TAB */}
          <TabsContent value="clientes">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total gasto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.email}>
                        <TableCell className="font-medium">{c.name || "—"}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.whatsapp || "—"}</TableCell>
                        <TableCell>{c.orders}</TableCell>
                        <TableCell className="font-medium">R$ {c.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
