import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Search, Mail, Calendar, Flame } from "lucide-react";

type Temperature = "hot" | "warm" | "cold";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const temperatureBadge = (t: Temperature) => {
  if (t === "hot") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (t === "warm") return "bg-amber-400/20 text-amber-300 border-amber-400/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const temperatureLabel = (t: Temperature) =>
  t === "hot" ? "🔥 Quente" : t === "warm" ? "🌡 Morno" : "❄️ Frio";

const temperatureRank = (t: Temperature) => (t === "hot" ? 0 : t === "warm" ? 1 : 2);

type ScheduleItem = {
  id: string;
  lead_id: string;
  email_key: string;
  status: string;
  send_at: string;
  sent_at: string | null;
  conditional: boolean;
  error_message: string | null;
  created_at: string;
};

type LeadItem = {
  id: string;
  name: string;
  email: string;
  track: string | null;
  unsubscribed: boolean;
  created_at: string;
};

const trackBadge = (track: string | null) => {
  if (track === "aprender") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (track === "servico") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const emailKeyLabels: Record<string, string> = {
  "lead-metodo-aprender": "E1 · Método",
  "lead-manifesto-aprender": "E2 · Manifesto",
  "lead-oportunidade-aprender": "E3 · Oportunidade",
  "lead-urgencia-aprender": "E4 · Urgência",
  "lead-prova-servico": "S1 · Prova",
  "lead-autoridade-servico": "S2 · Autoridade",
  "lead-briefing-servico": "S3 · Briefing",
  "lead-reativacao-servico": "S4 · Reativação",
};

const APRENDER_FINAL_KEY = "lead-urgencia-aprender";

export default function EmailsTab({ password }: { password: string }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tempFilter, setTempFilter] = useState<"all" | Temperature>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-data", {
        body: { adminPassword: password, action: "emails" },
      });
      if (res.error) throw res.error;
      setSchedule(res.data?.data?.schedule || []);
      setLeads(res.data?.data?.leads || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar emails", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Index schedule by lead
  const byLead = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const s of schedule) {
      if (!map[s.lead_id]) map[s.lead_id] = [];
      map[s.lead_id].push(s);
    }
    return map;
  }, [schedule]);

  // Temperature per lead — based on emails with status 'sent' in last 7 days
  const tempByLead = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const map: Record<string, Temperature> = {};
    for (const lead of leads) {
      const items = byLead[lead.id] || [];
      const sent = items.filter((i) => i.status === "sent" && i.sent_at);
      if (sent.length === 0) {
        map[lead.id] = "cold";
        continue;
      }
      const recentCount = sent.filter((i) => new Date(i.sent_at!).getTime() >= cutoff).length;
      if (recentCount >= 3) map[lead.id] = "hot";
      else if (recentCount >= 1) map[lead.id] = "warm";
      else map[lead.id] = "warm"; // has sent but all older than 7d
    }
    return map;
  }, [leads, byLead]);

  // Metrics
  const metrics = useMemo(() => {
    const totalSent = schedule.filter((s) => s.status === "sent").length;
    const scheduled = schedule.filter((s) => s.status === "pending").length;
    const unsubscribed = leads.filter((l) => l.unsubscribed).length;
    const hotCount = leads.filter((l) => tempByLead[l.id] === "hot").length;

    const aprenderLeads = leads.filter((l) => l.track === "aprender");
    const reachedFinal = aprenderLeads.filter((l) => {
      const items = byLead[l.id] || [];
      return items.some((i) => i.email_key === APRENDER_FINAL_KEY && i.status === "sent");
    }).length;
    const finalPct = aprenderLeads.length > 0 ? Math.round((reachedFinal / aprenderLeads.length) * 100) : 0;

    return { totalSent, scheduled, unsubscribed, finalPct, hotCount };
  }, [schedule, leads, byLead, tempByLead]);

  // Filtered leads (by search + temperature) and sorted by temperature
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = leads;
    if (q) {
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      );
    }
    if (tempFilter !== "all") {
      list = list.filter((l) => tempByLead[l.id] === tempFilter);
    }
    return [...list].sort((a, b) => {
      const ra = temperatureRank(tempByLead[a.id] || "cold");
      const rb = temperatureRank(tempByLead[b.id] || "cold");
      if (ra !== rb) return ra - rb;
      return (b.created_at || "").localeCompare(a.created_at || "");
    });
  }, [leads, search, tempFilter, tempByLead]);

  // Recent unsubscribes (last 20, ordered by created_at desc — leads are already desc)
  const recentUnsubs = useMemo(
    () => leads.filter((l) => l.unsubscribed).slice(0, 20),
    [leads]
  );

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR") + " " + new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDateOnly = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total enviado", value: metrics.totalSent },
          { label: "Agendados", value: metrics.scheduled },
          { label: "Cancelados", value: metrics.unsubscribed },
          { label: "Conclusão Track B", value: `${metrics.finalPct}%` },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-2.5 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1" style={{ fontFamily: "var(--font-display)" }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Por lead */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Por lead
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum lead encontrado.</div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Track</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Emails enviados</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Próximo agendado</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l) => {
                  const items = byLead[l.id] || [];
                  const sent = items
                    .filter((i) => i.status === "sent")
                    .sort((a, b) => (a.sent_at || "").localeCompare(b.sent_at || ""));
                  const next = items
                    .filter((i) => i.status === "pending")
                    .sort((a, b) => a.send_at.localeCompare(b.send_at))[0];

                  return (
                    <tr key={l.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {l.name}
                        {l.unsubscribed && (
                          <Badge className="ml-2 text-[10px] bg-destructive/20 text-destructive border-destructive/30">
                            cancelado
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`text-[10px] ${trackBadge(l.track)}`}>
                          {l.track || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {sent.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <ul className="space-y-1">
                            {sent.map((s) => (
                              <li key={s.id} className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{emailKeyLabels[s.email_key] || s.email_key}</span>
                                <span className="text-muted-foreground">· {formatDateOnly(s.sent_at)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {next ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{emailKeyLabels[next.email_key] || next.email_key}</span>
                            <span className="text-muted-foreground">· {formatDate(next.send_at)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unsubscribes recentes */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Unsubscribes recentes
        </h2>
        {recentUnsubs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum cancelamento até agora.</div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nome</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Track</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cadastrado em</th>
                </tr>
              </thead>
              <tbody>
                {recentUnsubs.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{l.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={`text-[10px] ${trackBadge(l.track)}`}>{l.track || "—"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateOnly(l.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
