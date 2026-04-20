import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Layers, Target, ArrowRight } from "lucide-react";

const Aprender = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) {
      setError("Preencha nome e email para continuar.");
      return;
    }

    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-lead`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          name,
          email,
          whatsapp: "",
          source: "pagina-aprender",
          track: "aprender",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      const leadId = data?.lead_id as string | undefined;
      if (leadId) {
        try { localStorage.setItem("velora_lead_id", leadId); } catch { /* ignore */ }
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate(leadId ? `/curso?lead_id=${leadId}` : "/curso");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente em instantes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Layers, text: "O processo completo em 3 etapas" },
    { icon: Target, text: "Como escolher as ferramentas certas" },
    { icon: Sparkles, text: "Como aplicar ao seu nicho ou marca" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav minimalista */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="font-display text-lg velora-text-gradient tracking-[0.25em]"
          >
            VELORA
          </button>
          <button
            onClick={() => navigate("/curso")}
            className="velora-btn-ghost"
          >
            Conhecer o curso
          </button>
        </div>
      </nav>

      {/* Hero ambient gold */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 25%, hsl(var(--gold) / 0.06) 0%, transparent 60%)",
        }}
      />

      <main className="relative z-10 pt-36 md:pt-44 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-xs text-primary font-body tracking-[0.3em] uppercase mb-8"
          >
            Mini-método gratuito
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05] text-foreground mb-8"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Aprenda a criar campanhas editoriais com IA.
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="velora-divider mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-foreground/70 font-body text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-14"
          >
            Receba gratuitamente o mini-método que usamos para produzir em 3 dias o
            que custaria semanas de produção tradicional.
          </motion.p>

          {/* Benefícios */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="space-y-4 max-w-md mx-auto text-left mb-14"
          >
            {benefits.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm md:text-base text-foreground/80 font-body leading-relaxed pt-1.5">
                  {text}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Formulário ou confirmação */}
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="velora-card p-8 max-w-md mx-auto"
              >
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
                <p className="font-display text-2xl text-foreground mb-2">
                  Enviado.
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  Verifique seu email em instantes.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                onSubmit={handleSubmit}
                className="velora-card p-6 md:p-8 max-w-md mx-auto space-y-4 text-left"
              >
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="velora-input"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
                <input
                  type="email"
                  placeholder="Seu melhor email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="velora-input"
                  required
                  maxLength={255}
                  autoComplete="email"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  className="velora-btn-primary velora-glow w-full py-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? "Enviando..." : (
                    <>
                      Quero receber
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                {error && (
                  <p className="text-xs text-destructive font-body text-center pt-1">
                    {error}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-[11px] text-muted-foreground font-body tracking-[0.2em] uppercase mt-10"
          >
            Sem spam. Apenas conteúdo com intenção.
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default Aprender;
