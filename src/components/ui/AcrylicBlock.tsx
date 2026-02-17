import { ReactNode } from "react";

interface AcrylicBlockProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
}

export default function AcrylicBlock({
  children,
  className = "",
  borderColor,
}: AcrylicBlockProps) {
  return (
    <div
      className={`acrylic-block rounded-xl ${className}`}
      style={borderColor ? { borderLeftWidth: 2, borderLeftColor: borderColor } : undefined}
    >
      {children}
    </div>
  );
}
