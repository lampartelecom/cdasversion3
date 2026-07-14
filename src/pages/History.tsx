import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Filter } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Filter = "all" | "authentic" | "invalid" | "not_found";

interface Verification {
  id: string;
  result: "authentic" | "invalid" | "not_found";
  query_value: string;
  query_type: string;
  paid: boolean;
  amount: number;
  created_at: string;
  diploma_id: string | null;
  diplomas?: { holder_name: string; diploma_type: string; reference: string } | null;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Verification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("verifications")
        .select("*, diplomas(holder_name, diploma_type, reference)")
        .order("created_at", { ascending: false })
        .limit(200);
      setItems((data ?? []) as Verification[]);
      setLoading(false);
    })();
  }, [user]);

  const filtered = filter === "all" ? items : items.filter((i) => i.result === filter);

  const meta = (r: string) => {
    if (r === "authentic") return { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Authentique" };
    if (r === "invalid") return { Icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", label: "Invalide" };
    return { Icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Introuvable" };
  };

  const filters: { v: Filter; label: string }[] = [
    { v: "all", label: "Tout" },
    { v: "authentic", label: "Authentiques" },
    { v: "invalid", label: "Invalides" },
    { v: "not_found", label: "Introuvables" },
  ];

  return (
    <MobileLayout>
      <div className="header-gradient px-4 pt-6 pb-6 safe-top">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-accent" />
          <span className="text-white font-bold">Historique des vérifications</span>
        </div>
        <p className="text-white/70 text-xs">{items.length} vérification(s)</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-card border border-border rounded-xl p-2 flex gap-1 overflow-x-auto">
          {filters.map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 pb-24 space-y-2">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border rounded-xl">
            Aucune vérification pour ce filtre.
          </div>
        )}
        {filtered.map((v) => {
          const { Icon, color, bg, label } = meta(v.result);
          return (
            <div key={v.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  {v.diplomas ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">
                        {v.diplomas.holder_name} — {v.diplomas.diploma_type}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{v.diplomas.reference}</p>
                    </>
                  ) : (
                    <p className="text-sm text-foreground truncate">
                      Recherche : <span className="font-mono text-xs">{v.query_value}</span>
                    </p>
                  )}
                  {v.amount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {v.amount.toLocaleString()} XAF · {v.paid ? "✓ Payé" : "Non payé"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}
