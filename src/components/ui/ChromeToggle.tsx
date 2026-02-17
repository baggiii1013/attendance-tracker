"use client";

interface ChromeToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export default function ChromeToggle({
  checked,
  onChange,
  disabled = false,
  label,
}: ChromeToggleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span
          className={`text-[9px] font-mono uppercase ${
            checked ? "text-green-500" : "text-gray-600"
          }`}
        >
          {label}
        </span>
      )}
      <div
        className={`metal-toggle ${checked ? "checked" : ""} ${
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        }`}
        onClick={() => !disabled && onChange?.(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onChange?.(!checked);
          }
        }}
      >
        <div className="metal-toggle-knob" />
      </div>
    </div>
  );
}
