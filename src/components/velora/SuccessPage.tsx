import { motion } from "framer-motion";
import { CheckCircle, Mail, MessageCircle } from "lucide-react";

interface SuccessPageProps {
  email: string;
}

const SuccessPage = ({ email }: SuccessPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center space-y-6 py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <CheckCircle className="w-16 h-16 text-primary" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-display font-light velora-text-gradient">
          Pedido confirmado!
        </h2>
        <p className="text-muted-foreground font-body text-sm max-w-sm">
          Sua campanha editorial está sendo finalizada. Você receberá todos os arquivos em máxima resolução prontos para postar.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-3 max-w-xs w-full">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-sm font-body text-foreground">{email}</span>
        </div>
        <div className="flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-body text-muted-foreground">WhatsApp confirmado</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-body">
        Prazo de entrega: até 24 horas úteis
      </p>

      <motion.a
        href="https://instagram.com/studiovelora"
        target="_blank"
        whileHover={{ scale: 1.05 }}
        className="velora-gradient px-6 py-2.5 rounded-lg font-body text-sm font-medium text-primary-foreground"
      >
        Seguir @studiovelora
      </motion.a>
    </motion.div>
  );
};

export default SuccessPage;
