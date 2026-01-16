export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 p-8">
      <header className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-blue-800 mb-4">
          FamilyTask
        </h1>
        <p className="text-xl text-blue-600 mb-8">
          Organize Your Family's Life
        </p>
      </header>
      
      <main className="max-w-6xl mx-auto mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">?? Tasks</h2>
            <p className="text-gray-600">Assign and track family chores</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">?? Rewards</h2>
            <p className="text-gray-600">Earn points and redeem prizes</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">?? Dashboard</h2>
            <p className="text-gray-600">Track family progress</p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:opacity-90 transition">
            Get Started Free
          </button>
        </div>
      </main>
    </div>
  );
}


