import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import heroImg from "@/assets/hero-velora.jpg";
import { CheckCircle2, ArrowRight, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        whatsapp: form.whatsapp.trim(),
        source: "campanha",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0">
        <img src={heroImg} alt="Studio Velora editorial" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/95" />
        <div className="absolute inset-x-0 top-0 h-32 bg-background" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 30%, hsl(var(--gold) / 0.06) 0%, transparent 60%)"
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center px-6 max-w-xl space-y-8"
      >
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-display font-light velora-text-gradient leading-tight"
        >
          VELORA
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="velora-divider mx-auto"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-muted-foreground font-body text-xs md:text-sm tracking-[0.2em] uppercase"
        >
          Timeless Presence
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-foreground/70 font-body text-sm md:text-base leading-relaxed max-w-md mx-auto"
        >
          Fotos e vídeos editoriais profissionais para sua marca, criados com inteligência artificial.
          <br />
          <span className="text-primary font-medium">Campanhas visuais de alto impacto.</span>
        </motion.p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="velora-card p-8 space-y-4"
            >
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h2 className="font-display text-xl text-foreground">Recebemos seus dados!</h2>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Um de nossos diretores de arte entrará em contato pelo WhatsApp em breve.
                <br />Aguarde — vamos criar algo incrível juntos.
              </p>
            </motion.div>
          ) : showForm ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
              className="velora-card p-6 space-y-4 text-left"
            >
              <p className="text-xs text-muted-foreground font-body tracking-wider uppercase text-center mb-2">
                Preencha para iniciar
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="velora-input"
                required
                maxLength={100}
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="velora-input"
                required
                maxLength={255}
              />
              <input
                type="tel"
                placeholder="WhatsApp (com DDD)"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="velora-input"
                required
                maxLength={20}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="velora-btn-primary w-full velora-glow py-4 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Quero minha campanha"}
              </motion.button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="velora-btn-ghost w-full py-2"
              >
                ← Voltar
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="pt-4 space-y-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)}
                className="velora-btn-primary velora-glow px-12 py-4 flex items-center gap-3 mx-auto"
              >
                Criar minha campanha
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/aprender")}
                className="flex items-center gap-2 mx-auto text-primary/80 hover:text-primary font-body text-sm tracking-wider uppercase transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Aprenda a criar com IA
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showForm && !submitted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="text-[11px] text-muted-foreground font-body tracking-wider"
          >
            Campanhas visuais profissionais · Atendimento personalizado
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default Index;
