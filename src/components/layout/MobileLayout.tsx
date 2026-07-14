import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  return (
    <div className="mobile-container relative">
      <div className={showNav ? "pb-20" : ""}>
        {children}
      </div>
      {showNav && <BottomNavigation />}
    </div>
  );
}
