import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, GraduationCap, Download, QrCode, Calendar, Building2, ShieldCheck } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadPdf } from "@/lib/pdf";
import { generateQrDataUrl } from "@/lib/qr";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Diploma {
  id: string;
  reference: string;
  qr_token: string;
  attestation_number: string | null;
  holder_name: string;
  diploma_type: string;
  specialization: string | null;
  institution: string;
  year: string;
  mention: string | null;
  status: string;
  pdf_hash: string | null;
  issued_by: string;
  created_at: string;
}

export default function MyDiplomas() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkRef, setLinkRef] = useState("");
  const [qrModal, setQrModal] = useState<{ url: string; ref: string } | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("diplomas")
      .select("*")
      .eq("holder_user_id", user.id)
      .order("created_at", { ascending: false });
    setDiplomas((data ?? []) as unknown as Diploma[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const claimByReference = async () => {
    if (!linkRef.trim() || !user) return;
    const { data: { user: u } } = await supabase.auth.getUser();
    const email = u?.email;
    if (!email) { toast.error("Email indisponible"); return; }
    const { data, error } = await supabase
      .from("diplomas")
      .update({ holder_user_id: user.id } as never)
      .eq("reference", linkRef.trim())
      .eq("holder_email", email)
      .is("holder_user_id", null)
      .select();
    if (error || !data || data.length === 0) {
      toast.error("Aucun diplôme correspondant", {
        description: "Vérifiez le numéro de référence et votre email.",
      });
      return;
    }
    toast.success("Diplôme rattaché à votre compte !");
    setLinkRef("");
    load();
  };

  const downloadAttestation = async (d: Diploma) => {
    const path = `${d.issued_by}/${d.id}.pdf`;
    const { data, error } = await supabase.storage.from("diplomas").download(path);
    if (error || !data) {
      toast.error("PDF non disponible", { description: "Le diplôme n'est pas encore signé." });
      return;
    }
    downloadPdf(await data.arrayBuffer(), `attestation_${d.reference}.pdf`);
    toast.success("Attestation téléchargée");
  };

  const showQr = async (d: Diploma) => {
    const url = await generateQrDataUrl(d.qr_token, 320);
    setQrModal({ url, ref: d.reference });
  };

  return (
    <MobileLayout>
      <div className="header-gradient px-4 pt-6 pb-6 safe-top">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-accent" />
          <span className="text-white font-bold">Mes diplômes</span>
        </div>
        <p className="text-white/70 text-xs">{profile?.full_name}</p>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-foreground uppercase mb-2">Rattacher un diplôme</p>
          <p className="text-xs text-muted-foreground mb-3">
            Saisissez le numéro de référence reçu de votre université. Votre email doit correspondre.
          </p>
          <div className="flex gap-2">
            <Input value={linkRef} onChange={(e) => setLinkRef(e.target.value)} placeholder="IUT-2026-ATT-..." className="h-10" />
            <Button onClick={claimByReference} className="h-10 bg-primary text-primary-foreground">Rattacher</Button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-24 space-y-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
          Mes diplômes ({diplomas.length})
        </h3>
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}
        {!loading && diplomas.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
            Aucun diplôme rattaché.
          </div>
        )}
        {diplomas.map((d) => (
          <div key={d.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{d.diploma_type}</p>
                <p className="text-xs text-muted-foreground truncate">{d.specialization}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                d.status === "active" ? "bg-success/10 text-success"
                : d.status === "draft" ? "bg-warning/10 text-warning"
                : "bg-destructive/10 text-destructive"
              }`}>
                {d.status === "active" ? <><ShieldCheck className="w-3 h-3" /> Signé</>
                 : d.status === "draft" ? "En attente"
                 : "Révoqué"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <p className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {d.institution}</p>
              <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {d.year}</p>
              <p className="font-mono">{d.reference}</p>
              {d.pdf_hash && <p className="font-mono text-[10px]">hash: {d.pdf_hash.slice(0, 24)}...</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => showQr(d)} className="h-9">
                <QrCode className="w-4 h-4 mr-1" /> QR
              </Button>
              <Button size="sm" onClick={() => downloadAttestation(d)}
                disabled={d.status !== "active"}
                className="h-9 bg-primary text-primary-foreground">
                <Download className="w-4 h-4 mr-1" /> Attestation
              </Button>
            </div>
          </div>
        ))}
      </div>

      {qrModal && (
        <div onClick={() => setQrModal(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-muted-foreground mb-2">{qrModal.ref}</p>
            <img src={qrModal.url} className="mx-auto w-64 h-64" alt="QR" />
            <p className="text-xs text-muted-foreground mt-3">À présenter à un vérificateur CDAS</p>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
