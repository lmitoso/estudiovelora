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
      className="flex flex-col items-center justify-center space-y-8 py-16"
    >
      {/* Spinner */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          style={{ borderTopColor: "hsl(42 80% 55%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
          <span className="font-display text-xl font-bold velora-text-gradient">{progress}%</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-display text-xl text-foreground">Criando sua campanha</h3>
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground font-body"
        >
          {messages[msgIndex]}
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full velora-gradient rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export default StepGenerating;
