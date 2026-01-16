export default function ChildDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">My Dashboard</h1>
          <p className="text-lg text-purple-600">Welcome back, Sarah! ??</p>
        </div>
        
        {/* Points Display */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white text-center mb-8">
          <div className="text-2xl mb-2">My Points</div>
          <div className="text-6xl font-bold mb-2">1,250</div>
          <div className="text-lg">Keep going! 250 points until your next reward! ??</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Tasks */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">?? My Tasks</h2>
            <div className="space-y-4">
              {[
                { task: 'Clean room', points: 25, due: 'Today', completed: true },
                { task: 'Homework', points: 30, due: 'Tomorrow', completed: false },
                { task: 'Walk the dog', points: 15, due: 'Daily', completed: true },
                { task: 'Set table', points: 10, due: 'Today', completed: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.task}</div>
                    <div className="text-sm text-gray-500">Due: {item.due}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-600 font-bold">+{item.points}</span>
                    {item.completed ? (
                      <button className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                        ? Done
                      </button>
                    ) : (
                      <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Available Rewards */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">?? Available Rewards</h2>
            <div className="space-y-4">
              {[
                { reward: 'Extra 1 hour TV', points: 300, canAfford: false },
                { reward: 'Pizza night choice', points: 250, canAfford: false },
                { reward: 'New book', points: 200, canAfford: true },
                { reward: 'Ice cream treat', points: 100, canAfford: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="font-medium">{item.reward}</div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${item.canAfford ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.points} pts
                    </span>
                    <button 
                      className={`px-4 py-2 rounded-lg ${item.canAfford ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white`}
                      disabled={!item.canAfford}
                    >
                      {item.canAfford ? 'Redeem' : 'Need more'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


