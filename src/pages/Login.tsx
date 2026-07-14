import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield, HelpCircle, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/contexts/AuthContext";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, "Minimum 6 caractères").max(100),
  role: z.enum(["student", "verifier", "university"]),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [role, setRole] = useState<AppRole>("student");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Identifiants incorrects" : error.message);
      return;
    }
    toast.success("Connexion réussie");
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ fullName, email: signupEmail, phone, password: signupPassword, role });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone, role },
      },
    });
    setIsLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Cet email est déjà utilisé" : error.message);
      return;
    }
    toast.success("Compte créé !", { description: "Vous pouvez maintenant vous connecter." });
    setTab("login");
    setEmail(signupEmail);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="header-gradient px-6 pt-12 pb-8 safe-top">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <span className="text-white font-bold text-lg">CDAS</span>
        </div>
        <p className="text-white/80 text-xs uppercase tracking-wider">
          CAMEROON DIPLOMA AUTHENTICATION SYSTEM
        </p>
      </div>

      <div className="flex-1 px-6 pt-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 animate-slide-up">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com" className="h-12 rounded-xl pl-10" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="h-12 rounded-xl pl-10 pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl"
                  disabled={isLoading}>
                  {isLoading ? "Connexion..." : "SE CONNECTER"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nom complet" className="h-12 rounded-xl pl-10" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Email" className="h-12 rounded-xl pl-10" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone (optionnel)" className="h-12 rounded-xl pl-10" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Mot de passe (6+ caractères)" className="h-12 rounded-xl pl-10" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Je suis :</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="student" id="r-student" />
                      <div>
                        <p className="font-medium text-sm">Étudiant / Diplômé</p>
                        <p className="text-xs text-muted-foreground">Voir mes diplômes, télécharger mon attestation</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="verifier" id="r-verifier" />
                      <div>
                        <p className="font-medium text-sm">Employeur / Vérificateur</p>
                        <p className="text-xs text-muted-foreground">Scanner et vérifier des diplômes</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="university" id="r-university" />
                      <div>
                        <p className="font-medium text-sm">Université / Institution</p>
                        <p className="text-xs text-muted-foreground">Émettre et gérer les diplômes</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl"
                  disabled={isLoading}>
                  {isLoading ? "Création..." : "CRÉER MON COMPTE"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 text-center pb-8">
          <button className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            Aide & Support
          </button>
        </div>
      </div>
    </div>
  );
}
