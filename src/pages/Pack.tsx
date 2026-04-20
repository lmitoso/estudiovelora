import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

const PACK_URL = "https://pay.kiwify.com.br/SLgYyHP";
const COURSE_URL = "https://pay.kiwify.com.br/G0oqvsb";

const bullets = [
  "5 categorias de campanha",
  "Uso imediato — sem curva de aprendizado",
  "[produto] destacado em cada prompt",
  "Entrega automática após o pagamento",
];

const Pack = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-display text-lg velora-text-gradient tracking-[0.25em]"
          >
            VELORA
          </button>
          <button onClick={() => navigate("/aprender")} className="velora-btn-ghost">
            Conhecer o curso
          </button>
        </div>
      </nav>

      {/* Ambient gold */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 25%, hsl(var(--gold) / 0.08) 0%, transparent 60%)",
        }}
      />

      <main className="relative z-10 pt-36 md:pt-44 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Tag */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-xs text-primary font-body tracking-[0.3em] uppercase mb-6"
          >
            Estúdio Velora
          </motion.p>

          {/* Divisor */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-20 h-px bg-primary/40 mx-auto mb-10 origin-center"
          />

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-display text-4xl md:text-6xl velora-text-gradient leading-tight mb-6"
          >
            Pack Editorial Velora
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="font-body text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-14"
          >
            50 prompts testados para campanhas editoriais com IA
          </motion.p>

          {/* Bullets */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="space-y-4 max-w-md mx-auto mb-14 text-left"
          >
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span className="font-body text-sm md:text-base text-foreground/90">{b}</span>
              </li>
            ))}
          </motion.ul>

          {/* Divisor */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="w-20 h-px bg-primary/40 mx-auto mb-10 origin-center"
          />

          {/* Preço */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="mb-10"
          >
            <p className="font-display text-5xl md:text-6xl velora-text-gradient mb-2">R$ 37</p>
            <p className="text-xs text-muted-foreground font-body tracking-widest uppercase">
              Pagamento único · Acesso vitalício
            </p>
          </motion.div>

          {/* CTA */}
          <motion.a
            href={PACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="velora-btn-primary velora-glow px-12 py-4 inline-flex items-center gap-3"
          >
            Quero o Pack agora
            <ArrowRight className="h-4 w-4" />
          </motion.a>

          {/* Linha discreta */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-10 text-xs md:text-sm text-muted-foreground font-body"
          >
            Quer ir mais fundo?{" "}
            <a
              href={COURSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Conheça o curso completo por R$ 497
            </a>
          </motion.p>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 border-t border-border/40 py-8 px-6 text-center">
        <p className="text-[11px] text-muted-foreground font-body tracking-[0.25em] uppercase">
          Estúdio Velora · São Paulo · Brasil
        </p>
      </footer>
    </div>
  );
};

export default Pack;
