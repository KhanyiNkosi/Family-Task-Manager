export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-6">About FamilyTask</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-lg text-gray-600 mb-4">
            FamilyTask helps families organize chores, track rewards, and make household management fun!
          </p>
          <p className="text-lg text-gray-600">
            Our mission is to reduce family stress and teach responsibility.
          </p>
        </div>
      </div>
    </div>
  );
}


