import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-12 px-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-body font-medium border transition-all duration-500 ${
                i < currentStep
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : i === currentStep
                  ? "border-primary bg-primary/10 text-primary velora-glow"
                  : "border-border text-muted-foreground/40"
              }`}
              animate={i === currentStep ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </motion.div>
            <span className={`text-[9px] font-body max-w-[55px] text-center leading-tight tracking-wider uppercase transition-colors duration-300 ${
              i <= currentStep ? "text-primary/80" : "text-muted-foreground/30"
            }`}>
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-6 sm:w-10 h-px mb-5 transition-colors duration-500 ${
              i < currentStep ? "bg-primary/40" : "bg-border"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
