import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-medium border transition-colors ${
                i <= currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
              animate={i === currentStep ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {i + 1}
            </motion.div>
            <span className="text-[10px] font-body text-muted-foreground max-w-[60px] text-center leading-tight">
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-8 h-px mb-5 ${
                i < currentStep ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
