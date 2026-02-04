"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  completed: boolean;
  due_date?: string;
  created_at: string;
}

export default function ChildDashboardPage() {
  // Child avatar state
  const [childAvatar, setChildAvatar] = useState("child");
  const [profileImage, setProfileImage] = useState(""); // Profile picture state
  const [isClient, setIsClient] = useState(false);

  // Load avatar from localStorage
 useEffect(() => {
  setIsClient(true);
  const savedAvatar = localStorage.getItem("childAvatar") || "child";
  console.log("Dashboard loading child avatar:", savedAvatar);
  setChildAvatar(savedAvatar);
  
  // Load profile picture from localStorage
  const savedProfileImage = localStorage.getItem("childProfileImage") || "";
  console.log("Dashboard loading child profile image:", savedProfileImage ? "Image found" : "No image");
  setProfileImage(savedProfileImage);
}, []);

  // Avatar options (same as child-profile)
  const avatars = [
    { id: "child", emoji: "👦", label: "Boy" },
    { id: "girl", emoji: "👧", label: "Girl" },
    { id: "robot", emoji: "🤖", label: "Robot" },
    { id: "superhero", emoji: "🦸", label: "Superhero" },
    { id: "astronaut", emoji: "🧑‍🚀", label: "Astronaut" },
    { id: "alien", emoji: "👽", label: "Alien" },
    { id: "ninja", emoji: "🥷", label: "Ninja" },
    { id: "wizard", emoji: "🧙", label: "Wizard" },
  ];
  const router = useRouter();
  const pathname = usePathname();
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState([]);;
  const [rewards, setRewards] = useState([
    { id: 1, name: "Extra Screen Time", description: "30 minutes extra gaming or TV", points: 50, redeemed: false },
    { id: 2, name: "Choose Dinner", description: "Pick what we eat for dinner", points: 100, redeemed: false },
    { id: 3, name: "Stay Up Late", description: "Stay up 30 mins past bedtime", points: 150, redeemed: false },
    { id: 4, name: "Movie Night", description: "Choose the family movie", points: 200, redeemed: false }
  ]);
  const [toast, setToast] = useState({ show: false, message: "" });

  // === CHILD-ONLY PERMISSION SYSTEM ===


  // === SUPABASE DATA FETCHING ===
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClientSupabaseClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          return;
        }

        console.log('Loading tasks for child:', user.id);
        
        // Fetch child's assigned tasks
        const { data: childTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else if (childTasks) {
          console.log('Loaded tasks:', childTasks);
          setTasks(childTasks);
        }
        
        // Calculate total points from user_profiles
        let { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();
        
        console.log('Loading points for user:', user.id);
        console.log('User profile data:', userProfile, 'Error:', profileError);
        
        // If no profile exists, create one
        if (!userProfile && profileError) {
          console.log('No user profile found, creating one...');
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({ id: user.id, role: 'child', total_points: 0 })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
          } else {
            userProfile = newProfile;
            console.log('Created new profile:', newProfile);
          }
        }
        
        if (userProfile) {
          console.log('Setting points to:', userProfile.total_points || 0);
          setPoints(userProfile.total_points || 0);
        } else {
          console.log('No user profile found, points remain at 0');
        }
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    
    fetchDashboardData();
  }, []);
  useEffect(() => {
    // Check if user is trying to access parent-only routes
    const parentOnlyRoutes = [
      "/parent-dashboard",
      "/parent-profile", 
      "/rewards-store",
      "/ai-suggester",
      "/settings",
      "/monitor-child"
    ];
    
    if (parentOnlyRoutes.includes(pathname)) {
      alert("Access Denied! This section is for parents only.");
      router.push("/child-dashboard");
      return;
    }
    
    // Also check for any "parent-" routes
    if (pathname.includes("parent-")) {
      alert("Parent section detected! Redirecting to child dashboard.");
      router.push("/child-dashboard");
    }
  }, [pathname, router]);

  // === CHILD-ONLY NAVIGATION ===
  // Children can only access child sections
  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home", active: false },
    { href: "/child-dashboard", icon: "fas fa-th-large", label: "My Dashboard", active: true },
    { href: "/child-profile", icon: "fas fa-user", label: "My Profile", active: false },
    { href: "/my-rewards", icon: "fas fa-gift", label: "My Rewards", active: false },
  ];
  
  // === PERMISSION-CHECKED NAVIGATION HANDLER ===
  const handleNavigation = (href: string) => {
    const blockedRoutes = ["/parent-", "/rewards-store", "/ai-suggester", "/settings"];
    
    if (blockedRoutes.some(route => href.includes(route))) {
      setToast({ 
        show: true, 
        message: "Access denied! This section is for parents only." 
      });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return false;
    }
    return true;
  };

  const completeTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Update task in database
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error completing task:', error);
        alert('Failed to complete task');
        return;
      }

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: true, completed_at: new Date().toISOString() } : task
      ));
      
      const task = tasks.find(t => t.id === taskId);
      if (task && !task.completed) {
        // Note: Points will be awarded when parent approves
        setToast({ 
          show: true, 
          message: `Completed "${task.title}"! Waiting for parent approval to earn ${task.points} points!` 
        });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
      }
    } catch (error) {
      console.error('Error in completeTask:', error);
    }
  };

  const requestHelp = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      // Prompt for help message
      const helpMessage = prompt(`What help do you need with "${task?.title}"?`);
      
      if (!helpMessage || !helpMessage.trim()) {
        return; // User cancelled or provided empty message
      }
      
      const supabase = createClientSupabaseClient();
      
      // Update task to mark help requested
      const { error } = await supabase
        .from('tasks')
        .update({ 
          help_requested: true,
          help_requested_at: new Date().toISOString(),
          help_message: helpMessage.trim()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error requesting help:', error);
        alert('Failed to request help');
        return;
      }

      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, help_requested: true, help_message: helpMessage.trim() } : t
      ));
      
      setToast({ 
        show: true, 
        message: `Help request sent to parent for "${task?.title}"!` 
      });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    } catch (error) {
      console.error('Error in requestHelp:', error);
    }
  };

  const redeemReward = (rewardId: number) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && points >= reward.points && !reward.redeemed) {
      setRewards(rewards.map(r => 
        r.id === rewardId ? { ...r, redeemed: true } : r
      ));
      setPoints(prev => prev - reward.points);
      
      setToast({ 
        show: true, 
        message: `Request for "${reward.name}" sent for approval!` 
      });
      setTimeout(() => setToast({ ...toast, show: false }), 4000);
    } else if (reward && points < reward.points) {
      alert(`You need ${reward.points} points to redeem this reward!`);
    }
  };

  const getPepTalk = () => {
    const pepTalks = [
      "You're doing amazing! Keep up the great work!",
      "Every task you complete brings you closer to awesome rewards!",
      "Your consistency is inspiring!",
      "Keep going, superstar! You've got this!"
    ];
    alert(pepTalks[Math.floor(Math.random() * pepTalks.length)]);
  };

  const stats = {
    todo: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    redeemed: rewards.filter(r => r.redeemed).length
  };

  const todoTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="dashboard-container flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation - CHILD-ONLY VERSION */}
      <aside className="sidebar bg-gradient-to-b from-[#006372] to-[#004955] text-white w-64 p-6 fixed h-screen">
        <div className="logo flex items-center gap-3 text-2xl font-extrabold mb-10">
          <i className="fas fa-smile text-3xl"></i>
          <span>FamilyTask</span>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (!handleNavigation(item.href)) {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                pathname === item.href || item.active
                  ? "bg-white/20 text-white shadow-lg"
                  : "hover:bg-white/10 text-white/90"
              }`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
                <div className="mt-auto pt-6 border-t border-white/20 space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Go Back</span>
          </button>
          
          {/* Logout Button */}
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      <main className="main-content ml-64 flex-1 p-10">
        {/* Header with permission badge */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#006372]">Child Dashboard</h1>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <i className="fas fa-child mr-1"></i> Child Account
              </span>
            </div>
            <p className="text-gray-600">Complete tasks, earn points, and get rewards!</p>
          </div>
          
                      <div className="mt-4 md:mt-0 flex items-center gap-4">
              
              <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg">
              <div className="text-sm font-medium">My Points</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <i className="fas fa-star text-yellow-300"></i> {points.toLocaleString()}
              </div>
            </div>
            
            <button
              onClick={getPepTalk}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <i className="fas fa-sparkles mr-2"></i>
              Pep Talk!
            </button>
              {/* Child Avatar Badge */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
             <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-r from-cyan-500 to-teal-500">
  {isClient && profileImage ? (
    <img 
      src={profileImage} 
      alt="Child Profile" 
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-white font-bold">
      <i className="fas fa-child"></i>
    </div>
  )}
</div>

               
                <span className="font-medium text-gray-700">Child Dashboard</span>
              </div>
              
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[#00C2E0]/70 text-sm font-medium">Tasks To-Do</h3>
                <div className="text-3xl font-bold text-[#006372] mt-2">{stats.todo}</div>
              </div>
              <i className="fas fa-clipboard-list text-3xl text-cyan-500"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[#00C2E0]/70 text-sm font-medium">Tasks Completed</h3>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</div>
              </div>
              <i className="fas fa-check-circle text-3xl text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[#00C2E0]/70 text-sm font-medium">Rewards Redeemed</h3>
                <div className="text-3xl font-bold text-[#006372] mt-2">{stats.redeemed}</div>
              </div>
              <i className="fas fa-gift text-3xl text-[#00C2E0]"></i>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Your Tasks</h2>
              <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium">
                {todoTasks.length} pending
              </span>
            </div>
            
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  } transition-all`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-1 ${
                        task.completed ? 'bg-green-500' : 'border-2 border-gray-400'
                      }`}>
                        {task.completed && (
                          <i className="fas fa-check text-white text-xs"></i>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium block ${task.completed ? 'text-[#00C2E0]/70 line-through' : 'text-gray-800'}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        {task.help_requested && (
                          <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            <i className="fas fa-hand-paper mr-1"></i>Help Requested
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-bold text-amber-500 flex items-center justify-end gap-1">
                        <i className="fas fa-star text-sm"></i>
                        <span className="text-[#00C2E0]">{task.points}</span>
                      </div>
                      {task.category && task.category !== 'general' && (
                        <div className="text-xs text-[#00C2E0]/70 capitalize mt-1">{task.category}</div>
                      )}
                    </div>
                  </div>
                  
                  {!task.completed && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => completeTask(task.id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <i className="fas fa-check mr-2"></i>Mark Complete
                      </button>
                      {!task.help_requested && (
                        <button
                          onClick={() => requestHelp(task.id)}
                          className="bg-amber-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                          title="Request help from parent"
                        >
                          <i className="fas fa-hand-paper"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Available Rewards</h2>
              <span className="text-lg font-bold text-[#006372]">{points} points</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    reward.redeemed
                      ? 'bg-gray-50 border-cyan-100'
                      : 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200'
                  }`}
                >
                  {reward.redeemed ? (
                    <div className="text-center py-4">
                      <i className="fas fa-check-circle text-2xl text-[#00C2E0]/70 mb-2"></i>
                      <div className="font-bold text-[#006372]">Redeemed</div>
                      <div className="text-sm text-[#00C2E0]/70">{reward.name}</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800">{reward.name}</h4>
                        <div className="font-bold text-[#00C2E0]">{reward.points} pts</div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                      <button
                        onClick={() => redeemReward(reward.id)}
                        disabled={points < reward.points}
                        className={`w-full py-2.5 rounded-lg font-medium ${
                          points >= reward.points
                            ? 'bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90'
                            : 'bg-gray-300 text-[#00C2E0]/70 cursor-not-allowed'
                        }`}
                      >
                        {points >= reward.points ? 'Redeem Reward' : 'Need More Points'}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#006372] font-medium">Weekly Goal</span>
                <span className="font-bold text-[#00C2E0]">{Math.round((stats.completed / tasks.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.completed / tasks.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center text-gray-600 text-sm">
              Complete {tasks.length - stats.completed} more tasks this week to reach 100%!
            </div>
          </div>
        </div>
        
        {/* Permission Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-shield-alt text-blue-500 text-xl mt-1"></i>
            <div>
              <h3 className="font-bold text-blue-800">Child Account Protection</h3>
              <p className="text-blue-700 text-sm mt-1">
                Your account has restricted access. You can view your dashboard, profile, and rewards only. 
                Parent-only sections are automatically blocked.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-white p-4 rounded-xl shadow-2xl border-l-4 border-[#00C2E0] animate-slideIn">
          <div className="font-bold text-gray-800 mb-1">Great Job! 🎉</div>
          <div className="text-sm text-gray-600">{toast.message}</div>
        </div>
      )}
    </div>
  );
}








