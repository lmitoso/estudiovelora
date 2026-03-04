import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StepGeneratingProps {
  onComplete: () => void;
}

const messages = [
  "Analisando referências da marca...",
  "Criando modelo fotográfico com IA...",
  "Compondo cenário editorial...",
  "Ajustando iluminação e cores...",
  "Renderizando em alta resolução...",
  "Finalizando sua campanha...",
];

const StepGenerating = ({ onComplete }: StepGeneratingProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 1;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const idx = Math.min(Math.floor(progress / (100 / messages.length)), messages.length - 1);
    setMsgIndex(idx);
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center space-y-10 py-20"
    >
      {/* Spinner */}
      <div className="relative w-28 h-28">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/15"
          style={{ borderTopColor: "hsl(var(--gold))" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border border-primary/5"
          style={{ borderBottomColor: "hsl(var(--gold-muted))" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-3 rounded-full bg-card flex items-center justify-center">
          <span className="font-display text-2xl font-light velora-text-gradient">{progress}%</span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="font-display text-xl text-foreground tracking-wide">Criando sua campanha</h3>
        <div className="velora-divider mx-auto" />
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground font-body tracking-wider"
        >
          {messages[msgIndex]}
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="w-72 h-0.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, hsl(var(--gold-muted)), hsl(var(--gold)))`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default StepGenerating;
