// app/components/ParentSidebar.tsx
"use client";

import HeaderBackButton from "./HeaderBackButton";

interface ParentSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function ParentSidebar({ activeView, onViewChange }: ParentSidebarProps) {
  return (
    <aside className="sidebar w-[260px] bg-[#007A8C] text-white p-8 flex flex-col">
      {/* Logo */}
      <div 
        className="logo flex items-center gap-2.5 text-2xl font-extrabold mb-10 cursor-pointer hover:opacity-80 transition"
        onClick={() => onViewChange('dashboard')}
      >
        <i className="far fa-smile-beam"></i> FamilyTask
      </div>
      
      {/* Main Navigation */}
      <nav className="space-y-2">
        <div 
          className={`nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer ${activeView === 'dashboard' ? 'active bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => onViewChange('dashboard')}
        >
          <i className="fas fa-th-large w-5"></i> Dashboard
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer ${activeView === 'children' ? 'active bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => onViewChange('children')}
        >
          <i className="fas fa-users w-5"></i> My Children
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer ${activeView === 'tasks' ? 'active bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => onViewChange('tasks')}
        >
          <i className="fas fa-tasks w-5"></i> Manage Tasks
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer ${activeView === 'rewards' ? 'active bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => onViewChange('rewards')}
        >
          <i className="fas fa-gift w-5"></i> Rewards
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer ${activeView === 'profile' ? 'active bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => onViewChange('profile')}
        >
          <i className="fas fa-user w-5"></i> Profile
        </div>
      </nav>
      
      {/* Bottom Navigation with Back Button */}
      <div className="sidebar-bottom mt-auto border-t border-white/10 pt-5">
        {/* Back Button */}
        <div className="mb-4 px-4">
          <HeaderBackButton label="Go Back" variant="sidebar" />
        </div>
        
        <div 
          className="nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer text-white/75 hover:bg-white/10"
          onClick={() => onViewChange('settings')}
        >
          <i className="fas fa-cog w-5"></i> Settings
        </div>
        
        <div 
          className="nav-link flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer text-white/75 hover:bg-white/10"
          onClick={() => onViewChange('logout')}
        >
          <i className="fas fa-sign-out-alt w-5"></i> Logout
        </div>
      </div>
    </aside>
  );
}
