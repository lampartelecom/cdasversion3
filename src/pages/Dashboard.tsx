import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, QrCode, FileText, Clock, History, Settings, CheckCircle2, HelpCircle, User, Plus,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CircularProgress } from "@/components/ui/circular-progress";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  total: number;
  authentic: number;
  invalid: number;
  notFound: number;
  monthly: { month: string; value: number }[];
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, role, user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, authentic: 0, invalid: 0, notFound: 0, monthly: [] });
  const [diplomasCount, setDiplomasCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Verifications stats (the user is the verifier OR diploma stakeholder)
      const { data: verifs } = await supabase
        .from("verifications")
        .select("result, created_at")
        .order("created_at", { ascending: false });

      const authentic = verifs?.filter((v) => v.result === "authentic").length ?? 0;
      const invalid = verifs?.filter((v) => v.result === "invalid").length ?? 0;
      const notFound = verifs?.filter((v) => v.result === "not_found").length ?? 0;

      // Monthly aggregates (last 7 months)
      const buckets: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets[`${d.getFullYear()}-${d.getMonth()}`] = 0;
      }
      verifs?.forEach((v) => {
        const d = new Date(v.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in buckets) buckets[key]++;
      });
      const monthly = Object.entries(buckets).map(([k, value]) => {
        const [, m] = k.split("-").map(Number);
        return { month: MONTHS[m], value };
      });

      setStats({ total: verifs?.length ?? 0, authentic, invalid, notFound, monthly });

      // Role-specific counts
      if (role === "university") {
        const { count } = await supabase
          .from("diplomas")
          .select("*", { count: "exact", head: true })
          .eq("issued_by", user.id);
        setDiplomasCount(count ?? 0);
      } else if (role === "student") {
        const { count } = await supabase
          .from("diplomas")
          .select("*", { count: "exact", head: true })
          .eq("holder_user_id", user.id);
        setDiplomasCount(count ?? 0);
      }
    })();
  }, [user, role]);

  const total = stats.total || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  const greeting = profile?.full_name?.split(" ")[0]?.toUpperCase() || "UTILISATEUR";
  const roleLabel =
    role === "university" ? "Institution" : role === "verifier" ? "Vérificateur" : "Étudiant";

  return (
    <MobileLayout>
      <div className="header-gradient px-4 pt-6 pb-8 safe-top">
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="text-white font-bold">CDAS</span>
          </div>
          <button onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 bg-success/20 text-success text-xs font-medium px-3 py-1 rounded-full border border-success/30">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {roleLabel}
          </span>
        </div>

        <h1 className="text-white font-bold text-lg animate-fade-in">BIENVENUE, {greeting}</h1>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 animate-slide-up">
          <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
            Statistiques de Vérification
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <CircularProgress value={pct(stats.authentic)} color="success" sublabel="Authentiques" />
            <CircularProgress value={pct(stats.invalid)} color="warning" sublabel="Invalides" />
            <CircularProgress value={pct(stats.notFound)} color="destructive" sublabel="Introuvables" />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
              Vérifications par mois
            </h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(45, 95%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Role context card */}
      {role !== "verifier" && (
        <div className="px-4 mt-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {role === "university" ? "Diplômes émis" : "Mes diplômes"}
                </p>
                <p className="text-3xl font-bold text-foreground">{diplomasCount}</p>
              </div>
              <button
                onClick={() => navigate(role === "university" ? "/issue" : "/my-diplomas")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium"
              >
                {role === "university" ? "Gérer" : "Voir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 mt-4 pb-4">
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <button onClick={() => navigate("/scanner")}
            className="flex items-center gap-3 bg-success text-success-foreground rounded-xl p-4">
            <QrCode className="w-6 h-6" />
            <span className="text-sm font-semibold">Scanner</span>
          </button>

          {role === "university" ? (
            <button onClick={() => navigate("/issue")}
              className="flex items-center gap-3 bg-info text-info-foreground rounded-xl p-4">
              <Plus className="w-6 h-6" />
              <span className="text-sm font-semibold">Émettre</span>
            </button>
          ) : (
            <button onClick={() => navigate(role === "student" ? "/my-diplomas" : "/scanner")}
              className="flex items-center gap-3 bg-info text-info-foreground rounded-xl p-4">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-sm font-semibold">{role === "student" ? "Mes diplômes" : "Vérifier"}</span>
            </button>
          )}

          <button onClick={() => navigate("/history")}
            className="flex items-center gap-3 bg-warning text-warning-foreground rounded-xl p-4">
            <Clock className="w-6 h-6" />
            <span className="text-sm font-semibold">Historique</span>
          </button>

          <button onClick={() => navigate("/profile")}
            className="flex items-center gap-3 bg-secondary text-secondary-foreground rounded-xl p-4">
            <Settings className="w-6 h-6" />
            <span className="text-sm font-semibold">Paramètres</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-24">
        <button className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground rounded-xl p-3 font-semibold">
          <HelpCircle className="w-5 h-5" />
          AIDE & SUPPORT
        </button>
      </div>
    </MobileLayout>
  );
}
