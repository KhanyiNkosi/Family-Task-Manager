"use client";

export default function AlSuggestorPage() {
  const suggestions = [
    { id: 1, title: 'Weekend Cleanup Challenge', category: 'Family Activity', points: 200, description: 'Turn cleaning into a game with timed challenges' },
    { id: 2, title: 'Homework Helper System', category: 'Education', points: 150, description: 'Pair older kids with younger ones for homework help' },
    { id: 3, title: 'Meal Prep Team', category: 'Cooking', points: 180, description: 'Assign different meal prep tasks to family members' },
    { id: 4, title: 'Green Thumb Garden', category: 'Outdoor', points: 250, description: 'Create a family garden with watering schedules' },
    { id: 5, title: 'Digital Detox Day', category: 'Wellness', points: 100, description: 'Screen-free day with alternative activities' },
    { id: 6, title: 'Charity Together', category: 'Community', points: 300, description: 'Family volunteer activity with bonus points' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with logo matching other pages */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#00C2E0] rounded-full relative flex justify-center items-center overflow-hidden">
              <div className="eyes absolute top-5 w-10 h-3 flex justify-between">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="smile absolute bottom-4 w-8 h-4 border-b-3 border-white rounded-b-full"></div>
            </div>
            <h1 className="text-5xl font-black text-[#006372]">AI Family Suggester</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Smart suggestions to make family management fun and effective!
          </p>
        </div>

        {/* Stats Overview - Updated colors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Success Rate', value: '92%', color: 'bg-green-500' },
            { label: 'Suggestions Used', value: '48', color: 'bg-[#00C2E0]' },
            { label: 'Avg. Points', value: '180', color: 'bg-[#006372]' },
            { label: 'Happy Families', value: '1,234', color: 'bg-gradient-to-r from-cyan-500 to-teal-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100">
              <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className={`mt-2 h-1 ${stat.color} rounded-full mx-auto w-12`}></div>
            </div>
          ))}
        </div>

        {/* AI Suggestions - Updated colors */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Personalized Suggestions</h2>
            <button className="px-6 py-3 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg">
              <i className="fas fa-magic mr-2"></i>
              Generate New Ideas
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{suggestion.title}</h3>
                    <span className="px-3 py-1 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-full text-sm font-bold shadow">
                      +{suggestion.points} pts
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#00C2E0]/10 text-[#006372] rounded-full text-sm font-medium">
                      {suggestion.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{suggestion.description}</p>
                  
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-lg hover:opacity-90 font-medium transition-all">
                      <i className="fas fa-check-circle mr-2"></i>
                      Use This
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <i className="fas fa-bookmark mr-2"></i>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Chat - Updated colors */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Ask AI Assistant</h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#00C2E0]/10 to-[#00A3CC]/10 rounded-xl p-6 border border-[#00C2E0]/20">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] rounded-full flex items-center justify-center text-white mr-3 shadow">
                  <i className="fas fa-robot"></i>
                </div>
                <div>
                  <span className="font-bold text-[#006372]">FamilyTask AI Assistant</span>
                  <div className="text-xs text-gray-500">Powered by smart family management algorithms</div>
                </div>
              </div>
              <p className="text-gray-700">
                Hi! I can help you with:
                <br/>• Creating custom task plans
                <br/>• Suggesting age-appropriate chores
                <br/>• Balancing points and rewards
                <br/>• Solving family management challenges
              </p>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Ask me anything about family task management..."
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
              />
              <button className="px-6 py-4 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl hover:opacity-90 font-bold transition-all shadow-lg">
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {text: 'Suggest weekend activities', icon: 'fas fa-calendar-week'},
                {text: 'Create teen chore list', icon: 'fas fa-tasks'},
                {text: 'Balance sibling points', icon: 'fas fa-balance-scale'}
              ].map((prompt, index) => (
                <button
                  key={index}
                  className="p-3 bg-[#00C2E0]/5 text-[#006372] rounded-lg hover:bg-[#00C2E0]/10 transition-colors text-left border border-[#00C2E0]/10"
                >
                  <i className={`${prompt.icon} mr-2 text-[#00C2E0]`}></i>
                  &quot;{prompt.text}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-3">How Our AI Works</h3>
          <p className="opacity-90">
            Our AI analyzes thousands of successful family patterns to suggest activities 
            that promote teamwork, learning, and fun while building positive habits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-brain text-2xl mb-2"></i>
              <div className="font-bold">Smart Analysis</div>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-child text-2xl mb-2"></i>
              <div className="font-bold">Age-Appropriate</div>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <i className="fas fa-star text-2xl mb-2"></i>
              <div className="font-bold">Reward Optimized</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
