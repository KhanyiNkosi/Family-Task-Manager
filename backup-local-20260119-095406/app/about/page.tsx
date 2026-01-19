import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h1 className="text-4xl font-bold text-cyan-700 mb-6">About FamilyTask</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg mb-6">
                FamilyTask is designed to make family organization fun, engaging, and rewarding for everyone!
              </p>
              
              <div className="bg-cyan-50 rounded-xl p-6 mb-8 border border-cyan-100">
                <h2 className="text-2xl font-bold text-teal-700 mb-4">Our Mission</h2>
                <p className="text-gray-700">
                  To help families work together better by turning chores into challenges, 
                  tasks into achievements, and rewards into motivation. We believe that when 
                  families organize together, they grow together.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-user-tie text-cyan-500 mr-3"></i>
                    For Parents
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Easy task assignment and tracking</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Set custom rewards and point values</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Monitor progress with visual dashboards</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-child text-teal-500 mr-3"></i>
                    For Children
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Fun, easy-to-use dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Earn points for completed tasks</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                      <span>Redeem points for exciting rewards</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
                <h2 className="text-2xl font-bold text-teal-700 mb-4">Why Choose FamilyTask?</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <i className="fas fa-shield-alt text-teal-500 text-xl mr-3"></i>
                    <span>Safe and family-friendly</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-mobile-alt text-teal-500 text-xl mr-3"></i>
                    <span>Works on all devices</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-brain text-teal-500 text-xl mr-3"></i>
                    <span>Smart task suggestions</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-smile text-teal-500 text-xl mr-3"></i>
                    <span>Positive reinforcement</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Get Started Today</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/dashboard" 
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg text-center transition"
                  >
                    Try Parent Dashboard
                  </a>
                  <a 
                    href="/child-dashboard" 
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg text-center transition"
                  >
                    Try Child Dashboard
                  </a>
                  <a 
                    href="/" 
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-center transition"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
