// app/components/HeaderBackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface HeaderBackButtonProps {
  label?: string;
  className?: string;
  variant?: "default" | "sidebar";
}

export default function HeaderBackButton({ 
  label = "Back", 
  className = "", 
  variant = "default" 
}: HeaderBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  // Styles for different variants
  const baseStyles = `
    flex items-center gap-2.5
    px-4 py-2.5 rounded-lg
    font-medium text-sm
    transition-all duration-300
    backdrop-blur-sm
    hover:transform hover:-translate-y-0.5
    active:transform active:translate-y-0
  `;

  const defaultStyles = `
    ${baseStyles}
    bg-white/90 hover:bg-white
    text-[#00C2E0] hover:text-[#007A8C]
    border border-[#00C2E0]/20 hover:border-[#00C2E0]
    shadow-sm hover:shadow-md
  `;

  const sidebarStyles = `
    ${baseStyles}
    bg-white/10 hover:bg-white/20
    text-white hover:text-white
    border border-white/20 hover:border-white/30
    w-full justify-center
  `;

  return (
    <button
      onClick={handleBack}
      className={`
        ${variant === "sidebar" ? sidebarStyles : defaultStyles}
        ${className}
      `}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
