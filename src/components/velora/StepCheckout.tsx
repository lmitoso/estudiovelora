import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, CreditCard, QrCode, Star, ShieldCheck, Lock } from "lucide-react";

interface CheckoutProps {
  total: number;
  photos: number;
  videos: number;
  onFinish: (info: { whatsapp: string; email: string }) => void;
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
      className="space-y-6 max-w-lg mx-auto"
    >
      {/* Flash Popup */}
      <AnimatePresence>
        {showFlash && !flashAccepted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <div className="bg-card border border-primary/30 rounded-xl p-6 max-w-sm w-full velora-glow relative">
              <button
                onClick={() => setShowFlash(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center space-y-3">
                <Zap className="w-8 h-8 text-primary mx-auto" />
                <h3 className="font-display text-2xl velora-text-gradient">Promoção Relâmpago!</h3>
                <p className="text-sm text-muted-foreground font-body">
                  Finalize agora e ganhe <span className="text-primary font-semibold">20% OFF</span>
                </p>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-3xl font-display font-bold text-primary">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                  <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full velora-gradient rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeLeft / FLASH_DURATION) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground font-body text-sm line-through">R${total}</p>
                  <p className="text-3xl font-display font-bold velora-text-gradient">
                    R${Math.round(total * (1 - FLASH_DISCOUNT))}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setFlashAccepted(true); setShowFlash(false); }}
                  className="w-full velora-gradient py-3 rounded-lg font-body text-sm font-medium text-primary-foreground"
                >
                  Quero esse desconto! 🔥
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Finalize seu pedido
        </h2>
        <p className="text-muted-foreground font-body text-sm">
          Pagamento 100% seguro • Arquivos entregues em minutos
        </p>
      </div>

      {/* Urgency Banner */}
      {flashAccepted && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center"
        >
          <p className="text-sm font-body text-primary font-semibold animate-pulse-gold">
            🔥 Desconto de 20% expira em{" "}
            <span className="font-display text-lg">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </p>
          <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full velora-gradient rounded-full"
              animate={{ width: `${(timeLeft / FLASH_DURATION) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <h3 className="font-display text-sm font-semibold text-foreground mb-2">Resumo do pedido</h3>
        <div className="flex justify-between text-sm font-body">
          <span className="text-muted-foreground">{photos} foto{photos > 1 ? "s" : ""} editorial</span>
          <span className="text-foreground">—</span>
        </div>
        {videos > 0 && (
          <div className="flex justify-between text-sm font-body">
            <span className="text-muted-foreground">{videos} vídeo{videos > 1 ? "s" : ""}</span>
            <span className="text-foreground">—</span>
          </div>
        )}
        {flashAccepted && (
          <div className="flex justify-between text-sm font-body">
            <span className="text-primary">Desconto relâmpago 🔥</span>
            <span className="text-primary">-20%</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between items-center">
          <span className="font-body text-sm text-foreground font-medium">Total</span>
          <div className="text-right">
            {flashAccepted && (
              <span className="text-xs text-muted-foreground line-through mr-2">R${total}</span>
            )}
            <span className="text-2xl font-display font-bold velora-text-gradient">R${discountedTotal}</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Seus dados</h3>
        <input
          type="text"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="WhatsApp (com DDD)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Pagamento seguro
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPayMethod("pix")}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-body transition-all ${
              payMethod === "pix"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <div className="text-left">
              <span className="font-medium block">PIX</span>
              <span className="text-[10px] opacity-70">Aprovação instantânea</span>
            </div>
          </button>
          <button
            onClick={() => setPayMethod("card")}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-body transition-all ${
              payMethod === "card"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <div className="text-left">
              <span className="font-medium block">Cartão</span>
              <span className="text-[10px] opacity-70">Crédito ou débito</span>
            </div>
          </button>
        </div>

        {payMethod === "pix" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-primary/20 rounded-lg p-4 text-center space-y-2"
          >
            <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center border border-border">
              <QrCode className="w-16 h-16 text-primary/50" />
            </div>
            <p className="text-xs text-muted-foreground font-body">
              O QR Code será gerado após finalizar o pedido
            </p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-primary/70">
              <ShieldCheck className="w-3 h-3" />
              <span>Aprovação em segundos</span>
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
              className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors tracking-widest"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="text"
                placeholder="CVV"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Social Proof */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground text-center">
          +380 marcas já faturam com o Velora
        </h3>
        <div className="space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-card border border-border rounded-lg p-3 space-y-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full velora-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-xs font-body font-medium text-foreground">{t.name}</p>
                  <p className="text-[10px] text-primary font-body">{t.brand}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">"{t.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-body">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-primary" /> SSL Seguro</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> Dados protegidos</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Entrega imediata</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canFinish}
          onClick={() => onFinish({ whatsapp, email })}
          className="w-full velora-gradient py-4 rounded-lg font-body text-sm font-semibold text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {payMethod === "pix" ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
          {payMethod === "pix" ? "Gerar PIX e finalizar" : "Pagar e finalizar"} • R${discountedTotal}
        </motion.button>
        <button onClick={onBack} className="text-muted-foreground font-body text-xs hover:text-foreground transition-colors text-center">
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
};

export default StepCheckout;
