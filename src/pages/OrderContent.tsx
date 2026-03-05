import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Download, Image, Video, Loader2, Instagram } from "lucide-react";

interface Generation {
  id: string;
  type: string;
  status: string;
  output_url: string | null;
}

const OrderContent = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) { setError(true); return; }

    const fetchContent = async () => {
      // Use the public view that hides PII
      const { data: order } = await supabase
        .from("orders_public")
        .select("brand_name, status")
        .eq("id", orderId)
        .single() as { data: { brand_name: string; status: string } | null };

      if (!order) { setError(true); setLoading(false); return; }
      setBrandName(order.brand_name);

      // Fetch generations via edge function (no direct table access)
      const res = await supabase.functions.invoke("order-content-data", {
        body: { orderId },
      });

      if (res.error || !res.data?.data) {
        setGenerations([]);
      } else {
        setGenerations(res.data.data);
      }
      setLoading(false);
    };

    fetchContent();

    // Realtime updates - refetch via edge function on any change
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "generations", filter: `order_id=eq.${orderId}` },
        async () => {
          const res = await supabase.functions.invoke("order-content-data", {
            body: { orderId },
          });
          if (res.data?.data) {
            setGenerations(res.data.data);
          }
        }
      )
      .subscribe();
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl text-foreground">Pedido não encontrado</h2>
          <p className="text-muted-foreground text-sm font-body">Verifique o link enviado no seu e-mail.</p>
        </div>
      </div>
    );
  }

  const completed = generations.filter((g) => g.status === "completed" && g.output_url);
  const processing = generations.filter((g) => g.status === "processing");

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-2xl velora-text-gradient tracking-[0.25em] mb-2">VELORA</h1>
          <div className="velora-divider mx-auto mb-6" />
          <h2 className="font-display text-xl text-foreground mb-1">Conteúdo para {brandName}</h2>
          <p className="text-muted-foreground text-sm font-body">
            {processing.length > 0
              ? "Alguns itens ainda estão sendo gerados..."
              : "Seu material está pronto! Clique para baixar."}
          </p>
        </motion.div>

        {processing.length > 0 && (
          <div className="mb-8 p-4 bg-card border border-border rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <span className="text-sm font-body text-muted-foreground">
              {processing.length} {processing.length === 1 ? "item" : "itens"} em processamento...
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {completed.map((gen, i) => (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg overflow-hidden group"
            >
              {gen.type === "image" ? (
                <div className="relative aspect-[3/4] bg-secondary">
                  <img src={gen.output_url!} alt={`Conteúdo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={gen.output_url!}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="velora-btn-primary flex items-center gap-2 text-xs"
                    >
                      <Download className="w-4 h-4" /> Baixar
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[9/16] bg-secondary">
                  <video src={gen.output_url!} controls className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                  {gen.type === "image" ? <Image className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  {gen.type === "image" ? "Foto" : "Vídeo"} {i + 1}
                </div>
                <a
                  href={gen.output_url!}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 font-body flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {completed.length === 0 && processing.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm font-body">Nenhum conteúdo gerado ainda.</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href="https://www.instagram.com/velora.direction/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors font-body tracking-wider uppercase"
          >
            <Instagram className="w-4 h-4" /> @velora.direction
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderContent;
