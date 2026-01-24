"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useState } from "react";

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const router = useRouter();

  const featureDetails = [
    {
      title: "Task Management",
      description: "Create, assign, and track family chores with our intuitive dashboard. Set deadlines and monitor progress in real-time.",
    },
    {
      title: "Reward System",
      description: "Turn chores into games! Kids earn points for completed tasks, unlocking rewards and building positive habits.",
    },
    {
      title: "Family Connection",
      description: "Share calendars, leave notes, and celebrate achievements together. Strengthen family bonds through cooperation.",
    },
  ];

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    alert(`${featureDetails[index].title}\n\n${featureDetails[index].description}`);
    setTimeout(() => setActiveFeature(null), 2000);
  };

  const handleGetStartedClick = () => {
    router.push('/register');
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE] pt-[90px]">
        <div className="max-w-[1200px] mx-auto px-[80px]">
          {/* Hero Section */}
          <section className="hero text-center py-[80px] pb-[120px] max-w-[800px] mx-auto">
            <h1 className="text-[64px] font-black leading-tight text-[#00C2E0] mb-6 tracking-tight">
              Organize Your Family's Life
            </h1>
            <p className="hero-subtitle text-xl text-[#4A5568] leading-relaxed mb-12 max-w-[600px] mx-auto">
              The fun and easy way to manage tasks, rewards, and family cooperation.
            </p>
            <button
              onClick={handleGetStartedClick}
              className="btn-primary bg-[#00C2E0] text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#00C2E0]/40 hover:shadow-[#00C2E0]/50 hover:transform hover:-translate-y-1 transition-all duration-300"
            >
              Get Started
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
