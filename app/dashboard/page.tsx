export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-8">Parent Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Family Members */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">??????????? Family Members</h2>
              <div className="space-y-4">
                {['Mom', 'Dad', 'Sarah (12)', 'Michael (9)'].map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">{member}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      125 points
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Weekly Tasks */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">?? This Week's Tasks</h2>
              <div className="space-y-3">
                {[
                  { task: 'Clean rooms', assigned: 'Sarah', points: 25, completed: true },
                  { task: 'Take out trash', assigned: 'Michael', points: 15, completed: false },
                  { task: 'Set dinner table', assigned: 'Sarah', points: 10, completed: true },
                  { task: 'Water plants', assigned: 'Michael', points: 20, completed: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{item.task}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.assigned})</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600">+{item.points} pts</span>
                      <span className={`px-2 py-1 text-xs rounded ${item.completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {item.completed ? '? Done' : '? Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Stats & Quick Actions */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">?? Family Stats</h2>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">85%</div>
                  <div className="text-gray-600">Task Completion</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">1,250</div>
                  <div className="text-gray-600">Total Points</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">? Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                  + Add New Task
                </button>
                <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
                  ?? Assign Reward
                </button>
                <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
                  ?? View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


