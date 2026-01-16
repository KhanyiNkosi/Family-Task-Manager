export default function RewardsStorePage() {
  const rewards = [
    { id: 1, name: 'Movie Night', points: 500, category: 'Entertainment', popular: true },
    { id: 2, name: 'Extra Screen Time', points: 300, category: 'Privilege', popular: true },
    { id: 3, name: 'Choose Dinner', points: 250, category: 'Food' },
    { id: 4, name: 'New Book', points: 200, category: 'Education' },
    { id: 5, name: 'Day Out with Parents', points: 800, category: 'Experience' },
    { id: 6, name: 'Ice Cream Treat', points: 100, category: 'Food', popular: true },
    { id: 7, name: 'Stay Up Late', points: 400, category: 'Privilege' },
    { id: 8, name: 'New Art Supplies', points: 350, category: 'Education' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-800 mb-2">?? Rewards Store</h1>
          <p className="text-lg text-amber-600">Redeem your hard-earned points for awesome rewards!</p>
          <div className="inline-block mt-4 px-6 py-3 bg-amber-100 text-amber-800 rounded-full font-bold">
            Family Points Balance: <span className="text-2xl">1,250</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['All', 'Food', 'Entertainment', 'Privilege', 'Education', 'Experience'].map((category) => (
            <button
              key={category}
              className="px-4 py-2 bg-white border rounded-full hover:bg-amber-50 transition"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${reward.popular ? 'border-2 border-amber-300' : ''}`}
            >
              {reward.popular && (
                <div className="bg-amber-500 text-white text-center py-1 text-sm font-bold">
                  ? MOST POPULAR
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{reward.name}</h3>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold">
                    {reward.points} pts
                  </span>
                </div>
                
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {reward.category}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Family can afford: {reward.points <= 1250 ? '? Yes' : '? Need more points'}
                  </div>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium ${
                      reward.points <= 1250
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={reward.points > 1250}
                  >
                    {reward.points <= 1250 ? 'Redeem Now' : 'Need More'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">1??</div>
              <h3 className="font-bold text-lg mb-2">Complete Tasks</h3>
              <p className="text-gray-600">Finish assigned chores and tasks to earn points</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">2??</div>
              <h3 className="font-bold text-lg mb-2">Save Points</h3>
              <p className="text-gray-600">Accumulate points for bigger, better rewards</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">3??</div>
              <h3 className="font-bold text-lg mb-2">Redeem Rewards</h3>
              <p className="text-gray-600">Choose from awesome rewards in the store</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


