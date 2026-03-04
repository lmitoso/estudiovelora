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

const STEP_LABELS = ["Modelo", "Campanha", "Pacote", "Gerar", "Checkout"];

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

  const total = pkg.photos * 27 + pkg.videos * 37;

  const handleGenComplete = useCallback(() => {
    setStep(4);
  }, []);

  if (!started) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
        {/* Hero BG */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="Studio Velora editorial" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 max-w-lg space-y-6"
        >
          <h1 className="text-5xl md:text-7xl font-display font-light tracking-wider velora-text-gradient leading-tight">
            Studio Velora
          </h1>
          <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">
            Fotos editoriais profissionais para sua marca, criadas com inteligência artificial.
            <br />
            <span className="text-primary">Em minutos, não semanas.</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStarted(true)}
            className="velora-gradient px-10 py-4 rounded-lg font-body text-sm font-medium text-primary-foreground tracking-wide velora-glow"
          >
            Criar minha campanha →
          </motion.button>
          <p className="text-[11px] text-muted-foreground font-body">
            A partir de R$27 por foto • Pronto em até 24h
          </p>
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
    <div className="min-h-screen bg-background flex flex-col items-center pt-8 pb-16 px-4">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-xl velora-text-gradient mb-6 tracking-wider"
      >
        Studio Velora
      </motion.h1>

      <StepIndicator currentStep={step} totalSteps={5} labels={STEP_LABELS} />

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepModel
              key="model"
              selected={modelType}
              onSelect={setModelType}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepCampaign
              key="campaign"
              data={campaign}
              onChange={setCampaign}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepPackage
              key="package"
              data={pkg}
              onChange={setPkg}
              onGenerate={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepGenerating key="generating" onComplete={handleGenComplete} />
          )}
          {step === 4 && (
            <StepCheckout
              key="checkout"
              total={total}
              photos={pkg.photos}
              videos={pkg.videos}
              onFinish={(info) => {
                setContactEmail(info.email);
                setFinished(true);
              }}
              onBack={() => setStep(2)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
