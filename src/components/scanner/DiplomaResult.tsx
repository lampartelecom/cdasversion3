import { CheckCircle2, XCircle, AlertCircle, FileText, GraduationCap, Building2, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DiplomaData {
  id: string;
  type: string;
  holder: string;
  institution: string;
  year: string;
  specialization: string;
  isValid: boolean;
  verificationStatus: "verified" | "pending" | "rejected";
  verificationFee: number;
}

interface DiplomaResultProps {
  diploma: DiplomaData;
  onProceedToPayment: () => void;
  onNewScan: () => void;
}

export function DiplomaResult({ diploma, onProceedToPayment, onNewScan }: DiplomaResultProps) {
  const statusConfig = {
    verified: {
      icon: CheckCircle2,
      label: "Vérifié",
      color: "text-success",
      bg: "bg-success/10",
    },
    pending: {
      icon: AlertCircle,
      label: "En attente de paiement",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    rejected: {
      icon: XCircle,
      label: "Rejeté",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  };

  const status = statusConfig[diploma.verificationStatus];
  const StatusIcon = status.icon;

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Status Header */}
      <div className={cn("rounded-xl p-4 mb-4", status.bg)}>
        <div className="flex items-center gap-3">
          <StatusIcon className={cn("w-8 h-8", status.color)} />
          <div>
            <h3 className={cn("font-bold text-lg", status.color)}>{status.label}</h3>
            <p className="text-xs text-muted-foreground">
              {diploma.isValid ? "Diplôme authentique" : "Diplôme non reconnu"}
            </p>
          </div>
        </div>
      </div>

      {/* Diploma Details Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 space-y-4 flex-1">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">{diploma.type}</h4>
            <p className="text-xs text-muted-foreground">{diploma.specialization}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Titulaire</p>
              <p className="text-sm font-medium text-foreground">{diploma.holder}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Institution</p>
              <p className="text-sm font-medium text-foreground">{diploma.institution}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Année d'obtention</p>
              <p className="text-sm font-medium text-foreground">{diploma.year}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Numéro de référence</p>
              <p className="text-sm font-medium text-foreground">{diploma.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-3">
        {diploma.verificationStatus === "pending" && (
          <Button 
            onClick={onProceedToPayment}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold"
          >
            Procéder au paiement ({diploma.verificationFee.toLocaleString()} XAF)
          </Button>
        )}
        <Button 
          onClick={onNewScan}
          variant={diploma.verificationStatus === "pending" ? "outline" : "default"}
          className={cn(
            "w-full h-12 font-semibold",
            diploma.verificationStatus !== "pending" && "bg-primary text-primary-foreground"
          )}
        >
          Scanner un autre diplôme
        </Button>
      </div>
    </div>
  );
}
