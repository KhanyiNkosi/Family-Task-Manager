"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import NotificationAlert from '@/components/NotificationAlert';
import { useNotifications } from '@/hooks/useNotifications';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  completed: boolean;
  due_date?: string;
  created_at: string;
  completed_at?: string;
  approved?: boolean;
  category?: string;
  help_requested?: boolean;
  help_message?: string;
  assigned_to?: string;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  family_id: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'rejected';
  redeemed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  reward?: Reward;
}

export default function ChildDashboardPage() {
  // Child avatar state
  const [childAvatar, setChildAvatar] = useState("child");
  const [profileImage, setProfileImage] = useState(""); // Profile picture state
  const [isClient, setIsClient] = useState(false);

  // Use the notifications hook for real-time notifications
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissNotification 
  } = useNotifications();

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Task filter and sort state
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all");
  const [taskSortBy, setTaskSortBy] = useState<"date" | "points" | "name">("date");

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
          console.log('Loaded tasks:', childTasks.length, 'tasks found');
          console.log('Task data:', childTasks);
          setTasks(childTasks);
        } else {
          console.log('No tasks data returned (null/undefined)');
        }
        
        // Load available rewards for the family
        const { data: profile } = await supabase
          .from('profiles')
          .select('family_id')
          .eq('id', user.id)
          .single();

        console.log('User profile:', profile);

        if (profile?.family_id) {
          console.log('Family ID found:', profile.family_id);
          const { data: familyRewards, error: rewardsError } = await supabase
            .from('rewards')
            .select('*')
            .eq('family_id', profile.family_id)
            .eq('is_active', true)
            .order('points_cost', { ascending: true });

          if (rewardsError) {
            console.error('Error fetching rewards:', rewardsError);
          } else if (familyRewards) {
            console.log('Loaded rewards:', familyRewards.length, 'rewards found');
            setRewards(familyRewards);
          } else {
            console.log('No rewards data returned');
          }

          // Load child's reward redemptions
          const { data: userRedemptions, error: redemptionsError } = await supabase
            .from('reward_redemptions')
            .select(`
              *,
              reward:rewards(*)
            `)
            .eq('user_id', user.id)
            .order('redeemed_at', { ascending: false });

          if (redemptionsError) {
            console.error('Error fetching redemptions:', redemptionsError);
          } else if (userRedemptions) {
            console.log('Loaded redemptions:', userRedemptions.length, 'redemptions found');
            setRedemptions(userRedemptions);
          } else {
            console.log('No redemptions data returned');
          }
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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isClient) return;

    const supabase = createClientSupabaseClient();

    // Subscribe to task changes for this user
    const tasksSubscription = supabase
      .channel('child-tasks-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task change detected:', payload);
          
          // Check if this task is assigned to current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && (payload.new?.assigned_to === user.id || payload.old?.assigned_to === user.id)) {
              // Show notification
              if (payload.eventType === 'INSERT') {
                setToast({
                  show: true,
                  message: `New task assigned: ${payload.new.title} (+${payload.new.points} points)`
                });
                setTimeout(() => setToast({ show: false, message: "" }), 4000);
              } else if (payload.eventType === 'UPDATE' && payload.new.approved && !payload.old.approved) {
                setToast({
                  show: true,
                  message: `Task approved! You earned ${payload.new.points} points! 🎉`
                });
                setTimeout(() => setToast({ show: false, message: "" }), 4000);
              }
              
              // Reload tasks and points
              const fetchUpdatedData = async () => {
                const { data: childTasks } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('assigned_to', user.id)
                  .order('created_at', { ascending: false });
                
                if (childTasks) {
                  setTasks(childTasks);
                }

                const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('total_points')
                  .eq('id', user.id)
                  .single();
                
                if (userProfile) {
                  setPoints(userProfile.total_points || 0);
                }
              };
              
              fetchUpdatedData();
            }
          });
        }
      )
      .subscribe();

    // Subscribe to reward redemption changes
    const redemptionsSubscription = supabase
      .channel('child-redemptions-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reward_redemptions' },
        (payload) => {
          console.log('Redemption change detected:', payload);
          
          // Check if this redemption belongs to current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && payload.new?.user_id === user.id) {
              // Show notification
              if (payload.new.status === 'approved' && payload.old.status === 'pending') {
                setToast({
                  show: true,
                  message: `Reward approved! Enjoy your reward! 🎁`
                });
                setTimeout(() => setToast({ show: false, message: "" }), 4000);
              } else if (payload.new.status === 'rejected' && payload.old.status === 'pending') {
                setToast({
                  show: true,
                  message: `Reward request was declined. Try again later.`
                });
                setTimeout(() => setToast({ show: false, message: "" }), 4000);
              }

              // Reload redemptions and points
              const fetchUpdatedData = async () => {
                const { data: userRedemptions } = await supabase
                  .from('reward_redemptions')
                  .select(`
                    *,
                    reward:rewards(*)
                  `)
                  .eq('user_id', user.id)
                  .order('redeemed_at', { ascending: false });

                if (userRedemptions) {
                  setRedemptions(userRedemptions);
                }

                const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('total_points')
                  .eq('id', user.id)
                  .single();

                if (userProfile) {
                  setPoints(userProfile.total_points || 0);
                }
              };

              fetchUpdatedData();
            }
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(redemptionsSubscription);
    };
  }, [isClient]);

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

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    // Apply status filter
    if (taskStatusFilter === "pending") {
      filtered = filtered.filter(t => !t.completed && !t.approved);
    } else if (taskStatusFilter === "completed") {
      filtered = filtered.filter(t => t.completed || t.approved);
    }

    // Apply category filter
    if (taskCategoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === taskCategoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (taskSortBy) {
        case "points":
          return b.points - a.points;
        case "name":
          return a.title.localeCompare(b.title);
        case "date":
        default:
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const completeTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      console.log('Completing task:', taskId);
      
      // Update task in database - set completed to true
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('Error completing task:', error);
        alert(`Failed to complete task: ${error.message}`);
        return;
      }

      console.log('Task update successful:', data);

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
      alert(`Error: ${error.message}`);
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

  const redeemReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    
    if (!reward) return;

    // Check if already redeemed (pending or approved)
    const existingRedemption = redemptions.find(
      r => r.reward_id === rewardId && (r.status === 'pending' || r.status === 'approved')
    );

    if (existingRedemption) {
      alert('You have already requested this reward!');
      return;
    }

    if (points < reward.points_cost) {
      alert(`You need ${reward.points_cost} points to redeem this reward!`);
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to redeem rewards');
        return;
      }

      // Create redemption request
      const { data: newRedemption, error } = await supabase
        .from('reward_redemptions')
        .insert({
          reward_id: rewardId,
          user_id: user.id,
          points_spent: reward.points_cost,
          status: 'pending'
        })
        .select(`
          *,
          reward:rewards(*)
        `)
        .single();

      if (error) {
        console.error('Error creating redemption:', error);
        alert('Failed to redeem reward: ' + error.message);
        return;
      }

      if (newRedemption) {
        setRedemptions([newRedemption, ...redemptions]);
        setToast({ 
          show: true, 
          message: `Request for "${reward.title}" sent for parent approval!` 
        });
        setTimeout(() => setToast({ show: false, message: "" }), 4000);
      }
    } catch (error) {
      console.error('Error in redeemReward:', error);
      alert('Failed to redeem reward');
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
    redeemed: redemptions.filter(r => r.status === 'approved').length
  };

  const todoTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="dashboard-container flex min-h-screen bg-gray-50">
      <NotificationAlert
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
        maxNotifications={3}
        autoClose={8000}
      />

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
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Your Tasks</h2>
              <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium">
                {todoTasks.length} pending
              </span>
            </div>

            {/* Filter and Sort Controls */}
            <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value as "all" | "pending" | "completed")}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending Only</option>
                    <option value="completed">Completed Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={taskCategoryFilter}
                    onChange={(e) => setTaskCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="chores">Chores</option>
                    <option value="homework">Homework</option>
                    <option value="school">School</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="pets">Pets</option>
                    <option value="personal">Personal Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value as "date" | "points" | "name")}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="date">Date (Newest First)</option>
                    <option value="points">Points (Highest First)</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
              {getFilteredAndSortedTasks().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-tasks text-4xl text-gray-300 mb-3"></i>
                  {tasks.length === 0 ? (
                    <>
                      <p>No tasks yet!</p>
                      <p className="text-sm">Your parent will assign tasks to you soon.</p>
                    </>
                  ) : (
                    <>
                      <p>No tasks match your filters</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </>
                  )}
                </div>
              ) : (
                getFilteredAndSortedTasks().map((task) => (
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${task.completed ? 'text-[#00C2E0]/70 line-through' : 'text-gray-800'}`}>
                            {task.title}
                          </span>
                          {task.category && (
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium capitalize">
                              {task.category}
                            </span>
                          )}
                        </div>
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
              )))}
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Available Rewards</h2>
              <span className="text-lg font-bold text-[#006372] flex items-center gap-1">
                <i className="fas fa-star text-amber-500"></i>
                {points} points
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-trophy text-4xl text-gray-300 mb-3"></i>
                  <p>No rewards available yet</p>
                  <p className="text-sm">Ask your parents to create some rewards!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rewards.map((reward) => {
                  const redemption = redemptions.find(
                    r => r.reward_id === reward.id && (r.status === 'pending' || r.status === 'approved')
                  );
                  const isRedeemed = redemption?.status === 'approved';
                  const isPending = redemption?.status === 'pending';
                  
                  return (
                    <div
                      key={reward.id}
                      className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-300 ${
                        isRedeemed
                          ? 'bg-green-50 border-green-200'
                          : isPending
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200'
                      }`}
                    >
                      {isRedeemed ? (
                        <div className="text-center py-4">
                          <i className="fas fa-check-circle text-2xl text-green-600 mb-2"></i>
                          <div className="font-bold text-green-700">Approved!</div>
                          <div className="text-sm text-green-600">{reward.title}</div>
                          {redemption?.approved_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(redemption.approved_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : isPending ? (
                        <div className="text-center py-4">
                          <i className="fas fa-clock text-2xl text-amber-600 mb-2"></i>
                          <div className="font-bold text-amber-700">Pending Approval</div>
                          <div className="text-sm text-amber-600">{reward.title}</div>
                          <div className="text-xs text-gray-500 mt-1">Waiting for parent...</div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-800">{reward.title}</h4>
                            <div className="font-bold text-[#00C2E0] flex items-center gap-1">
                              <i className="fas fa-star text-amber-500 text-sm"></i>
                              {reward.points_cost}
                            </div>
                          </div>
                          {reward.description && (
                            <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                          )}
                          <button
                            onClick={() => redeemReward(reward.id)}
                            disabled={points < reward.points_cost}
                            className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                              points >= reward.points_cost
                                ? 'bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {points >= reward.points_cost ? (
                              <>
                                <i className="fas fa-gift mr-2"></i>
                                Redeem Reward
                              </>
                            ) : (
                              <>
                                <i className="fas fa-lock mr-2"></i>
                                Need {reward.points_cost - points} More Points
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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








