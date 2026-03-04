import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StepGenerating from "@/components/velora/StepGenerating";
import SuccessPage from "@/components/velora/SuccessPage";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");

  const [status, setStatus] = useState<"verifying" | "generating" | "done" | "error">("verifying");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!sessionId || !orderId) {
      setStatus("error");
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId, orderId },
        });

        if (error || !data?.success) {
          toast({ title: "Erro", description: "Pagamento não confirmado.", variant: "destructive" });
          setStatus("error");
          return;
        }

        // Get order email for success page
        const { data: order } = await supabase
          .from("orders")
          .select("email")
          .eq("id", orderId)
          .single();

        if (order?.email) setEmail(order.email);
        setStatus("generating");
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId, orderId]);

  const handleGenComplete = useCallback(() => {
    setStatus("done");
  }, []);

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
          <h2 className="font-display text-xl velora-text-gradient tracking-wider">Confirmando pagamento...</h2>
          <p className="text-muted-foreground text-sm font-body">Aguarde um momento</p>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 max-w-md">
          <h2 className="font-display text-2xl text-foreground">Erro no pagamento</h2>
          <p className="text-muted-foreground text-sm font-body">
            Não foi possível confirmar seu pagamento. Entre em contato conosco pelo Instagram.
          </p>
          <a href="https://www.instagram.com/velora.direction/" target="_blank" rel="noopener noreferrer" className="velora-btn-primary px-8 py-3 inline-block">
            Falar conosco
          </a>
        </motion.div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SuccessPage email={email} />
      </div>
    );
  }

  // generating
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
      <div className="w-full max-w-2xl">
        {orderId && <StepGenerating orderId={orderId} onComplete={handleGenComplete} />}
      </div>
    </div>
  );
};

export default PaymentSuccess;
