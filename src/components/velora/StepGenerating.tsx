import { motion } from "framer-motion";
import { CheckCircle2, Clock, MessageCircle, Mail } from "lucide-react";
import { useEffect } from "react";

interface StepGeneratingProps {
  orderId: string;
  onComplete: () => void;
}

const StepGenerating = ({ orderId, onComplete }: StepGeneratingProps) => {
  // Auto-finalize after a brief moment so SuccessPage can take over the lifecycle
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center space-y-8 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </motion.div>

      <div className="space-y-3 max-w-md">
        <h2 className="font-display text-3xl velora-text-gradient tracking-wide">
          Pedido confirmado
        </h2>
        <div className="velora-divider mx-auto" />
        <p className="text-foreground/80 font-body text-sm leading-relaxed">
          Nossa equipe vai criar sua campanha com direção artística personalizada.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-3 max-w-sm w-full">
        <div className="flex items-center gap-3 text-left">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-body text-foreground/80">
            <span className="text-muted-foreground tracking-wider uppercase block text-[10px] mb-0.5">Prazo de entrega</span>
            Até 48h úteis
          </p>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center gap-3 text-left">
          <MessageCircle className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-body text-foreground/80">
            <span className="text-muted-foreground tracking-wider uppercase block text-[10px] mb-0.5">Entrega</span>
            Você receberá o material pelo WhatsApp e por email
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground font-body tracking-wider uppercase">
        Pedido #{orderId.slice(0, 8)}
      </p>
    </motion.div>
  );
};

export default StepGenerating;
