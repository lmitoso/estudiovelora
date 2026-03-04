import { motion } from "framer-motion";

const modelOptions = [
  {
    id: "feminino",
    label: "Modelo Feminina",
    desc: "Ideal para moda feminina, acessórios e beleza",
    emoji: "👩",
  },
  {
    id: "masculino",
    label: "Modelo Masculino",
    desc: "Perfeito para moda masculina e lifestyle",
    emoji: "👨",
  },
  {
    id: "produto-solo",
    label: "Produto Solo",
    desc: "Foto editorial focada no produto, sem modelo",
    emoji: "📦",
  },
  {
    id: "casal",
    label: "Casal / Dupla",
    desc: "Dois modelos para campanhas de lifestyle",
    emoji: "👫",
  },
];

interface StepModelProps {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

const StepModel = ({ selected, onSelect, onNext }: StepModelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Escolha o tipo de modelo
        </h2>
        <p className="text-muted-foreground font-body text-sm">
          Selecione o estilo que melhor representa sua marca
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {modelOptions.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
            className={`p-5 rounded-lg border text-left transition-all ${
              selected === option.id
                ? "border-primary bg-primary/10 velora-glow"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-2xl mb-2 block">{option.emoji}</span>
            <h3 className="font-display text-lg text-foreground">{option.label}</h3>
            <p className="text-xs text-muted-foreground font-body mt-1">{option.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!selected}
          onClick={onNext}
          className="velora-gradient px-8 py-3 rounded-lg font-body text-sm font-medium text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          Continuar
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepModel;
