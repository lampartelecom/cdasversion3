import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ArrowLeft, Plus, GraduationCap, Calendar, FileText, QrCode,
  CheckCircle2, Loader2, ShieldCheck, Clock,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateQrDataUrl } from "@/lib/qr";
import { buildAttestationPdf, downloadPdf } from "@/lib/pdf";
import { computeDataHash, signDataHash, appendBlock } from "@/lib/blockchain";
import { sha256Hex } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({
  reference: z.string().trim().min(3).max(60),
  sub_reference: z.string().trim().max(60).optional(),
  holder_name: z.string().trim().min(2).max(120),
  holder_email: z.string().trim().email().optional().or(z.literal("")),
  sexe: z.string().trim().max(3).optional(),
  cni: z.string().trim().max(30).optional(),
  matricule: z.string().trim().max(30).optional(),
  birth_date: z.string().optional(),
  birth_place: z.string().trim().max(80).optional(),
  diploma_type: z.string().trim().min(2).max(80),
  specialization: z.string().trim().max(120).optional(),
  institution: z.string().trim().min(2).max(120),
  year: z.string().trim().regex(/^\d{4}(\/\d{4})?$/, "Format : 2025 ou 2025/2026"),
  mention: z.string().trim().max(30).optional(),
  grade_letter: z.string().trim().max(3).optional(),
  moyenne: z.string().optional(),
  credits: z.string().optional(),
  jury_session: z.string().trim().max(40).optional(),
  director_name: z.string().trim().max(80).optional(),
  verification_fee: z.coerce.number().int().min(0).max(1_000_000),
});

interface Diploma {
  id: string;
  reference: string;
  sub_reference: string | null;
  qr_token: string;
  attestation_number: string | null;
  holder_name: string;
  holder_email: string | null;
  sexe: string | null;
  cni: string | null;
  matricule: string | null;
  birth_date: string | null;
  birth_place: string | null;
  diploma_type: string;
  specialization: string | null;
  institution: string;
  year: string;
  mention: string | null;
  grade_letter: string | null;
  moyenne: number | null;
  credits: number | null;
  jury_session: string | null;
  director_name: string | null;
  status: string;
  verification_fee: number;
  pdf_hash: string | null;
  signature: string | null;
  validated_at: string | null;
  issued_by: string;
  created_at: string;
}

const MENTIONS = ["PASSABLE", "ASSEZ BIEN", "BIEN", "TRÈS BIEN", "EXCELLENT"];
const GRADES = ["", "A", "B", "C", "D", "E"];

