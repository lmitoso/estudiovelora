import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle } from "lucide-react";

type CampaignType = "avulsa" | "peca" | "colecao" | "";

interface CampaignData {
  type: CampaignType;
  brandName: string;
  brandDescription: string;
  campaignGoal: string;
  pieceFile: File | null;
  pieceDescription: string;
}

interface StepCampaignProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
  onNext: () => void;
  onBack: () => void;
}

const campaignTypes = [
  { id: "avulsa" as CampaignType, label: "Campanha Avulsa", desc: "Editorial completa para sua marca", icon: "🎯" },
  { id: "peca" as CampaignType, label: "Campanha por Peça", desc: "Fotos focadas em uma peça específica", icon: "👗" },
  { id: "colecao" as CampaignType, label: "Mini Coleção", desc: "Conjunto de fotos para lançamento", icon: "✨" },
];

const StepCampaign = ({ data, onChange, onNext, onBack }: StepCampaignProps) => {
  const [dragOver, setDragOver] = useState(false);

  const update = (partial: Partial<CampaignData>) => onChange({ ...data, ...partial });

  const handleFile = (file: File) => {
    update({ pieceFile: file });
  };

  const canContinue =
    data.type &&
    data.brandName.trim() &&
    data.campaignGoal.trim() &&
    (data.type !== "peca" || data.pieceFile);

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
          Detalhes da campanha
        </h2>
        <p className="text-muted-foreground font-body text-xs tracking-wider uppercase">
          Conte-nos sobre sua marca e o que deseja transmitir
        </p>
      </div>

      {/* Campaign type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campaignTypes.map((ct, i) => (
          <motion.button
            key={ct.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => update({ type: ct.id })}
            className={`p-4 rounded-lg border text-left transition-all duration-300 ${
              data.type === ct.id
                ? "border-primary/60 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="text-xl">{ct.icon}</span>
            <h4 className="font-display text-sm mt-1.5 text-foreground tracking-wide">{ct.label}</h4>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">{ct.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Brand info */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nome da sua marca"
          value={data.brandName}
          onChange={(e) => update({ brandName: e.target.value })}
          className="velora-input"
        />
        <textarea
          placeholder="Descreva sua marca em poucas palavras..."
          value={data.brandDescription}
          onChange={(e) => update({ brandDescription: e.target.value })}
          rows={2}
          className="velora-input resize-none"
        />
        <textarea
          placeholder="O que você quer transmitir nessa campanha?"
          value={data.campaignGoal}
          onChange={(e) => update({ campaignGoal: e.target.value })}
          rows={2}
          className="velora-input resize-none"
        />
      </div>

      {/* File upload for "peca" */}
      {data.type === "peca" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
              dragOver ? "border-primary/60 bg-primary/5" : data.pieceFile ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/30"
            }`}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            {data.pieceFile ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-body">{data.pieceFile.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-body">
                  Arraste a foto da peça ou clique para enviar
                </p>
              </>
            )}
          </div>
          <textarea
            placeholder="Descreva o que você imagina para essa peça..."
            value={data.pieceDescription}
            onChange={(e) => update({ pieceDescription: e.target.value })}
            rows={2}
            className="velora-input resize-none"
          />
        </motion.div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="velora-btn-ghost">
          ← Voltar
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!canContinue}
          onClick={onNext}
          className="velora-btn-primary disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
        >
          Continuar
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepCampaign;
export type { CampaignData, CampaignType };
