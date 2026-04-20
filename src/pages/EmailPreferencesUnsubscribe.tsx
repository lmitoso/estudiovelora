import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Step = "initial" | "confirm" | "done" | "error";

const EmailPreferencesUnsubscribe = () => {
  const [params] = useSearchParams();
  const leadId = params.get("id");
  const isValidId = leadId && /^[0-9a-f-]{36}$/i.test(leadId);

  const [step, setStep] = useState<Step>("initial");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("unsubscribe-lead", {
        body: { id: leadId },
      });
      if (error || !data?.ok) {
        setStep("error");
      } else {
        setStep("done");
      }
    } catch {
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-16"
      style={{
        backgroundColor: "#080808",
        color: "#fafaf7",
        fontFamily: "'Raleway', sans-serif",
      }}
    >
      <header className="w-full flex justify-center pt-4">
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#C9A96E",
            fontSize: "1.25rem",
            letterSpacing: "0.4em",
            fontWeight: 300,
          }}
        >
          VELORA
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-xl text-center">
        {!isValidId ? (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.5rem",
              color: "#fafaf7",
              fontStyle: "italic",
              opacity: 0.85,
            }}
          >
            Link inválido ou expirado.
          </p>
        ) : step === "done" ? (
          <>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.5rem",
                fontWeight: 300,
                marginBottom: "1.5rem",
                color: "#fafaf7",
              }}
            >
              Feito.
            </h1>
            <p style={{ lineHeight: 1.8, opacity: 0.85, fontSize: "1rem" }}>
              Você foi removido da nossa lista.
            </p>
          </>
        ) : step === "error" ? (
          <p style={{ lineHeight: 1.8, opacity: 0.85, fontSize: "1rem", fontStyle: "italic" }}>
            Não foi possível concluir. Tente novamente em alguns instantes.
          </p>
        ) : (
          <>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.75rem",
                fontWeight: 300,
                marginBottom: "1.5rem",
                color: "#fafaf7",
                letterSpacing: "0.02em",
              }}
            >
              Preferências de email
            </h1>
            <p
              style={{
                lineHeight: 1.8,
                opacity: 0.75,
                fontSize: "1rem",
                maxWidth: "32rem",
                marginBottom: "3rem",
              }}
            >
              Se quiser, pode cancelar o recebimento dos nossos emails abaixo.
            </p>

            {step === "initial" && (
              <button
                onClick={() => setStep("confirm")}
                style={{
                  backgroundColor: "#C9A96E",
                  color: "#080808",
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: "0.875rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "1rem 2.5rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Cancelar inscrição
              </button>
            )}

            {step === "confirm" && (
              <div className="flex flex-col items-center gap-8">
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.35rem",
                    fontStyle: "italic",
                    lineHeight: 1.6,
                    maxWidth: "30rem",
                    color: "#fafaf7",
                    opacity: 0.9,
                  }}
                >
                  Tem certeza? Você não receberá mais nenhum email do Estúdio Velora.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{
                      backgroundColor: "#C9A96E",
                      color: "#080808",
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: "0.875rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "1rem 2.25rem",
                      border: "none",
                      cursor: loading ? "wait" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Cancelando..." : "Sim, cancelar"}
                  </button>
                  <button
                    onClick={() => setStep("initial")}
                    disabled={loading}
                    style={{
                      backgroundColor: "transparent",
                      color: "#fafaf7",
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: "0.875rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "1rem 2.25rem",
                      border: "1px solid rgba(250,250,247,0.4)",
                      cursor: loading ? "wait" : "pointer",
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: 0.5,
          color: "#fafaf7",
        }}
      >
        Estúdio Velora · São Paulo · Brasil
      </footer>

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Raleway:wght@300;400;500&display=swap" rel="stylesheet" />
    </div>
  );
};

export default EmailPreferencesUnsubscribe;
