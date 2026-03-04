import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

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
  { id: "avulsa" as CampaignType, label: "Campanha Avulsa", desc: "Uma campanha editorial completa para sua marca", icon: "🎯" },
  { id: "peca" as CampaignType, label: "Campanha por Peça", desc: "Fotos focadas em uma peça específica que você enviar", icon: "👗" },
  { id: "colecao" as CampaignType, label: "Mini Coleção", desc: "Conjunto de fotos para lançamento de coleção", icon: "✨" },
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
      className="space-y-6 max-w-lg mx-auto"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-display font-light tracking-wide velora-text-gradient">
          Detalhes da campanha
        </h2>
        <p className="text-muted-foreground font-body text-sm">
          Conte-nos sobre sua marca e o que deseja transmitir
        </p>
      </div>

      {/* Campaign type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campaignTypes.map((ct) => (
          <motion.button
            key={ct.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => update({ type: ct.id })}
            className={`p-4 rounded-lg border text-left transition-all ${
              data.type === ct.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-xl">{ct.icon}</span>
            <h4 className="font-display text-sm mt-1 text-foreground">{ct.label}</h4>
            <p className="text-[10px] text-muted-foreground font-body">{ct.desc}</p>
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
          className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <textarea
          placeholder="Descreva sua marca em poucas palavras..."
          value={data.brandDescription}
          onChange={(e) => update({ brandDescription: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />
        <textarea
          placeholder="O que você quer transmitir nessa campanha?"
          value={data.campaignGoal}
          onChange={(e) => update({ campaignGoal: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
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
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
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
            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-body">
              {data.pieceFile ? data.pieceFile.name : "Arraste a foto da peça ou clique para enviar"}
            </p>
          </div>
          <textarea
            placeholder="Descreva o que você imagina para essa peça..."
            value={data.pieceDescription}
            onChange={(e) => update({ pieceDescription: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 bg-card border border-border rounded-lg font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </motion.div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
          ← Voltar
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!canContinue}
          onClick={onNext}
          className="velora-gradient px-8 py-3 rounded-lg font-body text-sm font-medium text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          Continuar
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StepCampaign;
export type { CampaignData, CampaignType };
