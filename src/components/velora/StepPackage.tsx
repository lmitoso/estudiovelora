import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Video, Plus, Minus } from "lucide-react";

interface PackageData {
  photos: number;
  videos: number;
  comboPrice?: number;
}

interface StepPackageProps {
  data: PackageData;
  onChange: (data: PackageData) => void;
  onGenerate: () => void;
  onBack: () => void;
}

const PHOTO_PRICE = 27;
const VIDEO_PRICE = 37;

const combos = [
  { photos: 3, videos: 0, label: "Starter", price: 67, save: 14 },
  { photos: 5, videos: 1, label: "Pro", price: 129, save: 43, popular: true },
  { photos: 10, videos: 2, label: "Premium", price: 219, save: 115 },
];

const StepPackage = ({ data, onChange, onGenerate, onBack }: StepPackageProps) => {
  const [useCombo, setUseCombo] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState<number | null>(null);

  const customTotal = data.photos * PHOTO_PRICE + data.videos * VIDEO_PRICE;

  const handleComboSelect = (index: number) => {
    setSelectedCombo(index);
    setUseCombo(true);
    onChange({ photos: combos[index].photos, videos: combos[index].videos, comboPrice: combos[index].price });
  };

  const handleCustom = () => {
    setUseCombo(false);
    setSelectedCombo(null);
    onChange({ ...data, comboPrice: undefined });
  };

  const total = useCombo && selectedCombo !== null ? combos[selectedCombo].price : customTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-7 max-w-lg mx-auto"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Monte seu pacote
        </h2>
        <p className="text-muted-foreground font-body text-xs tracking-wider uppercase">
          Escolha um combo ou personalize a quantidade
        </p>
      </div>

      {/* Combos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {combos.map((combo, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleComboSelect(i)}
            className={`p-5 rounded-lg border text-center relative transition-all duration-300 ${
              selectedCombo === i && useCombo
                ? "border-primary/60 bg-primary/5 velora-glow"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {combo.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-body font-medium bg-primary text-primary-foreground px-3 py-0.5 rounded-full tracking-wider uppercase">
                Popular
              </span>
            )}
            <h4 className="font-display text-lg text-foreground tracking-wide">{combo.label}</h4>
            <p className="text-[10px] text-muted-foreground font-body mt-1.5">
              {combo.photos} fotos {combo.videos > 0 && `+ ${combo.videos} vídeo${combo.videos > 1 ? "s" : ""}`}
            </p>
            <p className="text-2xl font-display font-semibold text-primary mt-3">
              R${combo.price}
            </p>
            <p className="text-[9px] text-primary/60 font-body mt-1 tracking-wider">
              Economia de R${combo.save}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Custom */}
      <div className="text-center">
        <button onClick={handleCustom} className="text-[10px] text-muted-foreground font-body tracking-wider uppercase hover:text-primary transition-colors">
          Ou personalize a quantidade
        </button>
      </div>

      {!useCombo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card border border-border rounded-lg p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="font-body text-sm text-foreground">Fotos</span>
              <span className="text-[10px] text-muted-foreground tracking-wider">(R${PHOTO_PRICE}/und)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChange({ ...data, photos: Math.max(1, data.photos - 1) })}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-body text-sm text-foreground w-6 text-center">{data.photos}</span>
              <button
                onClick={() => onChange({ ...data, photos: data.photos + 1 })}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <span className="font-body text-sm text-foreground">Vídeos</span>
              <span className="text-[10px] text-muted-foreground tracking-wider">(R${VIDEO_PRICE}/und)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChange({ ...data, videos: Math.max(0, data.videos - 1) })}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-body text-sm text-foreground w-6 text-center">{data.videos}</span>
              <button
                onClick={() => onChange({ ...data, videos: data.videos + 1 })}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:border-primary/50 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Total */}
      <div className="bg-card border border-primary/15 rounded-lg p-5 text-center">
        <p className="text-[10px] text-muted-foreground font-body tracking-wider uppercase">Total do investimento</p>
        <p className="text-4xl font-display font-bold velora-text-gradient mt-2">
          R${total}
        </p>
        <p className="text-[10px] text-muted-foreground font-body mt-2 tracking-wider">
          {data.photos} foto{data.photos > 1 ? "s" : ""} {data.videos > 0 && `+ ${data.videos} vídeo${data.videos > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="velora-btn-ghost">
          ← Voltar
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={total === 0}
          onClick={onGenerate}
          className="velora-btn-primary disabled:opacity-20 animate-pulse-gold"
        >
          Finalizar Pedido →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepPackage;
export type { PackageData };
