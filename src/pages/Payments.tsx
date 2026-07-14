import { useState } from "react";
import { Shield, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  title: string;
  date: string;
  time: string;
  amount: number;
  status: "success" | "expired" | "pending" | "free";
}

const payments: Payment[] = [
  {
    id: "1",
    title: "Vérification Diplôme Licence",
    date: "21.18.28",
    time: "10:45 AM",
    amount: 30000,
    status: "expired",
  },
  {
    id: "2",
    title: "Vérification Diplôme Licence",
    date: "20.03.24",
    time: "11:30 AM",
    amount: 0,
    status: "success",
  },
  {
    id: "3",
    title: "Réabonnement Service Premium",
    date: "19.05.24",
    time: "09:15 AM",
    amount: 10000,
    status: "pending",
  },
  {
    id: "4",
    title: "Réabonnement Service Premium",
    date: "18.02.24",
    time: "14:20 PM",
    amount: 10000,
    status: "success",
  },
];

const statusConfig = {
  success: {
    icon: CheckCircle2,
    label: "Succès",
    className: "text-success",
    bgClass: "bg-success/10",
  },
  expired: {
    icon: XCircle,
    label: "Expiré",
    className: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  pending: {
    icon: Clock,
    label: "10 000 XAF",
    className: "text-warning",
    bgClass: "bg-warning/10",
  },
  free: {
    icon: CheckCircle2,
    label: "Gratuit",
    className: "text-info",
    bgClass: "bg-info/10",
  },
};

export default function Payments() {
  const stats = {
    paid: 95,
    pending: 3,
    expired: 2,
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="header-gradient px-4 pt-6 pb-6 safe-top">
        <div className="flex items-center gap-3 mb-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <span className="text-white font-bold">CDAS</span>
        </div>
        <h1 className="text-lg font-bold text-white animate-fade-in">
          Historique des Paiements
        </h1>
      </div>

      {/* Stats Section */}
      <div className="px-4 -mt-2">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 animate-slide-up">
          <div className="grid grid-cols-3 gap-2">
            <CircularProgress
              value={stats.paid}
              color="success"
              sublabel="Service à Paye"
              size={70}
            />
            <CircularProgress
              value={stats.pending}
              color="warning"
              sublabel="En Attente"
              size={70}
            />
            <CircularProgress
              value={stats.expired}
              color="destructive"
              sublabel="Non Vérifié"
              size={70}
            />
          </div>
        </div>
      </div>

      {/* Period Label */}
      <div className="px-4 mt-4">
        <p className="text-sm font-semibold text-foreground">Octobre 2024</p>
        <p className="text-xs text-muted-foreground text-right -mt-4">TOUS STATUT</p>
      </div>

      {/* Payment List */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {payments.map((payment, index) => {
          const config = statusConfig[payment.status];
          const Icon = config.icon;

          return (
            <div
              key={payment.id}
              className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up flex items-center gap-3"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bgClass)}>
                <Icon className={cn("w-5 h-5", config.className)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">
                  {payment.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {payment.date} {payment.time}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("text-sm font-semibold", config.className)}>
                  {payment.status === "pending" 
                    ? `${payment.amount.toLocaleString()} XAF`
                    : config.label
                  }
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}
