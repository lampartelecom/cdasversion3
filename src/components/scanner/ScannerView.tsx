import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";

interface ScannerViewProps {
  isScanning: boolean;
  onScanComplete: () => void;
}

export function ScannerView({ isScanning, onScanComplete }: ScannerViewProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isScanning) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(onScanComplete, 300);
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [isScanning, onScanComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* QR Frame */}
      <div className="relative animate-pulse-soft mb-8">
        <div className="w-56 h-56 relative">
          {/* Dashed border effect */}
          <div className="absolute inset-4 border-2 border-dashed border-info/40 rounded-lg" />
          
          {/* Top left corner */}
          <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-info rounded-tl-lg" />
          {/* Top right corner */}
          <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-info rounded-tr-lg" />
          {/* Bottom left corner */}
          <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-info rounded-bl-lg" />
          {/* Bottom right corner */}
          <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-info rounded-br-lg" />

          {/* Inner frame lines */}
          <div className="absolute inset-8 flex items-center justify-center">
            <div className="w-full h-full relative">
              <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-info/60" />
              <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-info/60" />
              <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-info/60" />
              <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-info/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-4 w-full max-w-xs">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
          CADREZ LE QR CODE DU DIPLÔME
        </h2>
        
        {/* Progress bar */}
        <ProgressBar value={isScanning ? progress : 0} color="info" showAnimation={isScanning} />
        
        <p className="text-xs text-muted-foreground">
          {isScanning ? "ANALYSE EN COURS..." : "Alignez le cadre avec le QR code"}
        </p>
      </div>
    </div>
  );
}
