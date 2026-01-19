// app/components/Sidebar.tsx
"use client";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userInitial: string;
}

export default function Sidebar({ activeView, onViewChange, userInitial }: SidebarProps) {
  return (
    <aside className="sidebar w-[280px] bg-[#006372] text-white p-6 sticky top-0 h-screen flex flex-col">
      {/* Logo */}
      <div 
        className="logo flex items-center gap-3 text-2xl font-extrabold mb-10 pl-2.5 cursor-pointer hover:opacity-80 transition"
        onClick={() => onViewChange('dashboard')}
      >
        <i className="fas fa-smile"></i> FamilyTask
      </div>
      
      {/* Main Navigation */}
      <nav className="space-y-1">
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'home' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('home')}
        >
          <i className="fas fa-home w-5 text-lg"></i> Home
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'dashboard' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('dashboard')}
        >
          <i className="fas fa-th-large w-5 text-lg"></i> Dashboard
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'tasks' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('tasks')}
        >
          <i className="fas fa-list-ul w-5 text-lg"></i> My Tasks
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'rewards' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('rewards')}
        >
          <i className="fas fa-gift w-5 text-lg"></i> Rewards Store
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'ai' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('ai')}
        >
          <i className="fas fa-brain w-5 text-lg"></i> AI Suggester
        </div>
        
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'profile' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('profile')}
        >
          <i className="fas fa-user w-5 text-lg"></i> Profile
        </div>
      </nav>
      
      {/* Footer Navigation */}
      <div className="sidebar-footer mt-auto border-t border-white/10 pt-5">
        <div 
          className={`nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer ${activeView === 'about' ? 'active bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
          onClick={() => onViewChange('about')}
        >
          <i className="fas fa-info-circle w-5 text-lg"></i> About
        </div>
        
        <div 
          className="nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10"
          onClick={() => onViewChange('settings')}
        >
          <i className="fas fa-cog w-5 text-lg"></i> Settings
        </div>
        
        <div 
          className="nav-link flex items-center gap-3.5 py-3 px-4.5 rounded-xl cursor-pointer text-white/80 hover:bg-white/10"
          onClick={() => onViewChange('logout')}
        >
          <i className="fas fa-sign-out-alt w-5 text-lg"></i> Logout
        </div>
      </div>
    </aside>
  );
}
