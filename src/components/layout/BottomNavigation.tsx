import { Home, QrCode, FileText, History, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNavigation() {
  const location = useLocation();
  const { role } = useAuth();

  const items = [
    { icon: Home, label: "Accueil", path: "/" },
    role === "verifier"
      ? { icon: QrCode, label: "Scanner", path: "/scanner" }
      : role === "university"
      ? { icon: FileText, label: "Émettre", path: "/issue" }
      : { icon: FileText, label: "Mes diplômes", path: "/my-diplomas" },
    { icon: History, label: "Historique", path: "/history" },
    { icon: User, label: "Profil", path: "/profile" },
  ];

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around py-2">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "animate-scale-in")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
