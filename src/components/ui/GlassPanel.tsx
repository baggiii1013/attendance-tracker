import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`glass-panel rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
