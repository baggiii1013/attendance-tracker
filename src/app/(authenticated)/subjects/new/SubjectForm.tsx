"use client";

import { GlassIconButton, MaterialIcon } from "@/components/ui/Icons";
import TimeDial from "@/components/ui/TimeDial";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TIMES = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00",
];

const DAYS = [
  { key: "Mon", label: "M" },
  { key: "Tue", label: "T" },
  { key: "Wed", label: "W" },
  { key: "Thu", label: "T" },
  { key: "Fri", label: "F" },
  { key: "Sat", label: "S" },
  { key: "Sun", label: "S" },
];

const COLORS = ["#805af2", "#4D79FF", "#FF4D4D", "#22c55e", "#eab308", "#ec4899"];

export interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface SubjectFormProps {
  initialData?: {
    _id?: string;
    name: string;
    slots: ScheduleSlot[];
    color: string;
  };
}

export default function SubjectForm({ initialData }: SubjectFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?._id;

  const [name, setName] = useState(initialData?.name || "");
  const [slots, setSlots] = useState<ScheduleSlot[]>(
    initialData?.slots?.length
      ? initialData.slots
      : [{ day: "Mon", startTime: "09:00", endTime: "10:30" }]
  );
  const [color, setColor] = useState(initialData?.color || "#805af2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { day: "Mon", startTime: "09:00", endTime: "10:30" },
    ]);
    setActiveSlotIndex(slots.length);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setActiveSlotIndex(Math.max(0, activeSlotIndex - 1));
  };

  const updateSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || slots.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/subjects/${initialData!._id}`
        : "/api/subjects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slots, color }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save subject:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setSlots([{ day: "Mon", startTime: "09:00", endTime: "10:30" }]);
    setColor("#805af2");
    setActiveSlotIndex(0);
  };

  const currentSlot = slots[activeSlotIndex] || slots[0];

  return (
    <div className="relative flex h-full w-full flex-col max-w-md md:max-w-2xl mx-auto bg-[#0F0F11] overflow-hidden">
      {/* Background Noise */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 pt-8 pb-4 bg-[#0F0F11]/80 backdrop-blur-md border-b border-[rgba(255,255,255,0.15)]">
        <GlassIconButton
          icon="arrow_back"
          href="/dashboard"
          ariaLabel="Back"
          className="shadow-plump active:shadow-plump-inset"
        />
        <h1 className="text-sm tracking-[0.2em] font-bold text-gray-400">
          {isEditing ? "EDIT MODULE" : "CONFIGURE MODULE"}
        </h1>
        <button
          onClick={handleReset}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-gray-400 hover:text-[#FF4D4D] transition-colors shadow-plump active:shadow-plump-inset"
        >
          <MaterialIcon name="restart_alt" size={20} />
        </button>
      </header>

      {/* Form */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 py-6 space-y-8">
        {/* Subject Input */}
        <div className="space-y-3">
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest pl-2">
            Subject Identifier
          </label>
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4D79FF]/20 to-[#805af2]/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <input
              className="relative w-full bg-[rgba(255,255,255,0.08)] backdrop-blur-xl border border-[rgba(255,255,255,0.15)] rounded-2xl p-5 text-2xl font-bold text-white placeholder-gray-600 shadow-plump focus:shadow-plump-inset focus:border-[#4D79FF]/50 focus:ring-0 transition-all outline-none"
              placeholder="Ex: Quantum Physics"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
              <MaterialIcon name="edit" />
            </div>
          </div>
        </div>

        {/* Schedule Slots */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest">
              Schedule Slots
            </label>
            <button
              onClick={addSlot}
              className="text-[10px] font-mono text-[#4D79FF] bg-[#4D79FF]/10 px-3 py-1 rounded border border-[#4D79FF]/30 hover:bg-[#4D79FF]/20 transition-colors"
            >
              + ADD SLOT
            </button>
          </div>

          {/* Slot Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setActiveSlotIndex(i)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider shrink-0 transition-all ${
                  i === activeSlotIndex
                    ? "bg-[#4D79FF]/20 text-[#4D79FF] border border-[#4D79FF]/40"
                    : "bg-[rgba(255,255,255,0.05)] text-gray-500 border border-white/5 hover:border-white/10"
                }`}
              >
                <span>{slot.day}</span>
                <span className="text-[8px] text-gray-600">
                  {slot.startTime}-{slot.endTime}
                </span>
                {slots.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlot(i);
                    }}
                    className="ml-1 text-gray-600 hover:text-red-400 cursor-pointer"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Slot Day Selector */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-widest pl-2">
              Day for Slot {activeSlotIndex + 1}
            </label>
            <div className="flex justify-between items-center p-2">
              {DAYS.map((day) => {
                const isActive = currentSlot?.day === day.key;
                return (
                  <button
                    key={day.key}
                    onClick={() => updateSlot(activeSlotIndex, "day", day.key)}
                    className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                      isActive
                        ? "bg-chrome-gradient shadow-chrome"
                        : "bg-[#1a1a1f] shadow-plump-inset border border-white/5"
                    }`}
                  >
                    <span
                      className={`font-bold z-10 ${
                        isActive
                          ? "text-gray-800"
                          : "text-gray-600 group-hover:text-gray-400"
                      }`}
                    >
                      {day.label}
                    </span>
                    {isActive && (
                      <>
                        <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#4D79FF] shadow-[0_0_10px_rgba(77,121,255,0.6)] border border-white/40" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 to-transparent opacity-50 pointer-events-none" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Slot Time Dials */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-widest pl-2">
              Time for Slot {activeSlotIndex + 1}
            </label>
            <div className="grid grid-cols-2 gap-6 h-48">
              <TimeDial
                label="START"
                dotColor="#4D79FF"
                times={TIMES}
                selectedTime={currentSlot?.startTime || "09:00"}
                onTimeChange={(t) => updateSlot(activeSlotIndex, "startTime", t)}
              />
              <TimeDial
                label="END"
                dotColor="#FF4D4D"
                times={TIMES}
                selectedTime={currentSlot?.endTime || "10:30"}
                onTimeChange={(t) => updateSlot(activeSlotIndex, "endTime", t)}
              />
            </div>
          </div>
        </div>

        {/* Color Selector */}
        <div className="space-y-4">
          <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest pl-2">
            Module Color
          </label>
          <div className="flex gap-3 px-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full transition-transform active:scale-95 border-2 ${
                  color === c ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Spacer for sticky footer + bottom nav */}
        <div className="h-44" />
      </main>

      {/* Sticky Footer — positioned above bottom nav */}
      <div className="absolute bottom-20 md:bottom-24 left-0 w-full px-6 pb-2 bg-gradient-to-t from-[#0F0F11] via-[#0F0F11]/95 to-transparent z-20">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || slots.length === 0 || isSubmitting}
          className="group relative w-full h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 shadow-plump flex items-center justify-between px-2 overflow-hidden transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4D79FF]/20 to-[#805af2]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute left-2 top-2 bottom-2 w-12 bg-[#0a0a0c] rounded-xl shadow-plump-inset flex items-center justify-center border border-white/5">
            <MaterialIcon
              name="check_circle"
              className="text-[#4D79FF] animate-pulse"
            />
          </div>
          <div className="flex-1 text-center relative z-10">
            <span className="font-bold text-lg tracking-[0.2em] text-white group-hover:text-white/90">
              {isSubmitting ? "PROCESSING..." : "INITIALIZE"}
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          </div>
        </button>
      </div>
    </div>
  );
}
