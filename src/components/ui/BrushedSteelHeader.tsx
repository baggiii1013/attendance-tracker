import { ReactNode } from "react";

interface BrushedSteelHeaderProps {
  children: ReactNode;
  className?: string;
}

export default function BrushedSteelHeader({
  children,
  className = "",
}: BrushedSteelHeaderProps) {
  return (
    <header
      className={`brushed-steel-panel pt-8 pb-4 px-6 relative z-30 ${className}`}
    >
      {/* Decorative screw heads */}
      <div className="absolute top-2 left-2 screw-head" />
      <div className="absolute top-2 right-2 screw-head" />
      <div className="absolute bottom-2 left-2 screw-head" />
      <div className="absolute bottom-2 right-2 screw-head" />
      {children}
    </header>
  );
}
