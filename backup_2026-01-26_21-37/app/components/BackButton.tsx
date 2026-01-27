// app/components/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button
      onClick={handleBack}
      className={`
        back-button
        flex items-center gap-2.5
        bg-white/70 hover:bg-white
        text-[#00C2E0] hover:text-[#007A8C]
        border border-[#00C2E0]/30 hover:border-[#00C2E0]
        px-5 py-3 rounded-xl
        font-medium text-base
        shadow-[0_4px_12px_rgba(0,194,224,0.15)]
        hover:shadow-[0_6px_16px_rgba(0,194,224,0.25)]
        hover:transform hover:-translate-y-0.5
        active:transform active:translate-y-0
        transition-all duration-300
        backdrop-blur-sm
        ${className}
      `}
    >
      <ArrowLeft className="w-4.5 h-4.5" />
      <span>{label}</span>
    </button>
  );
}
