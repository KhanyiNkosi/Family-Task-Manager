"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    if (confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = createdTasks.filter(task => task.id !== taskId);
      setCreatedTasks(updatedTasks);
      localStorage.setItem('familytask-created-tasks', JSON.stringify(updatedTasks));
    }
  };

  const handleUseSuggestion = (suggestionId: number) => {
    const suggestion = savedSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      const newTask: CreatedTask = {
        id: Date.now(),
        title: suggestion.title,
        category: suggestion.category,
        points: suggestion.points,
        description: suggestion.description,
        assignedTo: 'Unassigned',
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'saved-suggestion'
      };
      
      const updatedTasks = [...createdTasks, newTask];
      setCreatedTasks(updatedTasks);
      localStorage.setItem('familytask-created-tasks', JSON.stringify(updatedTasks));
      
      alert(`Task "${suggestion.title}" created from saved suggestion!`);
    }
  };

  const handleDeleteSuggestion = (suggestionId: number) => {
    const updatedSuggestions = savedSuggestions.filter(s => s.id !== suggestionId);
    setSavedSuggestions(updatedSuggestions);
    localStorage.setItem('familytask-saved-suggestions', JSON.stringify(updatedSuggestions));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE] pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#006372]">AI Generated Tasks</h1>
          <p className="text-gray-600 mt-2">View and manage tasks created from AI suggestions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-[#00C2E0]">{createdTasks.length}</div>
            <div className="text-gray-600">Tasks Created</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {createdTasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Assignment</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{savedSuggestions.length}</div>
            <div className="text-gray-600">Saved Suggestions</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-tasks mr-2"></i>
            Created Tasks ({createdTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-bookmark mr-2"></i>
            Saved Suggestions ({savedSuggestions.length})
          </button>
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {createdTasks.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No tasks created yet</h3>
                <p className="text-gray-500 mb-6">Generate and use suggestions from the AI Suggester to create tasks here.</p>
                <button
                  onClick={() => router.push('/ai-suggester')}
                  className="px-6 py-3 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl font-bold hover:opacity-90"
                >
                  <i className="fas fa-robot mr-2"></i>
                  Go to AI Suggester
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {createdTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-[#00C2E0]/10 text-[#006372] rounded-full text-sm">
                            {task.category}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            +{task.points} points
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            task.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : task.status === 'assigned'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssignTask(task.id)}
                          className="px-4 py-2 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-lg hover:opacity-90"
                        >
                          <i className="fas fa-user-check mr-2"></i>
                          Assign
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>
                        <i className="far fa-calendar mr-1"></i>
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <i className="fas fa-user mr-1"></i>
                        Assigned to: {task.assignedTo}
                      </div>
                      <div>
                        <i className="fas fa-robot mr-1"></i>
                        Source: {task.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {savedSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-bookmark text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No saved suggestions</h3>
                <p className="text-gray-500">Click the bookmark icon on AI suggestions to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{suggestion.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-[#00C2E0]/10 text-[#006372] rounded-full text-xs">
                        {suggestion.category}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        +{suggestion.points} pts
                      </span>
                      {suggestion.generatedByAI && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          AI Generated
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{suggestion.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseSuggestion(suggestion.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-lg hover:opacity-90 text-sm"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Create Task
                      </button>
                      <button
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
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

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push('/ai-suggester')}
            className="px-6 py-3 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl font-bold hover:opacity-90"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to AI Suggester
          </button>
          <button
            onClick={() => router.push('/parent-dashboard')}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
          >
            <i className="fas fa-th-large mr-2"></i>
            Go to Parent Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
