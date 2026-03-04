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

const StepCheckout = ({ total, photos, videos, onFinish, onBack }: CheckoutProps) => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [payMethod, setPayMethod] = useState<"pix" | "card">("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [showFlash, setShowFlash] = useState(true);
  const [flashAccepted, setFlashAccepted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FLASH_DURATION);

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
    email.includes("@") &&
    (payMethod === "pix" || (cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3));

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
          Pagamento 100% seguro · Arquivos entregues em minutos
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
          <span className="text-muted-foreground">{photos} foto{photos > 1 ? "s" : ""} editorial</span>
          <span className="text-foreground">R${photos * 27}</span>
        </div>
        {videos > 0 && (
          <div className="flex justify-between text-xs font-body">
            <span className="text-muted-foreground">{videos} vídeo{videos > 1 ? "s" : ""}</span>
            <span className="text-foreground">R${videos * 37}</span>
          </div>
        )}
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

      {/* Payment Method */}
      <div className="space-y-3">
        <h3 className="font-display text-sm text-foreground flex items-center gap-2 tracking-wider uppercase">
          <Lock className="w-3.5 h-3.5 text-primary" /> Pagamento
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPayMethod("pix")}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border text-sm font-body transition-all duration-300 ${
              payMethod === "pix"
                ? "border-primary/60 bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <div className="text-left">
              <span className="font-medium block text-xs">PIX</span>
              <span className="text-[9px] opacity-60 tracking-wider">Aprovação instantânea</span>
            </div>
          </button>
          <button
            onClick={() => setPayMethod("card")}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border text-sm font-body transition-all duration-300 ${
              payMethod === "card"
                ? "border-primary/60 bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <div className="text-left">
              <span className="font-medium block text-xs">Cartão</span>
              <span className="text-[9px] opacity-60 tracking-wider">Crédito ou débito</span>
            </div>
          </button>
        </div>

        {payMethod === "pix" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-primary/10 rounded-lg p-6 text-center space-y-3"
          >
            <div className="w-36 h-36 mx-auto bg-background/50 rounded-lg flex items-center justify-center border border-border">
              <QrCode className="w-16 h-16 text-primary/30" />
            </div>
            <p className="text-[10px] text-muted-foreground font-body tracking-wider">
              QR Code gerado após finalizar
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-primary/60">
              <ShieldCheck className="w-3 h-3" />
              <span className="tracking-wider uppercase">Aprovação em segundos</span>
            </div>
          </motion.div>
        )}

        {payMethod === "card" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <input
              type="text"
              placeholder="Número do cartão"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
              className="velora-input tracking-[0.2em]"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="velora-input"
              />
              <input
                type="text"
                placeholder="CVV"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="velora-input"
              />
            </div>
          </motion.div>
        )}
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

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canFinish}
          onClick={() => onFinish({ whatsapp, email })}
          className="w-full velora-btn-primary py-4 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 velora-glow"
        >
          {payMethod === "pix" ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
          {payMethod === "pix" ? "Gerar PIX e Finalizar" : "Pagar e Finalizar"} · R${discountedTotal}
        </motion.button>
        <button onClick={onBack} className="velora-btn-ghost text-center">
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
};

export default StepCheckout;
