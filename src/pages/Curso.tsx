import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, GraduationCap, Bot, Camera, Clapperboard, Package, Rocket, BookOpen, Check, Star, Shield, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fbqTrack } from "@/lib/metaPixel";

const PAYMENT_URL = "https://pay.kiwify.com.br/G0oqvsb";
const WHATSAPP_URL = "https://wa.me/5598991722040?text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20o%20M%C3%A9todo%20Velora";

const VISIT_DELAY_MS = 30_000;

function trackCursoVisit(leadId: string) {
  try {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-curso-visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ lead_id: leadId }),
      keepalive: true,
    }).catch(() => { /* fire-and-forget */ });
  } catch { /* ignore */ }
}

const fadeUp = {
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

const CTA = () => (
  <motion.a
    href={PAYMENT_URL}
    target="_blank"
    rel="noopener noreferrer"
    data-cta="buy"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="velora-btn-primary velora-glow inline-flex items-center gap-3 px-10 py-5 text-base"
  >
    <Flame className="h-5 w-5" />
    QUERO DOMINAR A CRIAÇÃO VISUAL COM IA
  </motion.a>
);

const SectionDivider = () => (
  <div className="velora-divider mx-auto my-16 md:my-24" />
);

const BonusCard = ({ icon: Icon, number, title, description, details, value }: {
  icon: React.ElementType; number: number; title: string; description: string; details: string[]; value: string;
}) => (
  <motion.div {...fadeUp} className="velora-card p-6 md:p-8 space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs text-primary font-body tracking-widest uppercase">Bônus {number}</span>
    </div>
    <h3 className="font-display text-xl text-foreground leading-snug">{title}</h3>
    <p className="text-sm text-muted-foreground font-body leading-relaxed">{description}</p>
    {details.length > 0 && (
      <ul className="space-y-1">
        {details.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/70 font-body">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            {d}
          </li>
        ))}
      </ul>
    )}
    <div className="pt-2 border-t border-border">
      <p className="text-xs text-muted-foreground font-body">Valor real: <span className="line-through">{value}</span></p>
      <p className="text-sm text-primary font-body font-semibold">Hoje: R$0</p>
    </div>
  </motion.div>
);

const faqItems = [
  {
    question: "Preciso ter experiência com IA?",
    answer: "Não. O curso foi desenhado para iniciantes e para quem já tem algum contato com IA. Você vai aprender do zero como pensar visualmente e usar as ferramentas certas para criar conteúdos profissionais."
  },
  {
    question: "Funciona para qualquer nicho?",
    answer: "Sim. O método é sobre criação visual e direção de arte — funciona para moda, gastronomia, cosméticos, tecnologia, imóveis, e-commerce ou qualquer segmento que precise de conteúdo visual de alto impacto."
  },
  {
    question: "Quanto tempo tenho de acesso?",
    answer: "Acesso vitalício. Você compra uma vez e tem acesso para sempre, incluindo todas as atualizações futuras do curso e dos bônus."
  },
  {
    question: "E se eu não gostar?",
    answer: "Você tem 7 dias de garantia incondicional. Se por qualquer motivo sentir que o curso não é para você, basta solicitar o reembolso completo diretamente pela Kiwify. Sem perguntas, sem burocracia."
  },
  {
    question: "Preciso de equipamentos caros?",
    answer: "Não. Você só precisa de um computador ou celular com acesso à internet. Todas as ferramentas que usamos no curso são acessíveis e muitas delas são gratuitas ou de baixo custo."
  },
  {
    question: "Como recebo o acesso?",
    answer: "Imediatamente após a confirmação do pagamento, você recebe um email da Kiwify com seus dados de acesso à área de membros. É instantâneo para pagamentos com cartão e PIX."
  },
];

