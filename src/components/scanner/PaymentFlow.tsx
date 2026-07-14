import { useState } from "react";
import { ArrowLeft, CreditCard, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiplomaData } from "./DiplomaResult";

interface PaymentFlowProps {
  diploma: DiplomaData;
  onBack: () => void;
  onPaymentComplete: () => void;
}

type PaymentMethod = "orange" | "mtn" | "card";
type PaymentStep = "method" | "processing" | "success";

export function PaymentFlow({ diploma, onBack, onPaymentComplete }: PaymentFlowProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<PaymentStep>("method");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handlePayment = () => {
    if (!selectedMethod || !phoneNumber) return;
    
    setStep("processing");
    
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
    }, 3000);
  };

  if (step === "processing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Traitement en cours</h2>
        <p className="text-sm text-muted-foreground text-center">
          Veuillez confirmer le paiement sur votre téléphone...
        </p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Paiement réussi !</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Votre diplôme a été vérifié avec succès.
        </p>
        <div className="bg-card rounded-xl border border-border p-4 w-full max-w-xs mb-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Montant payé</p>
            <p className="text-2xl font-bold text-foreground">{diploma.verificationFee.toLocaleString()} XAF</p>
          </div>
        </div>
        <Button 
          onClick={onPaymentComplete}
          className="w-full max-w-xs h-12 bg-primary text-primary-foreground font-semibold"
        >
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Paiement</h1>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Amount */}
        <div className="bg-primary/5 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Montant à payer</p>
          <p className="text-3xl font-bold text-primary">{diploma.verificationFee.toLocaleString()} XAF</p>
          <p className="text-xs text-muted-foreground mt-1">Vérification: {diploma.type}</p>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Mode de paiement</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedMethod("orange")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                selectedMethod === "orange"
                  ? "border-warning bg-warning/5"
                  : "border-border hover:border-warning/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-warning-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Orange</span>
            </button>

            <button
              onClick={() => setSelectedMethod("mtn")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                selectedMethod === "mtn"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">MTN</span>
            </button>

            <button
              onClick={() => setSelectedMethod("card")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                selectedMethod === "card"
                  ? "border-info bg-info/5"
                  : "border-border hover:border-info/50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-info flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-info-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Carte</span>
            </button>
          </div>
        </div>

        {/* Phone Number Input */}
        {selectedMethod && selectedMethod !== "card" && (
          <div className="animate-fade-in">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="6XXXXXXXX"
              className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        )}

        {selectedMethod === "card" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Numéro de carte
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                onChange={() => setPhoneNumber("card")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Expiration
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pay Button */}
      <div className="p-4 border-t border-border">
        <Button 
          onClick={handlePayment}
          disabled={!selectedMethod || !phoneNumber}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold disabled:opacity-50"
        >
          Payer {diploma.verificationFee.toLocaleString()} XAF
        </Button>
      </div>
    </div>
  );
}
