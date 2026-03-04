import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroImg from "@/assets/hero-velora.jpg";
import StepIndicator from "@/components/velora/StepIndicator";
import StepModel from "@/components/velora/StepModel";
import StepCampaign, { CampaignData } from "@/components/velora/StepCampaign";
import StepPackage, { PackageData } from "@/components/velora/StepPackage";
import StepGenerating from "@/components/velora/StepGenerating";
import StepCheckout from "@/components/velora/StepCheckout";
import SuccessPage from "@/components/velora/SuccessPage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const STEP_LABELS = ["Modelo", "Campanha", "Pacote", "Checkout", "Gerando"];

const Index = () => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  const [modelType, setModelType] = useState("");
  const [campaign, setCampaign] = useState<CampaignData>({
    type: "",
    brandName: "",
    brandDescription: "",
    campaignGoal: "",
    pieceFile: null,
    pieceDescription: "",
  });
  const [pkg, setPkg] = useState<PackageData>({ photos: 3, videos: 0 });
  const [finished, setFinished] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<{ images: string[]; video: string | null } | null>(null);

  const total = pkg.photos * 27 + pkg.videos * 37;

  // Create order in DB and start generation AFTER checkout
  const handleCheckoutFinish = useCallback(async (info: { whatsapp: string; email: string }) => {
    try {
      // Upload piece file if exists
      let pieceImageUrl: string | undefined;
      if (campaign.pieceFile) {
        const fileName = `${Date.now()}-${campaign.pieceFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-uploads")
          .upload(fileName, campaign.pieceFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("product-uploads")
            .getPublicUrl(uploadData.path);
          pieceImageUrl = urlData.publicUrl;
        }
      }

      // Create order with contact info
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          email: info.email,
          whatsapp: info.whatsapp || null,
          brand_name: campaign.brandName,
          brand_description: campaign.brandDescription || null,
          campaign_goal: campaign.campaignGoal || null,
          model_type: modelType,
          piece_description: campaign.pieceDescription || null,
          photos_qty: pkg.photos,
          videos_qty: pkg.videos,
          total_price: total,
          status: "paid",
        })
        .select()
        .single();

      if (orderError || !order) {
        toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
        return;
      }

      setContactEmail(info.email);
      setOrderId(order.id);
      setStep(4); // Go to generation step
    } catch (err) {
      console.error("Error creating order:", err);
      toast({ title: "Erro", description: "Erro ao processar pedido.", variant: "destructive" });
    }
  }, [campaign, modelType, pkg, total]);

  const handleGenComplete = useCallback((results: { images: string[]; video: string | null }) => {
    setGeneratedResults(results);
    setFinished(true);
  }, []);

  if (!started) {
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
            Fotos editoriais profissionais para sua marca, criadas com inteligência artificial.
            <br />
            <span className="text-primary font-medium">Em minutos, não semanas.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStarted(true)}
              className="velora-btn-primary velora-glow px-12 py-4"
            >
              Criar minha campanha
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="text-[11px] text-muted-foreground font-body tracking-wider"
          >
            A partir de R$27 por foto · Pronto em até 24h
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SuccessPage email={contactEmail} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-10 pb-16 px-4">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-2xl velora-text-gradient mb-2 tracking-[0.25em]"
      >
        VELORA
      </motion.h1>
      <div className="velora-divider mx-auto mb-8" />

      <StepIndicator currentStep={step} totalSteps={5} labels={STEP_LABELS} />

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepModel key="model" selected={modelType} onSelect={setModelType} onNext={() => setStep(1)} />
          )}
          {step === 1 && (
            <StepCampaign key="campaign" data={campaign} onChange={setCampaign} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <StepPackage key="package" data={pkg} onChange={setPkg} onGenerate={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <StepCheckout
              key="checkout"
              total={total}
              photos={pkg.photos}
              videos={pkg.videos}
              onFinish={handleCheckoutFinish}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && orderId && (
            <StepGenerating key="generating" orderId={orderId} onComplete={handleGenComplete} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