export default function Aprender() {
  const navigate = useNavigate();
  const triggeredRef = useRef(false);

  useEffect(() => {
    let leadId: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("lead_id");
      if (fromUrl) localStorage.setItem("velora_lead_id", fromUrl);
      leadId = fromUrl || localStorage.getItem("velora_lead_id");
    } catch { /* ignore */ }

    if (!leadId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || triggeredRef.current) return;
      triggeredRef.current = true;
      trackCursoVisit(leadId!);
    }, VISIT_DELAY_MS);

    // Cancel if user clicks the buy CTA before the timer fires
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-cta="buy"]')) {
        cancelled = true;
        window.clearTimeout(timer);
      }
    };
    document.addEventListener("click", onClick, true);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/aprender")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display text-lg velora-text-gradient tracking-[0.2em]">VELORA</span>
          </button>
          <a href={PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="velora-btn-primary text-xs px-5 py-2">
            Começar agora
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6 text-center max-w-3xl mx-auto">
        <motion.p {...fadeUp} className="text-xs text-primary font-body tracking-[0.3em] uppercase mb-6">
          Método Velora
        </motion.p>
        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-[1.1] text-foreground mb-8"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          Crie fotos e vídeos que parecem campanhas de grandes marcas
        </motion.h1>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="text-lg md:text-xl text-primary font-body font-medium mb-10">
          Usando Inteligência Artificial
        </motion.p>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="text-foreground/70 font-body text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8">
          Aprenda o método que usamos dentro da VELORA para criar campanhas visuais, fotos e vídeos cinematográficos.
        </motion.p>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }} className="space-y-3 max-w-md mx-auto text-left mb-10">
          <p className="text-sm text-muted-foreground font-body mb-2">Mesmo que você:</p>
          {["tenha uma marca", "queira trabalhar criando conteúdo visual", "ou simplesmente queira dominar essa nova habilidade"].map((t) => (
            <div key={t} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground/80 font-body">{t}</span>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="space-y-3 max-w-md mx-auto text-left mb-12">
          <p className="text-sm text-muted-foreground font-body mb-2">Imagine poder criar:</p>
          {["campanhas visuais impressionantes", "fotos profissionais de produto", "vídeos cinematográficos para anúncios", "conteúdos que dominam o feed"].map((t) => (
            <div key={t} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground/80 font-body">{t}</span>
            </div>
          ))}
        </motion.div>

        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 }} className="text-foreground/60 font-body text-sm mb-10">
          Sem precisar gastar 10, 20 ou até 40 mil reais em produção.
        </motion.p>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.5 }}>
          <CTA />
        </motion.div>
      </section>

      <SectionDivider />

      {/* A NOVA ERA */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl text-center mb-10 text-foreground">
          A Nova Era da Criação Visual
        </motion.h2>
        <motion.div {...fadeUp} className="space-y-5 font-body text-sm md:text-base text-foreground/70 leading-relaxed">
          <p>Estamos vivendo uma mudança enorme.</p>
          <p>Antes, para produzir campanhas profissionais era necessário: estúdio, fotógrafos, modelos, produção, iluminação, edição. Isso custava milhares de reais por campanha.</p>
          <p>Agora, com inteligência artificial, qualquer pessoa pode criar conteúdos visuais absurdamente poderosos.</p>
          <p className="text-foreground font-medium">Mas existe um detalhe importante.</p>
        </motion.div>
      </section>

      <SectionDivider />

      {/* O PROBLEMA */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl text-center mb-10 text-foreground">
          A maioria das pessoas usa IA da forma errada
        </motion.h2>
        <motion.div {...fadeUp} className="velora-card p-6 md:p-10 space-y-4">
          {["usam prompts genéricos", "criam imagens comuns", "não sabem dirigir estética", "não sabem criar conceito visual"].map((t) => (
            <div key={t} className="flex items-start gap-3">
              <span className="text-destructive mt-0.5">✕</span>
              <span className="text-sm text-foreground/70 font-body">{t}</span>
            </div>
          ))}
          <p className="text-foreground font-body text-sm pt-4 border-t border-border">
            Resultado? <span className="text-destructive">Conteúdos que parecem artificiais e fracos.</span>
          </p>
        </motion.div>
      </section>

      <SectionDivider />

      {/* O MÉTODO */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28 text-center">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl mb-6 text-foreground">
          Foi por isso que criamos esse método
        </motion.h2>
        <motion.div {...fadeUp} className="space-y-4 font-body text-sm md:text-base text-foreground/70 leading-relaxed max-w-xl mx-auto mb-10">
          <p>Dentro da VELORA, desenvolvemos um processo de criação visual com IA — um método que permite transformar qualquer ideia em campanhas visuais impressionantes.</p>
          <p>O mesmo método que usamos para criar campanhas visuais, conceitos de marca, fotos editoriais e vídeos cinematográficos.</p>
          <p className="text-primary font-medium text-base">Agora estamos abrindo esse processo.</p>
        </motion.div>
      </section>

      <SectionDivider />

      {/* CURSO */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28 text-center">
        <motion.div {...fadeUp} className="flex items-center justify-center gap-2 mb-6">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-xs text-primary font-body tracking-[0.3em] uppercase">Curso</span>
        </motion.div>
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl mb-4 text-foreground">
          Criação de Arte e Conceito Visual com IA
        </motion.h2>
        <motion.p {...fadeUp} className="text-foreground/60 font-body text-sm mb-12 max-w-lg mx-auto">
          Um treinamento completo onde você aprende como criar conteúdos visuais de alto impacto usando inteligência artificial. Esse não é um curso sobre ferramentas — é um curso sobre como pensar e criar visualmente.
        </motion.p>

        <motion.div {...fadeUp} className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-body tracking-widest uppercase mb-3">O que você vai aprender</p>
            {["Como pensar estética visual", "Como criar campanhas visuais fortes", "Como gerar fotos profissionais com IA", "Como criar vídeos cinematográficos", "Como dirigir conceitos criativos", "Como transformar isso em uma máquina infinita de criação"].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/70 font-body">{t}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-body tracking-widest uppercase mb-3">Depois do método você poderá criar</p>
            {["campanhas para marcas", "fotos de produto", "anúncios visuais", "conteúdos para redes sociais", "projetos visuais completos"].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80 font-body">{t}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground font-body pt-2">Tudo usando inteligência artificial.</p>
          </div>
        </motion.div>
      </section>

      <SectionDivider />

      {/* OPORTUNIDADE */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl text-center mb-10 text-foreground">
          Oportunidade Real
        </motion.h2>
        <motion.div {...fadeUp} className="font-body text-sm md:text-base text-foreground/70 leading-relaxed space-y-4 max-w-xl mx-auto">
          <p>Hoje existem dois tipos de pessoas surgindo nesse mercado:</p>
          <div className="velora-card p-5 space-y-3">
            <p className="text-foreground/50">1️⃣ quem usa IA de forma superficial</p>
            <p className="text-foreground font-medium">2️⃣ quem domina criação visual com IA</p>
          </div>
          <p>O segundo grupo está criando marcas, agências, projetos criativos e conteúdos virais.</p>
          <p className="text-primary font-medium">E a diferença entre eles é o método.</p>
        </motion.div>
      </section>

      <SectionDivider />

      {/* BÔNUS */}
      <section className="px-6 max-w-4xl mx-auto pb-20 md:pb-28">
        <motion.div {...fadeUp} className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <span className="text-xs text-primary font-body tracking-[0.3em] uppercase">Bônus Exclusivos</span>
        </motion.div>
        <motion.p {...fadeUp} className="text-center text-foreground/60 font-body text-sm mb-12 max-w-lg mx-auto">
          Ao entrar hoje você também recebe ferramentas e materiais utilizados internamente dentro da Velora.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6">
          <BonusCard icon={Bot} number={1} title="Agente IA Diretor de Arte Velora" description="Um agente treinado para ajudar você a criar:" details={["campanhas visuais", "conceitos criativos", "posicionamento visual", "estética de marca"]} value="R$1.497" />
          <BonusCard icon={Camera} number={2} title="Agente Criador de Prompts Fotográficos" description="Crie prompts profissionais de fotografia editorial." details={["fotos de produto", "campanhas de moda", "editoriais de marca"]} value="R$997" />
          <BonusCard icon={Clapperboard} number={3} title="Agente de Prompts Cinematográficos" description="Crie vídeos cinematográficos com IA." details={["reels", "anúncios", "campanhas visuais"]} value="R$997" />
          <BonusCard icon={Package} number={4} title="Pack com 50 Prompts Profissionais" description="50 prompts prontos para criar conteúdos visuais impactantes. Você só precisa adaptar para seu projeto." details={[]} value="R$497" />
          <BonusCard icon={Rocket} number={5} title="Mini-Curso: Como Lançar uma Marca" description="Aprenda como estruturar uma marca com percepção de valor alta." details={["posicionamento", "identidade visual", "estratégia de conteúdo", "comunicação"]} value="R$1.297" />
          <BonusCard icon={BookOpen} number={6} title="Biblioteca Velora — 15 eBooks" description="Materiais usados internamente para desenvolver campanhas e projetos." details={["direção de arte", "branding visual", "psicologia do design", "storytelling visual", "estética de campanhas", "criação de identidade visual"]} value="R$2.497" />
        </div>
      </section>

      <SectionDivider />

      {/* GARANTIA */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28 text-center">
        <motion.div {...fadeUp} className="velora-card p-8 md:p-12 max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            Garantia Incondicional de 7 Dias
          </h2>
          <p className="text-sm text-foreground/70 font-body leading-relaxed mb-4">
            Acesse o curso, explore os materiais e, se não for o que você esperava, peça o reembolso completo em até 7 dias. Sem perguntas, sem burocracia.
          </p>
          <p className="text-xs text-muted-foreground font-body">
            A compra é feita pela <strong className="text-foreground/80">Kiwify</strong>, plataforma que garante todos os direitos do consumidor e processa o reembolso automaticamente.
          </p>
        </motion.div>
      </section>

      <SectionDivider />

      {/* PREÇO */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28 text-center">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl mb-10 text-foreground">
          Valor Total do Pacote
        </motion.h2>

        <motion.div {...fadeUp} className="velora-card p-6 md:p-10 max-w-md mx-auto space-y-3 mb-10">
          {[
            ["Curso completo", "R$497"],
            ["Agente Diretor de Arte", "R$1.497"],
            ["Agente Prompts Fotográficos", "R$997"],
            ["Agente Prompts Cinematográficos", "R$997"],
            ["Pack de Prompts", "R$497"],
            ["Mini-Curso Marca", "R$1.297"],
            ["Biblioteca Velora", "R$2.497"],
          ].map(([item, price]) => (
            <div key={item} className="flex justify-between text-sm font-body">
              <span className="text-foreground/70">{item}</span>
              <span className="text-foreground/40 line-through">{price}</span>
            </div>
          ))}
          <div className="border-t border-border pt-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-body">Preço normal</span>
            <span className="text-foreground/40 line-through font-body text-lg">R$4.000</span>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-4">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-xs text-primary font-body font-semibold tracking-wide uppercase">Para os primeiros 50 alunos do Método Velora</span>
          </div>
          <p className="text-foreground/60 font-body text-sm">Você pode adquirir tudo isso hoje por apenas:</p>
          <p className="font-display text-5xl md:text-6xl velora-text-gradient font-light">R$497</p>
          <p className="text-xs text-muted-foreground font-body tracking-wider">Pagamento único · Sem mensalidade · Sem taxas</p>
          <p className="text-xs text-foreground/40 font-body mt-2">Depois, o preço volta para <strong className="text-foreground/60">R$4.000</strong></p>
        </motion.div>

        <motion.div {...fadeUp} className="space-y-6">
          <div className="max-w-md mx-auto text-left space-y-3 mb-8">
            <p className="text-sm text-foreground/60 font-body">A escolha é sua. Você pode continuar criando conteúdos comuns… ou começar a produzir campanhas visuais que dominam atenção.</p>
          </div>
          <CTA />
        </motion.div>
      </section>

      <SectionDivider />

      {/* FAQ */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl text-center mb-10 text-foreground">
          Perguntas Frequentes
        </motion.h2>
        <motion.div {...fadeUp} className="max-w-xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="velora-card border-none px-6">
                <AccordionTrigger className="text-sm font-body text-foreground hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/70 font-body leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      <SectionDivider />

      {/* CTA FINAL */}
      <section className="px-6 max-w-3xl mx-auto pb-20 md:pb-28 text-center">
        <motion.h2 {...fadeUp} className="font-display text-2xl md:text-4xl mb-6 text-foreground">
          Comece agora a criar como um diretor de arte
        </motion.h2>
        <motion.p {...fadeUp} className="text-foreground/60 font-body text-sm mb-10 max-w-lg mx-auto">
          Domine a criação visual com IA e transforme qualquer ideia em campanhas que parecem de grandes marcas.
        </motion.p>
        <motion.div {...fadeUp}>
          <CTA />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="font-display text-sm velora-text-gradient tracking-[0.2em]">VELORA</p>
        <p className="text-xs text-muted-foreground font-body mt-2">© {new Date().getFullYear()} Velora. Todos os direitos reservados.</p>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>
    </div>
  );
}
