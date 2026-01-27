"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CreatedTask = {
  id: number;
  title: string;
  category: string;
  points: number;
  description: string;
  assignedTo: string;
  status: 'pending' | 'assigned' | 'completed';
  createdAt: string;
  source: string;
};

export default function ViewAITasksPage() {
  const router = useRouter();
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const [savedSuggestions, setSavedSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'suggestions'>('tasks');

  useEffect(() => {
    // Load tasks from localStorage
    const tasks = JSON.parse(localStorage.getItem('familytask-created-tasks') || '[]');
    const suggestions = JSON.parse(localStorage.getItem('familytask-saved-suggestions') || '[]');

    setCreatedTasks(tasks);
    setSavedSuggestions(suggestions);
  }, []);

  const handleAssignTask = (taskId: number) => {
    const task = createdTasks.find(t => t.id === taskId);
    if (task) {
      if (confirm(`Assign "${task.title}" to a family member?`)) {
        // Navigate to parent dashboard for assignment
        localStorage.setItem('familytask-task-to-assign', JSON.stringify(task));
        router.push('/parent-dashboard');
      }
    }
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const updatedTasks = createdTasks.filter(task => task.id !== taskId);
      setCreatedTasks(updatedTasks);
      localStorage.setItem('familytask-created-tasks', JSON.stringify(updatedTasks));
    }
  };

  const handleDeleteSuggestion = (suggestionId: number) => {
    if (confirm("Are you sure you want to delete this suggestion?")) {
      const updatedSuggestions = savedSuggestions.filter(s => s.id !== suggestionId);
      setSavedSuggestions(updatedSuggestions);
      localStorage.setItem('familytask-saved-suggestions', JSON.stringify(updatedSuggestions));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH FAMILYTASK LOGO */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* FAMILYTASK LOGO */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-smile text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">FamilyTask</h1>
                  <p className="text-white/80 text-sm">AI Tasks Dashboard</p>
                </div>
              </Link>
            </div>

            {/* NAVIGATION */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/ai-suggester')}
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                >
                  <i className="fas fa-robot"></i>
                  New AI Suggestions
                </button>
                <Link
                  href="/parent-dashboard"
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* PAGE TITLE */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#006372] mb-2">AI-Generated Tasks</h2>
          <p className="text-gray-600">
            Manage tasks created by AI and saved suggestions for your family.
          </p>
        </div>

        {/* TABS */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium text-lg ${activeTab === 'tasks' ? 'border-b-2 border-[#00C2E0] text-[#006372]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-tasks mr-2"></i>
              Created Tasks ({createdTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-6 py-3 font-medium text-lg ${activeTab === 'suggestions' ? 'border-b-2 border-[#00C2E0] text-[#006372]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-lightbulb mr-2"></i>
              Saved Suggestions ({savedSuggestions.length})
            </button>
          </div>
        </div>

        {/* CONTENT BASED ON ACTIVE TAB */}
        {activeTab === 'tasks' ? (
          <div>
            {createdTasks.length === 0 ? (
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-[#00C2E0]/30 rounded-2xl p-12 text-center">
                <i className="fas fa-tasks text-5xl text-[#00C2E0] mb-4"></i>
                <h3 className="text-2xl font-bold text-[#006372] mb-2">No AI Tasks Created Yet</h3>
                <p className="text-gray-600 mb-6">
                  Use the AI Suggester to create tasks for your family.
                </p>
                <button
                  onClick={() => router.push('/ai-suggester')}
                  className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition inline-flex items-center gap-2"
                >
                  <i className="fas fa-robot"></i>
                  Go to AI Suggester
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full mb-3 ${task.category === 'Chores' ? 'bg-blue-100 text-blue-800' : task.category === 'Education' ? 'bg-green-100 text-green-800' : task.category === 'Family' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {task.category}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{task.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#00C2E0]">+{task.points}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${task.status === 'completed' ? 'text-green-600' : task.status === 'assigned' ? 'text-blue-600' : 'text-yellow-600'}`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Assigned to:</span>
                        <span className="font-medium text-gray-800">
                          {task.assignedTo || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-800">{task.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Source:</span>
                        <span className="text-gray-800">{task.source}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => handleAssignTask(task.id)}
                        disabled={task.status === 'assigned' || task.status === 'completed'}
                        className={`flex-1 py-2.5 rounded-lg font-medium transition ${task.status === 'assigned' || task.status === 'completed' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90'}`}
                      >
                        {task.status === 'assigned' ? 'Already Assigned' : task.status === 'completed' ? 'Completed' : 'Assign Task'}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {savedSuggestions.length === 0 ? (
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-[#00C2E0]/30 rounded-2xl p-12 text-center">
                <i className="fas fa-lightbulb text-5xl text-[#00C2E0] mb-4"></i>
                <h3 className="text-2xl font-bold text-[#006372] mb-2">No Saved Suggestions</h3>
                <p className="text-gray-600 mb-6">
                  Save suggestions from the AI Suggester to review them later.
                </p>
                <button
                  onClick={() => router.push('/ai-suggester')}
                  className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition inline-flex items-center gap-2"
                >
                  <i className="fas fa-robot"></i>
                  Explore AI Suggestions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="inline-block bg-gradient-to-r from-cyan-50 to-teal-50 text-[#006372] text-sm font-medium px-3 py-1 rounded-full mb-3">
                          {suggestion.category || 'AI Suggestion'}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{suggestion.title || suggestion.task}</h3>
                        <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#00C2E0]">+{suggestion.points || 20}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <i className="fas fa-robot text-[#00C2E0]"></i>
                        <span>AI Generated</span>
                      </div>
                      <div className="text-gray-500">
                        Saved: {suggestion.savedAt || 'Recently'}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => {
                          // Convert suggestion to task
                          const newTask: CreatedTask = {
                            id: Date.now(),
                            title: suggestion.title || suggestion.task,
                            category: suggestion.category || 'AI Suggestion',
                            points: suggestion.points || 20,
                            description: suggestion.description || '',
                            assignedTo: '',
                            status: 'pending',
                            createdAt: new Date().toLocaleDateString(),
                            source: 'Saved Suggestion'
                          };
                          const updatedTasks = [...createdTasks, newTask];
                          setCreatedTasks(updatedTasks);
                          localStorage.setItem('familytask-created-tasks', JSON.stringify(updatedTasks));
                          alert('Task created from suggestion!');
                        }}
                        className="flex-1 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                      >
                        Create Task
                      </button>
                      <button
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS FOOTER */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-xl border border-[#00C2E0]/30">
            <div className="text-sm text-gray-600 mb-2">Total AI Tasks</div>
            <div className="text-3xl font-bold text-[#006372]">{createdTasks.length}</div>
          </div>
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-xl border border-[#00C2E0]/30">
            <div className="text-sm text-gray-600 mb-2">Saved Suggestions</div>
            <div className="text-3xl font-bold text-[#006372]">{savedSuggestions.length}</div>
          </div>
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 rounded-xl border border-[#00C2E0]/30">
            <div className="text-sm text-gray-600 mb-2">Tasks to Assign</div>
            <div className="text-3xl font-bold text-[#006372]">
              {createdTasks.filter(t => t.status === 'pending').length}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER WITH LOGO */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-lg flex items-center justify-center">
                <i className="fas fa-smile text-white"></i>
              </div>
              <div>
                <div className="font-bold text-[#006372]">FamilyTask AI</div>
                <div className="text-sm text-gray-600">Smart family management</div>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              AI-generated tasks help families stay organized and engaged
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
