import { ButtonHTMLAttributes, ReactNode } from "react";

interface MetalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function MetalButton({
  children,
  className = "",
  ...props
}: MetalButtonProps) {
  return (
    <button
      className={`btn-metal rounded-full flex items-center justify-center active:scale-95 transition-transform duration-100 relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Brushed metal texture overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] " />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
