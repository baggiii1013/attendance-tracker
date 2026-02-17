"use client";

import Link from "next/link";

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

export function MaterialIcon({ name, className = "", filled = false, size = 24 }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1" : undefined,
      }}
    >
      {name}
    </span>
  );
}

interface IconButtonProps {
  icon: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function GlassIconButton({ icon, href, onClick, className = "", ariaLabel }: IconButtonProps) {
  const inner = (
    <>
      <MaterialIcon name={icon} size={20} />
    </>
  );

  const classes = `w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white/70 hover:text-white hover:bg-white/10 transition-colors ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
