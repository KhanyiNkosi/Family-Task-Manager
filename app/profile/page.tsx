export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-800 mb-8">My Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">
                  Family
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">David Wilson</h2>
                  <p className="text-gray-600">Parent  Family Manager</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                      david@familytask.com
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      4 members
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Member Since</div>
                  <div className="font-bold">January 2024</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Tasks Created</div>
                  <div className="font-bold">42</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Rewards Given</div>
                  <div className="font-bold">18</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Family Points</div>
                  <div className="font-bold">1,250</div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { action: 'Assigned "Clean garage" to Michael', time: '2 hours ago', type: 'task' },
                  { action: 'Approved Sarah\'s reward redemption', time: 'Yesterday', type: 'reward' },
                  { action: 'Updated family settings', time: '2 days ago', type: 'settings' },
                  { action: 'Added new weekly chore', time: '3 days ago', type: 'task' },
                  { action: 'Redeemed "Movie Night" reward', time: '1 week ago', type: 'reward' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center p-3 border-l-4 border-emerald-500 bg-gray-50 rounded-r-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      item.type === 'task' ? 'bg-blue-100' : 
                      item.type === 'reward' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {item.type === 'task' ? '' : item.type === 'reward' ? 'GIFT' : 'SET'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-gray-500">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Settings */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  Edit Profile
                </button>
                <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  Family Members
                </button>
                <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  Notifications
                </button>
                <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  Task Settings
                </button>
                <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  Reward Settings
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span>This Week</span>
                  <span className="font-bold">85% done</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Points Earned</span>
                  <span className="font-bold">+350</span>
                </div>
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span>Active Streak</span>
                  <span className="font-bold">14 days</span>
                </div>
                <div className="flex justify-between p-3 bg-amber-50 rounded-lg">
                  <span>Rewards Given</span>
                  <span className="font-bold">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