export default function IssueDiploma() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    reference: "",
    sub_reference: "IUT/DA/DFI/CD/DSI/SCI",
    holder_name: "",
    holder_email: "",
    sexe: "M",
    cni: "",
    matricule: "",
    birth_date: "",
    birth_place: "",
    diploma_type: "Diplôme Universitaire De Technologie",
    specialization: "",
    institution: "UNIVERSITE DE DOUALA",
    year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    mention: "ASSEZ BIEN",
    grade_letter: "B",
    moyenne: "",
    credits: "120",
    jury_session: "Août 2025",
    director_name: "Pr. Jacques ETAME",
    verification_fee: "10000",
  });


  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("diplomas")
      .select("*")
      .eq("issued_by", user.id)
      .order("created_at", { ascending: false });
    setDiplomas((data ?? []) as unknown as Diploma[]);
  };

  useEffect(() => { load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const payload = parsed.data;
    const { error } = await supabase.from("diplomas").insert({
      issued_by: user!.id,
      reference: payload.reference,
      sub_reference: payload.sub_reference || null,
      holder_name: payload.holder_name,
      holder_email: payload.holder_email || null,
      sexe: payload.sexe || null,
      cni: payload.cni || null,
      matricule: payload.matricule || null,
      birth_date: payload.birth_date || null,
      birth_place: payload.birth_place || null,
      diploma_type: payload.diploma_type,
      specialization: payload.specialization || null,
      institution: payload.institution,
      year: payload.year,
      mention: payload.mention || null,
      grade_letter: payload.grade_letter || null,
      moyenne: payload.moyenne ? Number(payload.moyenne) : null,
      credits: payload.credits ? Number(payload.credits) : null,
      jury_session: payload.jury_session || null,
      director_name: payload.director_name || null,
      verification_fee: payload.verification_fee,
      status: "draft",
    } as never);

    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ce numéro de référence existe déjà" : error.message);
      return;
    }
    toast.success("Brouillon créé", { description: "Cliquez sur Valider & signer pour l'ancrer." });
    setOpen(false);
    load();
  };

  const validateAndSign = async (d: Diploma) => {
    if (!user) return;
    setValidatingId(d.id);
    try {
      // 1. Attestation number (deterministic from qr_token)
      const attestation_number = (d.attestation_number ?? d.qr_token.slice(0, 12)).toUpperCase();

      // 2. Canonical data hash + signature
      const dataHash = await computeDataHash({
        attestation_number,
        reference: d.reference,
        holder_name: d.holder_name,
        cni: d.cni,
        birth_date: d.birth_date,
        birth_place: d.birth_place,
        diploma_type: d.diploma_type,
        specialization: d.specialization,
        institution: d.institution,
        year: d.year,
        mention: d.mention,
        moyenne: d.moyenne,
        issued_by: d.issued_by,
      });
      const signature = await signDataHash(dataHash);

      // 3. Generate the official PDF
      const pdfBuf = await buildAttestationPdf({
        attestation_number,
        reference: d.reference,
        sub_reference: d.sub_reference,
        qr_token: d.qr_token,
        holder_name: d.holder_name,
        sexe: d.sexe,
        matricule: d.matricule,
        birth_date: d.birth_date,
        birth_place: d.birth_place,
        diploma_type: d.diploma_type,
        specialization: d.specialization,
        institution: d.institution,
        year: d.year,
        mention: d.mention,
        grade_letter: d.grade_letter,
        credits: d.credits,
        jury_session: d.jury_session,
        director_name: d.director_name,
        issued_at: new Date().toISOString(),
        pdf_hash: dataHash,
      });
      const pdf_hash = await sha256Hex(pdfBuf);

      // 4. Upload PDF to storage (path: {uid}/{diploma_id}.pdf)
      const path = `${user.id}/${d.id}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("diplomas")
        .upload(path, new Blob([pdfBuf], { type: "application/pdf" }), {
          upsert: true,
          contentType: "application/pdf",
        });
      if (upErr) throw upErr;

      // 5. Append to blockchain ledger
      await appendBlock({
        diploma_id: d.id,
        pdf_hash,
        signature,
        created_by: user.id,
      });

      // 6. Update diploma → active
      const { error: updErr } = await supabase
        .from("diplomas")
        .update({
          attestation_number,
          pdf_hash,
          signature,
          status: "active",
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        } as never)
        .eq("id", d.id);
      if (updErr) throw updErr;

      toast.success("Diplôme signé et ancré", {
        description: `Bloc ajouté au registre · Empreinte ${pdf_hash.slice(0, 12)}...`,
      });
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de validation";
      toast.error("Validation échouée", { description: msg });
    } finally {
      setValidatingId(null);
    }
  };

  const downloadDiploma = async (d: Diploma) => {
    const path = `${d.issued_by}/${d.id}.pdf`;
    const { data, error } = await supabase.storage.from("diplomas").download(path);
    if (error || !data) {
      toast.error("PDF introuvable dans le stockage");
      return;
    }
    downloadPdf(await data.arrayBuffer(), `attestation_${d.reference}.pdf`);
  };

  return (
    <MobileLayout>
      <div className="header-gradient px-4 pt-6 pb-6 safe-top">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-accent" />
          <span className="text-white font-bold">Émission de diplômes</span>
        </div>
        <p className="text-white/70 text-xs">Brouillon → Signature numérique → Blockchain CDAS</p>
      </div>

      <div className="px-4 -mt-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl gap-2">
              <Plus className="w-5 h-5" /> Nouveau brouillon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouveau diplôme (brouillon)</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="N° de référence" v={form.reference} onChange={(v) => setForm({ ...form, reference: v })} placeholder="2025I01030" />
                <Field label="Sous-référence" v={form.sub_reference} onChange={(v) => setForm({ ...form, sub_reference: v })} placeholder="IUT/DA/DFI/CD/DSI/SCI" />
              </div>
              <Field label="Nom complet du titulaire" v={form.holder_name} onChange={(v) => setForm({ ...form, holder_name: v })} placeholder="ANAFACK DONGMO FRANC ROCHINEL" />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sexe</Label>
                  <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option>M</option><option>F</option>
                  </select>
                </div>
                <Field label="CNI" v={form.cni} onChange={(v) => setForm({ ...form, cni: v })} placeholder="123456789" />
                <Field label="N° Matricule" v={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} placeholder="23I02030" />
              </div>
              <Field label="Email du titulaire" v={form.holder_email} onChange={(v) => setForm({ ...form, holder_email: v })} placeholder="email@exemple.cm" type="email" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date de naissance" v={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} type="date" />
                <Field label="Lieu de naissance" v={form.birth_place} onChange={(v) => setForm({ ...form, birth_place: v })} placeholder="FOTOMENA" />
              </div>
              <Field label="Type de diplôme" v={form.diploma_type} onChange={(v) => setForm({ ...form, diploma_type: v })} placeholder="Diplôme Universitaire De Technologie" />
              <Field label="Spécialité" v={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} placeholder="GENIE INFORMATIQUE" />
              <Field label="Institution" v={form.institution} onChange={(v) => setForm({ ...form, institution: v })} placeholder="UNIVERSITE DE DOUALA" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Année académique" v={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2024/2025" />
                <Field label="Jury (session)" v={form.jury_session} onChange={(v) => setForm({ ...form, jury_session: v })} placeholder="Août 2025" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Crédits" v={form.credits} onChange={(v) => setForm({ ...form, credits: v })} type="number" placeholder="120" />
                <div className="space-y-1">
                  <Label className="text-xs">Mention</Label>
                  <select value={form.mention} onChange={(e) => setForm({ ...form, mention: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {MENTIONS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Grade</Label>
                  <select value={form.grade_letter} onChange={(e) => setForm({ ...form, grade_letter: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {GRADES.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Moyenne / 20" v={form.moyenne} onChange={(v) => setForm({ ...form, moyenne: v })} type="number" placeholder="14.5" />
                <Field label="Frais vérif. (XAF)" v={form.verification_fee} onChange={(v) => setForm({ ...form, verification_fee: v })} type="number" />
              </div>
              <Field label="Nom du Directeur (signataire)" v={form.director_name} onChange={(v) => setForm({ ...form, director_name: v })} placeholder="Pr. Jacques ETAME" />
              <Button type="submit" disabled={submitting} className="w-full h-11 bg-primary text-primary-foreground">
                {submitting ? "Création..." : "Créer le brouillon"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 mt-6 pb-24 space-y-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
          Registre ({diplomas.length})
        </h3>
        {diplomas.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
            Aucun diplôme émis.
          </div>
        )}
        {diplomas.map((d) => {
          const isDraft = d.status === "draft";
          const isActive = d.status === "active";
          return (
            <div key={d.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <p className="font-semibold text-foreground truncate">
                      {d.diploma_type}{d.specialization && ` · ${d.specialization}`}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">{d.holder_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3" /> {d.reference}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {d.year} · {d.institution}
                  </p>
                  {d.pdf_hash && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
                      hash: {d.pdf_hash.slice(0, 24)}...
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                  isDraft ? "bg-warning/10 text-warning"
                  : isActive ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
                }`}>
                  {isDraft ? <><Clock className="w-3 h-3" /> Brouillon</>
                   : isActive ? <><ShieldCheck className="w-3 h-3" /> Signé</>
                   : "Révoqué"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {isDraft ? (
                  <Button
                    onClick={() => validateAndSign(d)}
                    disabled={validatingId === d.id}
                    className="h-9 col-span-2 bg-primary text-primary-foreground gap-2"
                  >
                    {validatingId === d.id
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Signature en cours...</>
                      : <><CheckCircle2 className="w-4 h-4" /> Valider &amp; signer</>}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const url = await generateQrDataUrl(d.qr_token, 320);
                      const a = document.createElement("a");
                      a.href = url; a.download = `qr_${d.reference}.png`; a.click();
                    }} className="h-9">
                      <QrCode className="w-4 h-4 mr-1" /> QR
                    </Button>
                    <Button size="sm" onClick={() => downloadDiploma(d)} className="h-9 bg-primary text-primary-foreground">
                      <FileText className="w-4 h-4 mr-1" /> PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}

function Field({ label, v, onChange, placeholder, type = "text" }: {
  label: string; v: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="h-10" />
    </div>
  );
}
