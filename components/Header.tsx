"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => { router.push(`/login`); };

  const handleGetStartedClick = () => { router.push(`/register`); };

  const scrollToFeatures = () => {
    const featuresSection = document.querySelector('.features');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSmileyClick = () => {
    // Add bounce animation
    const smiley = document.querySelector('.smiley-icon');
    if (smiley) {
      smiley.classList.add('animate-bounce');
      setTimeout(() => {
        smiley.classList.remove('animate-bounce');
      }, 300);
    }
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <header className="header-container fixed top-0 left-0 right-0 z-50 bg-[#F0F9FF]/40 backdrop-blur-[8px] border-b border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.05)] px-20 py-5 flex justify-between items-center">
      <div className="logo-group flex items-center gap-[10px] text-[#00C2E0] font-bold text-2xl">
        <div 
          className="smiley-icon w-11 h-11 bg-[#00C2E0] rounded-full relative flex justify-center items-center overflow-hidden cursor-pointer"
          onClick={handleSmileyClick}
        >
          <div className="eyes absolute top-3 w-7 h-2 flex justify-between">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="smile absolute bottom-2.5 w-6 h-3 border-b-2 border-white rounded-b-full"></div>
        </div>
        <span className="brand-name">FamilyTask</span>
      </div>

      <nav className="nav-actions flex items-center">
        {/* Fixed: Exact About link styling */}
        <Link 
          href="/about"
          className="nav-link no-underline text-[#4A5568] mr-10 text-base font-medium relative transition-colors duration-300 hover:text-[#00C2E0] after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#00C2E0] after:transition-all after:duration-300 hover:after:w-full"
        >
          About
        </Link>
        
        {/* Fixed: Exact Login button styling */}
        <button 
          onClick={handleLoginClick}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          className="login-button bg-[#00C2E0] text-white px-7 py-3 rounded-xl font-bold text-base cursor-pointer border-none shadow-[0_10px_15px_-3px_rgba(0,194,224,0.4)] hover:shadow-[0_12px_20px_-3px_rgba(0,194,224,0.5)] hover:transform hover:-translate-y-[2px] active:transform active:translate-y-0 active:shadow-[0_8px_12px_-3px_rgba(0,194,224,0.4)] transition-all duration-300"
        >
          Log In
        </button>
      </nav>
    </header>
  );
}


