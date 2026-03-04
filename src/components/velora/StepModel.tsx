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
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Escolha o tipo de modelo
        </h2>
        <p className="text-muted-foreground font-body text-xs tracking-wider uppercase">
          Selecione o estilo que melhor representa sua marca
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {modelOptions.map((option, i) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
            className={`p-6 rounded-lg border text-left transition-all duration-300 ${
              selected === option.id
                ? "border-primary/60 bg-primary/5 velora-glow"
                : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
            }`}
          >
            <span className="text-2xl mb-3 block">{option.emoji}</span>
            <h3 className="font-display text-lg text-foreground tracking-wide">{option.label}</h3>
            <p className="text-[11px] text-muted-foreground font-body mt-1.5 leading-relaxed">{option.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!selected}
          onClick={onNext}
          className="velora-btn-primary disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
        >
          Continuar
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepModel;
