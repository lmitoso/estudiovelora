import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Instagram, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CheckoutProps {
  total: number;
  photos: number;
  videos: number;
  modelType: string;
  campaignData: {
    brandName: string;
    brandDescription: string;
    campaignGoal: string;
    pieceDescription: string;
    pieceFile: File | null;
  };
  onBack: () => void;
}

const formatPrice = (value: number) =>
  value % 1 === 0 ? `R$${value}` : `R$${value.toFixed(2).replace(".", ",")}`;

const StepCheckout = ({ total, photos, videos, modelType, campaignData, onBack }: CheckoutProps) => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canFinish =
    name.trim().length >= 2 &&
    whatsapp.trim().length >= 10 &&
    email.includes("@");

  const handlePayment = async () => {
    if (!canFinish || loading) return;
    setLoading(true);

    try {
      if (campaignData.pieceFile) {
        const fileName = `${Date.now()}-${campaignData.pieceFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("product-uploads")
          .upload(fileName, campaignData.pieceFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        }
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: name,
          email,
          whatsapp: whatsapp || null,
          brand_name: campaignData.brandName,
          brand_description: campaignData.brandDescription || null,
          campaign_goal: campaignData.campaignGoal || null,
          model_type: modelType,
          piece_description: campaignData.pieceDescription || null,
          photos_qty: photos,
          videos_qty: videos,
          total_price: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError || !order) {
        toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          orderId: order.id,
          amount: total,
          description: `${photos} foto${photos > 1 ? "s" : ""} editorial${photos > 1 ? "is" : ""}${videos > 0 ? ` + ${videos} vídeo${videos > 1 ? "s" : ""}` : ""} — ${campaignData.brandName}`,
          customerEmail: email,
          customerName: name,
        },
      });

      if (paymentError || !paymentData?.url) {
        toast({ title: "Erro", description: "Erro ao criar sessão de pagamento.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const newWindow = window.open(paymentData.url, '_blank');
      if (!newWindow) {
        window.location.href = paymentData.url;
      }
      setLoading(false);
    } catch (err) {
      console.error("Payment error:", err);
      toast({ title: "Erro", description: "Erro ao processar pagamento.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-7 max-w-lg mx-auto"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Finalize seu pedido
        </h2>
        <p className="text-muted-foreground font-body text-xs tracking-wider uppercase">
          Pagamento 100% seguro via Stripe
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display text-sm text-foreground tracking-wider uppercase">Resumo</h3>
        <div className="h-px bg-border" />
        <div className="flex justify-between text-xs font-body">
          <span className="text-muted-foreground">
            {photos} foto{photos > 1 ? "s" : ""} editorial
            {videos > 0 && ` + ${videos} vídeo${videos > 1 ? "s" : ""}`}
          </span>
          <span className="text-foreground">{formatPrice(total)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="font-body text-xs text-foreground tracking-wider uppercase">Total</span>
          <span className="text-3xl font-display font-light velora-text-gradient">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-foreground tracking-wider uppercase">Seus dados</h3>
        <input
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="velora-input"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="WhatsApp (com DDD)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="velora-input"
          />
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="velora-input"
          />
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 text-[9px] text-muted-foreground font-body tracking-wider uppercase">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-primary/50" /> SSL Seguro</span>
        <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-primary/50" /> Dados protegidos</span>
      </div>

      {/* Instagram */}
      <div className="text-center">
        <a
          href="https://www.instagram.com/velora.direction/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-body text-muted-foreground hover:text-primary transition-colors tracking-wider"
        >
          <Instagram className="w-4 h-4" />
          @velora.direction
        </a>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canFinish || loading}
          onClick={handlePayment}
          className="w-full velora-btn-primary py-4 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 velora-glow"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecionando...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pagar com Stripe · {formatPrice(total)}
            </>
          )}
        </motion.button>
        <button onClick={onBack} disabled={loading} className="velora-btn-ghost text-center">
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
};

export default StepCheckout;
