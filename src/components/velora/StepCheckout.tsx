import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";

interface CheckoutProps {
  total: number;
  photos: number;
  videos: number;
  onFinish: (info: { whatsapp: string; email: string }) => void;
  onBack: () => void;
}

const FLASH_DISCOUNT = 0.2; // 20%
const FLASH_DURATION = 300; // 5 min in seconds

const StepCheckout = ({ total, photos, videos, onFinish, onBack }: CheckoutProps) => {
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
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

  const canFinish = whatsapp.trim().length >= 10 && email.includes("@");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-md mx-auto"
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
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-display font-bold text-primary">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                  </div>
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
                  onClick={() => {
                    setFlashAccepted(true);
                    setShowFlash(false);
                  }}
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
          Quase lá!
        </h2>
        <p className="text-muted-foreground font-body text-sm">
          Informe seus dados para receber os arquivos em máxima resolução
        </p>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
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
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="font-body text-sm text-foreground font-medium">Total</span>
          <div className="text-right">
            {flashAccepted && (
              <span className="text-xs text-muted-foreground line-through mr-2">R${total}</span>
            )}
            <span className="text-xl font-display font-bold velora-text-gradient">R${discountedTotal}</span>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-3">
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

      {flashAccepted && timeLeft > 0 && (
        <div className="text-center">
          <p className="text-xs text-primary font-body animate-pulse-gold">
            ⏱ Desconto expira em {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
          ← Voltar
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!canFinish}
          onClick={() => onFinish({ whatsapp, email })}
          className="velora-gradient px-8 py-3 rounded-lg font-body text-sm font-medium text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Finalizar pedido →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepCheckout;
