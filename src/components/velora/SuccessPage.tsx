import { motion } from "framer-motion";
import { CheckCircle, Mail, Instagram } from "lucide-react";

interface SuccessPageProps {
  email: string;
}

const SuccessPage = ({ email }: SuccessPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center space-y-8 py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.3 }}
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-light velora-text-gradient tracking-wide">
          Pedido confirmado
        </h2>
        <div className="velora-divider mx-auto" />
        <p className="text-muted-foreground font-body text-sm max-w-sm leading-relaxed">
          Seu material editorial está sendo gerado e será enviado em instantes para o e-mail cadastrado. Fique de olho na sua caixa de entrada!
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4 max-w-xs w-full">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary/60" />
          <span className="text-sm font-body text-foreground">{email}</span>
        </div>
        <div className="h-px bg-border" />
        <p className="text-xs font-body text-muted-foreground text-left">
          O conteúdo será enviado automaticamente para este e-mail assim que estiver pronto.
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground font-body tracking-wider uppercase">
        Tempo estimado: alguns minutos
      </p>

      <motion.a
        href="https://www.instagram.com/velora.direction/"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.03 }}
        className="velora-btn-primary flex items-center gap-2"
      >
        <Instagram className="w-4 h-4" />
        Seguir @velora.direction
      </motion.a>
    </motion.div>
  );
};

export default SuccessPage;
