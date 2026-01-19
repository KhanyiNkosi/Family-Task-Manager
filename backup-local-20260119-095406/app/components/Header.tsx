import { Home, User, Gift, Bot, Star } from "lucide-react"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-cyan-100/30 shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <div className="relative w-6 h-6">
              {/* Smiley face */}
              <div className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-1 flex justify-between mb-1">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-1.5 border-b-2 border-white rounded-b-full"></div>
              </div>
            </div>
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
            FamilyTask
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <a href="/" className="px-4 py-2 rounded-xl text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 font-semibold transition-all flex items-center gap-2">
            <Home className="w-4 h-4" /> Home
          </a>
          <a href="/child" className="px-4 py-2 rounded-xl text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 font-semibold transition-all flex items-center gap-2">
            <User className="w-4 h-4" /> Child
          </a>
          <a href="/parent" className="px-4 py-2 rounded-xl text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 font-semibold transition-all flex items-center gap-2">
            <User className="w-4 h-4" /> Parent
          </a>
          <a href="/rewards" className="px-4 py-2 rounded-xl text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 font-semibold transition-all flex items-center gap-2">
            <Gift className="w-4 h-4" /> Rewards
          </a>
          <a href="/ai" className="px-4 py-2 rounded-xl text-slate-600 hover:text-cyan-500 hover:bg-cyan-50 font-semibold transition-all flex items-center gap-2">
            <Bot className="w-4 h-4" /> AI
          </a>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25">
            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
            <span>120 pts</span>
          </div>
          <button className="px-6 py-2 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/25">
            Log In
          </button>
        </div>
      </div>
    </header>
  )
}

