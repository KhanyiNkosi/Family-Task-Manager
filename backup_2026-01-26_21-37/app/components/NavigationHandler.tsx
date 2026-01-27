// app/components/NavigationHandler.tsx - Simple navigation handler
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationHandlerProps {
  activeView: string;
  onViewChange?: (view: string) => void;
}

export default function NavigationHandler({ activeView, onViewChange }: NavigationHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only navigate if the view has actually changed
    console.log(`NavigationHandler: activeView=${activeView}, pathname=${pathname}`);
    
    switch (activeView) {
      case 'home':
        if (pathname !== '/') router.push('/');
        break;
      case 'dashboard':
        if (pathname.includes('/parent-dashboard')) {
          // Already on parent dashboard
          if (onViewChange) onViewChange('parent-dashboard');
        } else if (!pathname.includes('/child-dashboard')) {
          router.push('/child-dashboard');
        }
        break;
      case 'rewards':
        if (!pathname.includes('/rewards-store')) router.push('/rewards-store');
        break;
      case 'ai':
        if (!pathname.includes('/ai-suggester')) router.push('/ai-suggester');
        break;
      case 'profile':
        if (!pathname.includes('/profile')) router.push('/profile');
        break;
      case 'about':
        if (!pathname.includes('/about')) router.push('/about');
        break;
    }
  }, [activeView, router, pathname, onViewChange]);

  return null; // This is a helper component, doesn't render anything
}
