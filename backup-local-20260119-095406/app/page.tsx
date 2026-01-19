"use client";

import Header from "@/components/Header";
import { useState } from "react";

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

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
    alert('Welcome to FamilyTask! Redirecting to signup...');
    // In real app: router.push('/signup');
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
              Get Started for Free
            </button>
          </section>
          
          {/* Features Section */}
          <section className="features py-[60px] pb-[100px]">
            <div className="features-grid grid grid-cols-3 gap-8 mb-[60px]">
              {/* Card 1: Manage Tasks */}
              <div 
                onClick={() => handleFeatureClick(0)}
                className={`feature-card bg-white/70 p-10 rounded-3xl hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer ${activeFeature === 0 ? 'ring-2 ring-[#00C2E0]' : ''}`}
              >
                <div className="feature-icon w-15 h-15 bg-[#00C2E0]/10 rounded-2xl flex items-center justify-center mb-6 text-3xl font-bold text-[#00C2E0]">
                  ✓
                </div>
                <h2 className="feature-title text-[28px] font-bold text-[#00C2E0] mb-4 leading-tight">
                  Manage Tasks
                </h2>
                <p className="feature-description text-[#4A5568] text-base leading-relaxed">
                  Easily create and assign tasks to family members. Keep track of what needs to be done.
                </p>
              </div>
              
              {/* Card 2: Motivate with Rewards */}
              <div 
                onClick={() => handleFeatureClick(1)}
                className={`feature-card bg-white/70 p-10 rounded-3xl hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer ${activeFeature === 1 ? 'ring-2 ring-[#00C2E0]' : ''}`}
              >
                <div className="feature-icon w-15 h-15 bg-[#00C2E0]/10 rounded-2xl flex items-center justify-center mb-6 text-3xl font-bold text-[#00C2E0]">
                  ★
                </div>
                <h2 className="feature-title text-[28px] font-bold text-[#00C2E0] mb-4 leading-tight">
                  Motivate with Rewards
                </h2>
                <p className="feature-description text-[#4A5568] text-base leading-relaxed">
                  Set up a points system for completed tasks. Let your kids earn exciting rewards.
                </p>
              </div>
              
              {/* Card 3: Stay Connected */}
              <div 
                onClick={() => handleFeatureClick(2)}
                className={`feature-card bg-white/70 p-10 rounded-3xl hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer ${activeFeature === 2 ? 'ring-2 ring-[#00C2E0]' : ''}`}
              >
                <div className="feature-icon w-15 h-15 bg-[#00C2E0]/10 rounded-2xl flex items-center justify-center mb-6 text-3xl font-bold text-[#00C2E0]">
                  ❤
                </div>
                <h2 className="feature-title text-[28px] font-bold text-[#00C2E0] mb-4 leading-tight">
                  Stay Connected
                </h2>
                <p className="feature-description text-[#4A5568] text-base leading-relaxed">
                  Improve communication and teamwork within the family. Achieve your goals together.
                </p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="divider h-px bg-gradient-to-r from-transparent via-[#00C2E0]/20 to-transparent my-10"></div>
            
            {/* Footer */}
            <footer className="footer text-center py-10">
              <p className="copyright text-[#4A5568] text-sm font-medium">
                © 2026 FamilyTask. All rights reserved.
              </p>
            </footer>
          </section>
        </div>
      </div>
    </>
  );
}
