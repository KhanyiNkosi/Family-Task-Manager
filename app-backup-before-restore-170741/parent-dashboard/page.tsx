"use client";

import { useState, useEffect } from "react";
import { tasksApi, profileApi } from "@/app/lib/supabase";

export default function ParentDashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", points: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks from Supabase
  useEffect(() => {
    async function loadTasks() {
      try {
        setIsLoading(true);
        const tasksData = await tasksApi.getTasks();
        setTasks(tasksData);
      } catch (err) {
        console.error("Error loading tasks:", err);
        setError("Failed to load tasks. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const createdTask = await tasksApi.createTask(newTask);
      setTasks([createdTask, ...tasks]);
      setNewTask({ title: "", description: "", points: 10 });
      alert("Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task. Please check your permissions.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await tasksApi.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
          <p className="text-gray-600">Manage family tasks and monitor progress</p>
        </header>

        {/* Create Task Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-purple-700 mb-4">Create New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="e.g., Clean your room"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="e.g., Make sure to vacuum"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-3"
                value={newTask.points}
                onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                min="1"
                max="1000"
              />
            </div>
          </div>
          <button
            onClick={handleCreateTask}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition"
          >
            + Create Task
          </button>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-purple-700">Family Tasks</h2>
            <span className="text-sm text-gray-500">
              {tasks.length} total tasks
            </span>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No tasks created yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first task using the form above
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
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{task.title}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {task.points} points
                        </span>
                        {task.completed && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                        {task.assigned_to && ` • Assigned to: ${task.assigned_to}`}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{tasks.length}</div>
            <p className="text-gray-600 mt-2">Total Tasks</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.completed).length}
            </div>
            <p className="text-gray-600 mt-2">Completed Tasks</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {tasks.reduce((sum, task) => sum + (task.points || 0), 0)}
            </div>
            <p className="text-gray-600 mt-2">Total Points Assigned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
