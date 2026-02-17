interface LedStripProps {
  total?: number;
  active: number;
  color?: "green" | "yellow" | "red" | "blue";
  className?: string;
}

export default function LedStrip({
  total = 10,
  active,
  color = "green",
  className = "",
}: LedStripProps) {
  const colorClass = `active-${color}`;

  return (
    <div className={`led-strip ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`led-segment ${i < active ? colorClass : ""}`}
        />
      ))}
    </div>
  );
}
