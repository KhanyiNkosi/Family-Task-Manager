"use client";

import { useState, useEffect } from "react";
import { tasksApi, profileApi } from "@/app/lib/supabase";

export default function ChildDashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Load tasks
        const tasksData = await tasksApi.getTasks();
        setTasks(tasksData);
        
        // Load profile
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
        
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleCompleteTask = async (taskId) => {
    try {
      await tasksApi.updateTask(taskId, { completed: true });
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      ));
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Failed to complete task. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold">Error</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {profile?.name || "Child"}!
          </h1>
          <p className="text-gray-600">Complete tasks to earn points and redeem rewards</p>
        </header>

        {/* Tasks Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Tasks</h2>
            <span className="text-sm text-gray-500">
              {tasks.filter(t => !t.completed).length} pending
            </span>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No tasks assigned yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Your parents will assign tasks for you to complete
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`border rounded-xl p-5 ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {task.points} points
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {!task.completed ? (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Your Points Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold">
                {tasks.filter(t => t.completed).reduce((sum, task) => sum + (task.points || 0), 0)}
              </div>
              <p className="text-blue-100">Total Points Earned</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">
                {tasks.filter(t => !t.completed).reduce((sum, task) => sum + (task.points || 0), 0)}
              </div>
              <p className="text-blue-100">Available Points</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">
                {tasks.filter(t => t.completed).length}
              </div>
              <p className="text-blue-100">Tasks Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
