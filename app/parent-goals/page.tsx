"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabaseClient";
import { usePremium } from "@/hooks/usePremium";

interface Goal {
  id: number;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  completedAt?: string;
  dueDate: string;
}

export default function ParentGoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const [userName, setUserName] = useState("");
  
  // Premium status
  const { isPremium, isLoading: premiumLoading } = usePremium();

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ 
    show: false, message: "", type: "info" 
  });
  const [promptModal, setPromptModal] = useState<{ 
    show: boolean; 
    title: string; 
    fields: Array<{ label: string; placeholder: string; type?: string; options?: string[] }>; 
    onSubmit: (values: string[]) => void 
  }>({ 
    show: false, 
    title: "", 
    fields: [], 
    onSubmit: () => {} 
  });

  // Modal helper functions
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showPrompt = (
    title: string, 
    fields: Array<{ label: string; placeholder: string; type?: string; options?: string[] }>
  ): Promise<string[]> => {
    return new Promise((resolve) => {
      setPromptModal({
        show: true,
        title,
        fields,
        onSubmit: (values: string[]) => {
          setPromptModal({ show: false, title: "", fields: [], onSubmit: () => {} });
          resolve(values);
        },
      });
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, profile_image, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.role !== 'parent') {
          showAlert('Access denied! This page is for parents only.', 'error');
          router.push('/child-dashboard');
          return;
        }

        if (isMounted) {
          setUserName(profile.full_name || '');
          setProfileImage(profile.profile_image || '');
        }
      }

      // Load parent-specific goals from localStorage
      const goalsKey = `parentGoals:${user.id}`;
      const savedGoals = localStorage.getItem(goalsKey);
      if (savedGoals && isMounted) {
        setGoals(JSON.parse(savedGoals));
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveGoals = async (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    
    const supabase = createClientSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const goalsKey = user ? `parentGoals:${user.id}` : "parentGoals";
    
    localStorage.setItem(goalsKey, JSON.stringify(updatedGoals));
  };

  const calculateDueDate = (type: 'daily' | 'weekly' | 'monthly'): string => {
    const now = new Date();
    if (type === 'daily') {
      now.setDate(now.getDate() + 1);
    } else if (type === 'weekly') {
      now.setDate(now.getDate() + 7);
    } else {
      now.setMonth(now.getMonth() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const handleCreateGoal = async () => {
    // Check goal limit for free users
    if (!isPremium) {
      const activeGoalsCount = goals.filter(g => g.status === 'active').length;
      if (activeGoalsCount >= 3) {
        showAlert(
          "⚠️ Free Tier Limit Reached!\n\nYou've reached the maximum of 3 active goals on the free plan. Complete or abandon an existing goal, or upgrade to Premium for unlimited goals!",
          "warning"
        );
        return;
      }
    }
    
    const values = await showPrompt("Create New Goal", [
      { label: "Goal Title*", placeholder: "e.g., Earn 200 points this month", type: "text" },
      { label: "Description", placeholder: "What do you want to achieve?", type: "text" },
      { label: "Goal Type*", placeholder: "Select type", type: "select", options: ["daily", "weekly", "monthly"] },
      { label: "Target Points*", placeholder: "e.g., 200", type: "number" },
    ]);

    if (values[0] && values[2] && values[3]) {
      const newGoal: Goal = {
        id: Date.now(),
        title: values[0],
        description: values[1] || "",
        type: values[2] as 'daily' | 'weekly' | 'monthly',
        targetValue: parseInt(values[3]),
        currentValue: 0,
        unit: "points", // Always points now
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        dueDate: calculateDueDate(values[2] as 'daily' | 'weekly' | 'monthly'),
      };

      saveGoals([...goals, newGoal]);
      showAlert(`Goal "${newGoal.title}" created successfully! 🎯\n\nYou can manually track your progress or let it auto-update!", "success");
    } else {
      showAlert("Please fill in all required fields (marked with *)", "warning");
    }
  };

  const handleUpdateProgress = async (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const values = await showPrompt(`Update Progress: ${goal.title}`, [
      { 
        label: `Points Earned (current: ${goal.currentValue}/${goal.targetValue} points)`, 
        placeholder: goal.currentValue.toString(), 
        type: "number" 
      },
    ]);

    if (values[0]) {
      const newValue = parseInt(values[0]);
      
      // Validate the new value
      if (isNaN(newValue) || newValue < 0) {
        showAlert("Please enter a valid number", "error");
        return;
      }
      
      // Don't allow going backwards (can only increase or stay same)
      if (newValue < goal.currentValue) {
        showAlert(`Progress cannot go backwards! Current: ${goal.currentValue} points, you entered: ${newValue} points`, "warning");
        return;
      }
      
      const updatedGoals = goals.map(g => {
        if (g.id === goalId) {
          const isCompleted = newValue >= g.targetValue;
          return {
            ...g,
            currentValue: newValue,
            status: isCompleted ? 'completed' as const : g.status,
            completedAt: isCompleted ? new Date().toISOString().split('T')[0] : g.completedAt,
          };
        }
        return g;
      });

      saveGoals(updatedGoals);
      
      const updatedGoal = updatedGoals.find(g => g.id === goalId);
      if (updatedGoal?.status === 'completed') {
        showAlert(`🎉 Congratulations! You completed "${updatedGoal.title}"!`, "success");
      } else {
        const increase = newValue - goal.currentValue;
        showAlert(`Progress updated! ${increase > 0 ? `+${increase} points` : 'No change'}`, "success");
      }
    }
  };

  const handleDeleteGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoals = goals.filter(g => g.id !== goalId);
    saveGoals(updatedGoals);
    showAlert(`Goal "${goal.title}" removed`, "info");
  };

  const handleAbandonGoal = (goalId: number) => {
    const updatedGoals = goals.map(g => 
      g.id === goalId ? { ...g, status: 'abandoned' as const } : g
    );
    saveGoals(updatedGoals);
    showAlert("Goal marked as abandoned", "info");
  };

  const getProgressPercentage = (goal: Goal): number => {
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      default: return '🎯';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'weekly': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'monthly': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const dailyGoals = activeGoals.filter(g => g.type === 'daily');
  const weeklyGoals = activeGoals.filter(g => g.type === 'weekly');
  const monthlyGoals = activeGoals.filter(g => g.type === 'monthly');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
                <i className="fas fa-arrow-left text-xl"></i>
                <span className="hidden md:inline">Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <i className="fas fa-bullseye"></i>
                  My Goals
                </h1>
                <p className="text-white/80 text-sm">Track your personal achievements</p>
              </div>
            </div>

            {/* Profile */}
            <Link 
              href="/parent-profile"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                  <i className="fas fa-user text-xl"></i>
                </div>
              )}
              <span className="font-semibold hidden md:inline">{userName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* CREATE GOAL BUTTON */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Goals</h2>
            <p className="text-gray-600">Set and track your personal milestones</p>
          </div>
          <button
            onClick={handleCreateGoal}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            New Goal
          </button>
        </div>
        
        {/* Free Tier Notice */}
        {!isPremium && !premiumLoading && activeGoals.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                <i className="fas fa-info-circle"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Free Tier Limits</h3>
                <p className="text-gray-700 mb-3">
                  You have <strong>{activeGoals.length} of 3</strong> active goals. Upgrade to Premium for unlimited goals, advanced tracking, and more!
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <i className="fas fa-crown"></i>
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Goals</p>
                <p className="text-3xl font-bold text-purple-600">{activeGoals.length}</p>
              </div>
              <i className="fas fa-target text-4xl text-purple-200"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Daily</p>
                <p className="text-3xl font-bold text-pink-600">{dailyGoals.length}</p>
              </div>
              <i className="fas fa-calendar-day text-4xl text-pink-200"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Weekly</p>
                <p className="text-3xl font-bold text-indigo-600">{weeklyGoals.length}</p>
              </div>
              <i className="fas fa-calendar-week text-4xl text-indigo-200"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <i className="fas fa-check-circle text-4xl text-green-200"></i>
            </div>
          </div>
        </div>

        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <i className="fas fa-bullseye text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Goals Yet!</h3>
            <p className="text-gray-600 mb-6">Start setting goals to track your progress and achievements</p>
            <button
              onClick={handleCreateGoal}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <>
            {/* DAILY GOALS */}
            {dailyGoals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📅 Daily Goals
                  <span className="text-sm font-normal text-gray-500">({dailyGoals.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dailyGoals.map(goal => (
                    <div key={goal.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-purple-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${getTypeColor(goal.type)}`}>
                            {getTypeIcon(goal.type)} {goal.type.toUpperCase()}
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span className="font-bold text-purple-600">{getProgressPercentage(goal)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(goal)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span><i className="fas fa-calendar mr-1"></i>Due: {goal.dueDate}</span>
                        <span><i className="fas fa-clock mr-1"></i>Created: {goal.createdAt}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProgress(goal.id)}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                        >
                          <i className="fas fa-plus mr-2"></i>Update
                        </button>
                        <button
                          onClick={() => handleAbandonGoal(goal.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                          title="Mark as abandoned"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                          title="Delete goal"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WEEKLY GOALS */}
            {weeklyGoals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📆 Weekly Goals
                  <span className="text-sm font-normal text-gray-500">({weeklyGoals.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weeklyGoals.map(goal => (
                    <div key={goal.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-pink-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${getTypeColor(goal.type)}`}>
                            {getTypeIcon(goal.type)} {goal.type.toUpperCase()}
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span className="font-bold text-pink-600">{getProgressPercentage(goal)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-pink-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(goal)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span><i className="fas fa-calendar mr-1"></i>Due: {goal.dueDate}</span>
                        <span><i className="fas fa-clock mr-1"></i>Created: {goal.createdAt}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProgress(goal.id)}
                          className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-medium"
                        >
                          <i className="fas fa-plus mr-2"></i>Update
                        </button>
                        <button
                          onClick={() => handleAbandonGoal(goal.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                          title="Mark as abandoned"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                          title="Delete goal"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MONTHLY GOALS */}
            {monthlyGoals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🗓️ Monthly Goals
                  <span className="text-sm font-normal text-gray-500">({monthlyGoals.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthlyGoals.map(goal => (
                    <div key={goal.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-indigo-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${getTypeColor(goal.type)}`}>
                            {getTypeIcon(goal.type)} {goal.type.toUpperCase()}
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          <span className="font-bold text-indigo-600">{getProgressPercentage(goal)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(goal)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span><i className="fas fa-calendar mr-1"></i>Due: {goal.dueDate}</span>
                        <span><i className="fas fa-clock mr-1"></i>Created: {goal.createdAt}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProgress(goal.id)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                        >
                          <i className="fas fa-plus mr-2"></i>Update
                        </button>
                        <button
                          onClick={() => handleAbandonGoal(goal.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                          title="Mark as abandoned"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                          title="Delete goal"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED GOALS */}
            {completedGoals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  ✅ Completed Goals
                  <span className="text-sm font-normal text-gray-500">({completedGoals.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedGoals.map(goal => (
                    <div key={goal.id} className="bg-green-50 p-6 rounded-xl shadow-md border-2 border-green-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 bg-green-200 text-green-800 border border-green-400">
                            ✅ COMPLETED
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-white rounded-lg">
                        <p className="text-sm text-green-700 font-medium">
                          <i className="fas fa-trophy mr-2"></i>
                          Achieved: {goal.targetValue} {goal.unit}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span><i className="fas fa-check-circle mr-1"></i>Completed: {goal.completedAt}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                      >
                        <i className="fas fa-trash mr-2"></i>Remove from History
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ALERT MODAL */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="text-center">
              {alertModal.type === "success" && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-3xl text-green-600"></i>
                </div>
              )}
              {alertModal.type === "error" && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-times-circle text-3xl text-red-600"></i>
                </div>
              )}
              {alertModal.type === "warning" && (
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-3xl text-amber-600"></i>
                </div>
              )}
              {alertModal.type === "info" && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-info-circle text-3xl text-blue-600"></i>
                </div>
              )}
              <p className="text-lg text-gray-800 mb-6 whitespace-pre-line">{alertModal.message}</p>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all w-full"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-purple-600 mb-6">{promptModal.title}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const values = promptModal.fields.map((_, index) => formData.get(`field-${index}`) as string);
                promptModal.onSubmit(values);
              }}
            >
              {promptModal.fields.map((field, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === "select" && field.options ? (
                    <select
                      name={`field-${index}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required={field.label.includes("*")}
                    >
                      <option value="">Select...</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={`field-${index}`}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required={field.label.includes("*")}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setPromptModal({ show: false, title: "", fields: [], onSubmit: () => {} })}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
