import { useState } from "react";
import { Shield, ArrowLeft, ChevronRight, User, Edit3 } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { profile, role, user, signOut } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const roleLabel = role === "university" ? "Institution" : role === "verifier" ? "Vérificateur" : "Étudiant";

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="header-gradient px-4 pt-6 pb-16 safe-top">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white font-bold">Profil</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Profile Card */}
        <div className="px-4 -mt-12">
          <div className="bg-card rounded-xl border border-border shadow-lg p-6 text-center relative animate-slide-up">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-card">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-lg font-bold text-foreground">{profile?.full_name || "Utilisateur"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
            Informations Personnelles
          </h3>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border">
              <span className="text-sm text-foreground">Date Complète</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <span className="text-sm text-foreground">Numéro CNI</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
            Paramètres du Compte
          </h3>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm text-foreground">Authentification à deux facteurs</span>
              <Switch 
                checked={twoFactorEnabled} 
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border">
              <span className="text-sm text-foreground">Changer le Mot Passe</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border">
              <span className="text-sm text-foreground">Conditions | Mot Support</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <span className="text-sm text-foreground">Politiques Générales</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-auto px-4 pb-24 pt-6">
          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="destructive"
            className="w-full h-12 font-semibold"
          >
            SE DÉCONNECTER
          </Button>
        </div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-xs mx-auto rounded-xl">
            <div className="header-gradient -mx-6 -mt-6 px-6 py-4 rounded-t-xl mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <span className="text-white font-bold text-sm">CDAS</span>
                  <p className="text-white/70 text-[10px]">CAMEROON DIPLOMA AUTHENTICATION SYSTEM</p>
                </div>
              </div>
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl">Déconnexion</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <AlertDialogAction 
                onClick={handleLogout}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                SE DÉCONNECTER
              </AlertDialogAction>
              <AlertDialogCancel className="w-full">
                Annuler
              </AlertDialogCancel>
            </AlertDialogFooter>
            <div className="text-center mt-2">
              <button className="text-xs text-primary hover:underline">
                Aide & Support 
              </button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
}
