import { ButtonHTMLAttributes, ReactNode } from "react";

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "coral";
  className?: string;
}

export default function ClayButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ClayButtonProps) {
  const baseClass =
    variant === "coral" ? "btn-coral" : "btn-clay";

  return (
    <button
      className={`${baseClass} relative overflow-hidden rounded-2xl font-bold text-white uppercase tracking-wider transition-transform active:scale-[0.98] ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Top shine effect */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
    </button>
  );
}
