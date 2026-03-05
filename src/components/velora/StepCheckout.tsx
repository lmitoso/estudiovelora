import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Star, ShieldCheck, Lock, Clock, Instagram, Loader2 } from "lucide-react";
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

const FLASH_DISCOUNT = 0.2;
const FLASH_DURATION = 300;

const TESTIMONIALS = [
  {
    name: "Marina Costa",
    brand: "@marinaatelier",
    text: "Faturei R$12k no primeiro mês só com as fotos do Velora. Minhas peças nunca venderam tão rápido!",
    stars: 5,
  },
  {
    name: "Lucas Ferreira",
    brand: "@streetwear.lf",
    text: "Economizei mais de R$3.000 em fotógrafo e modelo. As fotos ficaram absurdas, parecem de revista.",
    stars: 5,
  },
  {
    name: "Camila Santos",
    brand: "@camilabijoux",
    text: "Meu engajamento triplicou depois que comecei a usar as fotos editoriais. Clientes elogiam demais!",
    stars: 5,
  },
];

const StepCheckout = ({ total, photos, videos, modelType, campaignData, onBack }: CheckoutProps) => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [showFlash, setShowFlash] = useState(true);
  const [flashAccepted, setFlashAccepted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FLASH_DURATION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showFlash && !flashAccepted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setShowFlash(false);
          setFlashAccepted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showFlash, flashAccepted]);

  const discountedTotal = flashAccepted ? Math.round(total * (1 - FLASH_DISCOUNT)) : total;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const canFinish =
    name.trim().length >= 2 &&
    whatsapp.trim().length >= 10 &&
    email.includes("@");

  const handlePayment = async () => {
    if (!canFinish || loading) return;
    setLoading(true);

    try {
      // Upload piece file if exists
      // Upload piece file (stored for internal use, not publicly accessible)
      if (campaignData.pieceFile) {
        const fileName = `${Date.now()}-${campaignData.pieceFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-uploads")
          .upload(fileName, campaignData.pieceFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        }
      }

      // Create order as pending
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
          total_price: discountedTotal,
          status: "pending",
        })
        .select()
        .single();

      if (orderError || !order) {
        toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Create Stripe checkout session
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          orderId: order.id,
          amount: discountedTotal,
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

      // Redirect to Stripe Checkout
      const newWindow = window.open(paymentData.url, '_blank');
      if (!newWindow) {
        // Fallback if popup blocked
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
      {/* Flash Popup */}
      <AnimatePresence>
        {showFlash && !flashAccepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-primary/20 rounded-xl p-8 max-w-sm w-full relative"
              style={{ boxShadow: "0 0 60px hsl(var(--gold) / 0.1)" }}
            >
              <button
                onClick={() => setShowFlash(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-2xl velora-text-gradient">Promoção Relâmpago</h3>
                  <p className="text-xs text-muted-foreground font-body mt-2 tracking-wider">
                    Finalize agora e ganhe <span className="text-primary font-semibold">20% OFF</span>
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-primary/60" />
                    <span className="text-3xl font-display font-light text-primary tracking-wider">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-border rounded-full mt-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(var(--gold-muted)), hsl(var(--gold)))" }}
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeLeft / FLASH_DURATION) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground font-body text-sm line-through">R${total}</p>
                  <p className="text-4xl font-display font-light velora-text-gradient">
                    R${Math.round(total * (1 - FLASH_DISCOUNT))}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setFlashAccepted(true); setShowFlash(false); }}
                  className="w-full velora-btn-primary py-4"
                >
                  Quero esse desconto
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Finalize seu pedido
        </h2>
        <p className="text-muted-foreground font-body text-xs tracking-wider uppercase">
          Pagamento 100% seguro via Stripe · Arquivos entregues em minutos
        </p>
      </div>

      {/* Urgency Banner */}
      {flashAccepted && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary animate-pulse-gold" />
            <p className="text-xs font-body text-primary tracking-wider">
              Desconto expira em{" "}
              <span className="font-display text-base font-medium">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
            </p>
          </div>
          <div className="w-full h-0.5 bg-border rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--gold-muted)), hsl(var(--gold)))" }}
              animate={{ width: `${(timeLeft / FLASH_DURATION) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="font-display text-sm text-foreground tracking-wider uppercase">Resumo</h3>
        <div className="h-px bg-border" />
        <div className="flex justify-between text-xs font-body">
          <span className="text-muted-foreground">
            {photos} foto{photos > 1 ? "s" : ""} editorial
            {videos > 0 && ` + ${videos} vídeo${videos > 1 ? "s" : ""}`}
          </span>
          <span className="text-foreground">R${total}</span>
        </div>
        {flashAccepted && (
          <div className="flex justify-between text-xs font-body">
            <span className="text-primary">Desconto relâmpago</span>
            <span className="text-primary">-20%</span>
          </div>
        )}
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="font-body text-xs text-foreground tracking-wider uppercase">Total</span>
          <div className="text-right">
            {flashAccepted && (
              <span className="text-[10px] text-muted-foreground line-through mr-2 font-body">R${total}</span>
            )}
            <span className="text-3xl font-display font-light velora-text-gradient">R${discountedTotal}</span>
          </div>
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

      {/* Social Proof */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-display text-sm text-foreground tracking-wider uppercase">
            +380 marcas já faturam com o Velora
          </h3>
          <div className="velora-divider mx-auto mt-2" />
        </div>
        <div className="space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="bg-card border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-display font-medium text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-body font-medium text-foreground">{t.name}</p>
                  <p className="text-[9px] text-primary/70 font-body tracking-wider">{t.brand}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-body leading-relaxed italic">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 text-[9px] text-muted-foreground font-body tracking-wider uppercase">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-primary/50" /> SSL Seguro</span>
        <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-primary/50" /> Dados protegidos</span>
        <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-primary/50" /> Entrega imediata</span>
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
              Pagar com Stripe · R${discountedTotal}
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
