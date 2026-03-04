import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface StepGeneratingProps {
  orderId: string;
  onComplete: (results: { images: string[]; video: string | null }) => void;
}

const messages = [
  "Analisando referências da marca...",
  "Diretor de arte criando o prompt ideal...",
  "Gerando modelo fotográfico com IA...",
  "Compondo cenário editorial...",
  "Ajustando iluminação e cores...",
  "Renderizando em alta resolução...",
  "Finalizando sua campanha...",
];

const StepGenerating = ({ orderId, onComplete }: StepGeneratingProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  // Call the edge function
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const generate = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("generate-content", {
          body: { orderId },
        });

        if (fnError) {
          setError("Erro ao gerar conteúdo. Tente novamente.");
          console.error("Edge function error:", fnError);
          return;
        }

        if (data?.success) {
          setProgress(100);
          setTimeout(() => onComplete(data.results), 800);
        } else {
          setError(data?.error || "Erro desconhecido na geração.");
        }
      } catch (err) {
        console.error("Generation error:", err);
        setError("Erro de conexão. Verifique sua internet.");
      }
    };

    generate();
  }, [orderId, onComplete]);

  // Fake progress while waiting (caps at 90% until real completion)
  useEffect(() => {
    if (progress >= 100 || error) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + 0.5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [progress, error]);

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
          <span className="font-display text-2xl font-light velora-text-gradient">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h3 className="font-display text-xl text-foreground tracking-wide">
          {error ? "Erro na geração" : "Criando sua campanha"}
        </h3>
        <div className="velora-divider mx-auto" />
        {error ? (
          <p className="text-xs text-destructive font-body tracking-wider">{error}</p>
        ) : (
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-muted-foreground font-body tracking-wider"
          >
            {messages[msgIndex]}
          </motion.p>
        )}
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

      {error && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setError(null);
            setProgress(0);
            calledRef.current = false;
          }}
          className="velora-btn-primary px-8 py-3"
        >
          Tentar novamente
        </motion.button>
      )}
    </motion.div>
  );
};

export default StepGenerating;
