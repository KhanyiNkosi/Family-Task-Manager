"use client";

import { useState, useEffect } from "react";
import NotificationAlert, { Notification, NotificationType } from '@/components/NotificationAlert';
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AddChildSection from '@/components/AddChildSection';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  assigned_to?: string;
  points: number;
  dueDate?: string;
  due_date?: string;
  status: "pending" | "completed" | "approved";
  completed?: boolean;
  description?: string;
  created_at?: string;
  completed_at?: string;
}

interface Child {
  id: number;
  name: string;
  points: number;
  avatar: string;
  tasksCompleted: number;
}

interface BulletinMessage {
  id: number;
  avatar: string;
  message: string;
  timestamp: string;
}

interface RewardRequest {
  id: number;
  child: string;
  name: string;
  requester: string;
  points: number;
  status: "pending" | "approved" | "rejected";
}

export default function ParentDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [parentProfileImage, setParentProfileImage] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  


  // Load profile image from localStorage
  useEffect(() => {
    setIsClient(true);
    const savedImage = localStorage.getItem("parentProfileImage") || "";
    console.log("Dashboard loading profile image:", savedImage ? "Image found" : "No image");
    setParentProfileImage(savedImage);
  }, []);

  // Navigation items
  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/parent-dashboard", icon: "fas fa-chart-bar", label: "Dashboard", active: true },
    { href: "/ai-tasks", icon: "fas fa-robot", label: "AI Tasks" },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
    { href: "/parent-profile", icon: "fas fa-user", label: "Profile" },
  ];

  // State for tasks
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);

  // State for children
  const [children, setChildren] = useState<Child[]>([]);
  const [familyChildren, setFamilyChildren] = useState<{ id: string; name: string; total_points?: number }[]>([]);

  // State for bulletin messages
  const [bulletinMessages, setBulletinMessages] = useState<BulletinMessage[]>([]);

  // State for reward requests
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);

  // New task form state
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPoints, setNewTaskPoints] = useState("10");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newBulletinMessage, setNewBulletinMessage] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("general");

  // Permission check for child modifications
  const canModifyChild = false;
  const canViewChild = true;

  const handleChildAction = (action: string) => {
    if (!canModifyChild) {
      return;
    }
  };

  // Load tasks from database
  useEffect(() => {
    loadTasks();
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        console.log('No family_id found for parent');
        return;
      }

      console.log('Parent family_id:', profile.family_id);

      // Load all profiles in the family
      const { data: familyProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('family_id', profile.family_id);

      if (profilesError) {
        console.error('Error loading family profiles:', profilesError);
        return;
      }

      console.log('Family profiles:', familyProfiles);

      if (familyProfiles && familyProfiles.length > 0) {
        // For each profile, check if they're a child and get their points
        const childrenWithPoints = [];
        
        for (const familyMember of familyProfiles) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role, total_points')
            .eq('id', familyMember.id)
            .single();
          
          // Only include children
          if (userProfile?.role === 'child') {
            childrenWithPoints.push({
              id: familyMember.id,
              name: familyMember.full_name,
              total_points: userProfile.total_points || 0
            });
          }
        }
        
        setFamilyChildren(childrenWithPoints);
        console.log('Children loaded with points:', childrenWithPoints);
      }
    } catch (error) {
      console.error('Error in loadChildren:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) return;

      // Load all tasks for this family
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      if (tasks) {
        const formattedTasks = tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignedTo: task.assigned_to,
          assigned_to: task.assigned_to,
          points: task.points,
          status: task.approved ? 'approved' : task.completed ? 'completed' : 'pending',
          completed: task.completed,
          approved: task.approved || false,
          dueDate: task.due_date,
          due_date: task.due_date,
          created_at: task.created_at,
          completed_at: task.completed_at,
          help_requested: task.help_requested || false,
          help_requested_at: task.help_requested_at,
          help_message: task.help_message,
          category: task.category
        }));
        setActiveTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error in loadTasks:', error);
    }
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskAssignee) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to create tasks');
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      // Insert task into database
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskName,
          description: newTaskDescription.trim() || null,
          points: parseInt(newTaskPoints) || 10,
          assigned_to: newTaskAssignee,
          created_by: user.id,
          family_id: profile?.family_id,
          completed: false,
          approved: false,
          category: newTaskCategory
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task: ' + error.message);
        return;
      }

      // Add to local state
      if (newTask) {
        const formattedTask: Task = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          assignedTo: newTask.assigned_to,
          assigned_to: newTask.assigned_to,
          points: newTask.points,
          status: newTask.completed ? 'completed' : 'pending',
          completed: newTask.completed,
          dueDate: newTask.due_date,
          due_date: newTask.due_date,
          created_at: newTask.created_at
        };
        setActiveTasks([formattedTask, ...activeTasks]);
      }

      // Clear form
      setNewTaskName("");
      setNewTaskDescription("");
      setNewTaskPoints("10");
      setNewTaskAssignee("");
      setNewTaskCategory("general");
      alert("New task added successfully!");
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      alert('Failed to create task');
    }
  };

  // Complete task
  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = activeTasks?.map(task =>
      task.id === taskId ? { ...task, status: "completed" as const } : task
    );
    setActiveTasks(updatedTasks);
    alert("Task marked as completed!");
  };

  // Approve task completion
  const handleApproveTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Get the task to find points and assigned user
      const task = activeTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      console.log('Approving task:', { taskId, assignedTo: task.assigned_to, points: task.points });

      // Update task status to approved
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ completed: true, approved: true })
        .eq('id', taskId);

      if (taskError) {
        console.error('Error approving task:', taskError);
        alert('Failed to approve task');
        return;
      }

      // Award points to child
      console.log('Attempting to award points via RPC...');
      const { error: pointsError } = await supabase.rpc('increment_user_points', {
        user_id: task.assigned_to,
        points_to_add: task.points
      });

      if (pointsError) {
        console.log('RPC failed, using manual update. Error:', pointsError);
        // If RPC doesn't exist, manually update
        const { data: userProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('total_points')
          .eq('id', task.assigned_to)
          .single();

        console.log('Current user profile:', userProfile, 'Fetch error:', fetchError);

        if (userProfile) {
          const newTotal = (userProfile.total_points || 0) + task.points;
          console.log('Updating points from', userProfile.total_points, 'to', newTotal);
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ total_points: newTotal })
            .eq('id', task.assigned_to);
            
          if (updateError) {
            console.error('Error updating points:', updateError);
            alert('Task approved but failed to award points');
            return;
          }
          console.log('Points updated successfully!');
        } else {
          console.error('User profile not found for:', task.assigned_to);
          alert('Task approved but user profile not found');
          return;
        }
      } else {
        console.log('Points awarded successfully via RPC!');
      }

      // Update local state - remove from list or mark as approved
      setActiveTasks(activeTasks.filter(t => t.id !== taskId));
      alert(`Task approved! ${task.points} points awarded to child!`);
    } catch (error) {
      console.error('Error in handleApproveTask:', error);
      alert('Failed to approve task');
    }
  };

  // Reject task completion
  const handleRejectTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Set task back to incomplete
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: false,
          completed_at: null,
          approved: false
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error rejecting task:', error);
        alert('Failed to reject task');
        return;
      }

      // Update local state
      setActiveTasks(activeTasks.map(task =>
        task.id === taskId ? { ...task, status: 'pending', completed: false, completed_at: undefined } : task
      ));
      
      alert('Task rejected and sent back to child');
    } catch (error) {
      console.error('Error in handleRejectTask:', error);
      alert('Failed to reject task');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      const supabase = createClientSupabaseClient();
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
        return;
      }

      setActiveTasks(activeTasks.filter(task => task.id !== taskId));
      alert('Task deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteTask:', error);
      alert('Failed to delete task');
    }
  };

  // Resolve help request
  const handleResolveHelp = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          help_requested: false,
          help_requested_at: null,
          help_message: null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error resolving help request:', error);
        alert('Failed to resolve help request');
        return;
      }

      // Update local state
      setActiveTasks(activeTasks.map(task =>
        task.id === taskId ? { ...task, help_requested: false, help_requested_at: null, help_message: null } : task
      ));
      
      alert('Help request resolved!');
    } catch (error) {
      console.error('Error in handleResolveHelp:', error);
      alert('Failed to resolve help request');
    }
  };

  // Add bulletin message
  const handleAddBulletinMessage = () => {
    if (!newBulletinMessage.trim()) return;

    const newMessage: BulletinMessage = {
      id: bulletinMessages?.length + 1,
      avatar: "P",
      message: newBulletinMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBulletinMessages([newMessage, ...bulletinMessages]);
    setNewBulletinMessage("");
  };

  // Delete bulletin message
  const handleDeleteBulletinMessage = (messageId: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      const updatedMessages = bulletinMessages?.filter(msg => msg.id !== messageId);
      setBulletinMessages(updatedMessages);
    }
  };

  // Handle reward request
  const handleRewardRequest = (requestId: number, status: "approved" | "rejected") => {
    const updatedRequests = rewardRequests?.map(request =>
      request.id === requestId ? { ...request, status } : request
    );
    setRewardRequests(updatedRequests);
    alert(`Reward request ${status === "approved" ? "approved" : "rejected"}!`);
  };

  // Calculate totals
  const totalPoints = familyChildren?.reduce((sum, child) => sum + (child.total_points || 0), 0) || 0;
  const pendingTasks = activeTasks?.filter(task => !task.completed).length || 0;
  const completedTasks = activeTasks?.filter(task => task.completed && task.approved).length || 0;
  
  console.log('Dashboard stats:', { 
    totalTasks: activeTasks?.length,
    pendingTasks, 
    completedTasks,
    activeTasks: activeTasks?.map(t => ({ title: t.title, completed: t.completed, approved: t.approved }))
  });

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('userName');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE]">
      <NotificationAlert
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onMarkAsRead={handleMarkAsRead}
        maxNotifications={3}
        autoClose={8000}
      />

      <div className="flex">
        {/* SIDEBAR */}
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
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                  pathname === item.href || item.active
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/20 space-y-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <p className="text-sm text-white/80">Logged in as:</p>
              <p className="font-bold text-white">Parent</p>
            </div>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
            >
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-100 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-400/30"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="ml-64 flex-1 p-8">
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#006372]">Family Dashboard</h1>
                <p className="text-gray-600 mt-2">Monitor your family's tasks, rewards, and activities</p>
              </div>
              <div className="flex items-center gap-4">
                
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] flex items-center justify-center text-white overflow-hidden">
                    {isClient && parentProfileImage ? (
                      <img 
                        src={parentProfileImage} 
                        alt="Parent" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-white text-sm"></i>
                    )}
                  </div>
                  <span className="font-medium text-gray-700">Parent Dashboard</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Points</p>
                    <p className="text-2xl font-bold mt-1">{totalPoints}</p>
                  </div>
                  <i className="fas fa-star text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Pending Tasks</p>
                    <p className="text-2xl font-bold mt-1">{pendingTasks}</p>
                  </div>
                  <i className="fas fa-tasks text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Completed Tasks</p>
                    <p className="text-2xl font-bold mt-1">{completedTasks}</p>
                  </div>
                  <i className="fas fa-check-circle text-2xl opacity-80"></i>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Active Children</p>
                    <p className="text-2xl font-bold mt-1">{familyChildren?.length || 0}</p>
                  </div>
                  <i className="fas fa-users text-2xl opacity-80"></i>
                </div>
              </div>
            </div>
          </header>

          {/* Add Child Section */}
          <div className="mb-8">
            <AddChildSection onChildrenLoaded={async (childrenData) => {
              console.log('Parent dashboard received children:', childrenData);
              
              // Reload children with points to get fresh data
              await loadChildren();
            }} />
          </div>

          {/* Pending Approvals Section */}
          {activeTasks?.filter(t => t.completed && !t.approved).length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-white"></i>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                      <p className="text-sm text-gray-600">Tasks completed by children awaiting your review</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-bold">
                    {activeTasks?.filter(t => t.completed && !t.approved).length} waiting
                  </span>
                </div>

                <div className="space-y-4">
                  {activeTasks?.filter(t => t.completed && !t.approved).map((task) => {
                    const childName = familyChildren.find(c => c.id === task.assigned_to)?.name || 'Unknown';
                    return (
                      <div key={task.id} className="p-5 bg-white rounded-xl border-2 border-amber-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <i className="fas fa-check text-green-600"></i>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">{task.title}</h3>
                                <p className="text-sm text-gray-600">
                                  Completed by <span className="font-semibold text-amber-700">{childName}</span>
                                  {task.completed_at && (
                                    <span className="ml-2">• {new Date(task.completed_at).toLocaleDateString()}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-gray-600 text-sm mt-2 ml-11">{task.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-3 ml-4">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                              <i className="fas fa-star text-amber-500"></i>
                              {task.points}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveTask(task.id)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                title="Approve and award points"
                              >
                                <i className="fas fa-check mr-2"></i>
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectTask(task.id)}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                title="Reject and send back"
                              >
                                <i className="fas fa-times mr-2"></i>
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Help Requests Section */}
          {activeTasks?.filter(t => t.help_requested && !t.completed).length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-hand-paper text-white"></i>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Help Requests</h2>
                      <p className="text-sm text-gray-600">Children need assistance with these tasks</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-bold">
                    {activeTasks?.filter(t => t.help_requested && !t.completed).length} requests
                  </span>
                </div>

                <div className="space-y-4">
                  {activeTasks?.filter(t => t.help_requested && !t.completed).map((task) => {
                    const childName = familyChildren.find(c => c.id === task.assigned_to)?.name || 'Unknown';
                    return (
                      <div key={task.id} className="p-5 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <i className="fas fa-hand-paper text-purple-600"></i>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">{task.title}</h3>
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold text-purple-700">{childName}</span> needs help
                                  {task.help_requested_at && (
                                    <span className="ml-2">• {new Date(task.help_requested_at).toLocaleDateString()}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-gray-600 text-sm mt-2 ml-11">{task.description}</p>
                            )}
                            {task.help_message && (
                              <div className="ml-11 mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Help Needed:</p>
                                <p className="text-sm text-gray-700">{task.help_message}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-3 ml-4">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                              <i className="fas fa-star text-xs"></i>
                              {task.points}
                            </span>
                            {task.category && task.category !== 'general' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">
                                {task.category}
                              </span>
                            )}
                            <button
                              onClick={() => handleResolveHelp(task.id)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm flex items-center gap-2"
                            >
                              <i className="fas fa-check"></i>
                              Mark as Resolved
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Active Tasks Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#006372]">Active Family Tasks</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {activeTasks?.filter(t => !t.completed).length} tasks
                  </span>
                </div>

                <div className="space-y-4">
                  {activeTasks?.filter(t => !t.completed).map((task) => {
                    const childName = familyChildren.find(c => c.id === task.assigned_to)?.name || task.assignedTo;
                    return (
                    <div key={task.id} className="p-4 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Assigned to: <span className="font-medium">{childName}</span>
                            {task.due_date && (
                              <> • Due: <span className="font-medium">{new Date(task.due_date).toLocaleDateString()}</span></>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                            <i className="fas fa-star text-amber-500"></i>
                            {task.points}
                          </span>
                          {task.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                                title="Delete task"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-3">{task.description}</p>
                      )}
                    </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-800 mb-3">Add New Task</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Task name"
                      className="p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
                    />
                    <input
                      type="number"
                      value={newTaskPoints}
                      onChange={(e) => setNewTaskPoints(e.target.value)}
                      placeholder="Points"
                      className="p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
                    />
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
                    >
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
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0] md:col-span-3"
                    >
                      <option value="">Select child</option>
                      {familyChildren.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Task description (optional)"
                      rows={3}
                      className="p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0] resize-none md:col-span-3"
                    />
                  </div>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskName.trim() || !newTaskAssignee}
                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Task
                  </button>
                </div>
              </div>

              {/* Children Progress Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#006372]">Children Progress</h2>
                  <div className="text-sm text-gray-600">
                    <span className="text-[#00C2E0] font-medium">{familyChildren.length}</span> children
                  </div>
                </div>

                <div className="space-y-4">
                  {familyChildren.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-users text-4xl mb-3 opacity-50"></i>
                      <p>No children added yet</p>
                    </div>
                  ) : (
                    familyChildren.map((child) => {
                      const completedTasks = activeTasks?.filter(t => t.assigned_to === child.id && t.approved).length || 0;
                      return (
                        <div key={child.id} className="p-4 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00C2E0] to-[#00a8c2] flex items-center justify-center text-white font-bold text-lg">
                              {child.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{child.name}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm font-semibold flex items-center gap-1">
                                  <i className="fas fa-star text-amber-500"></i>
                                  <span className="text-amber-600">{child.total_points || 0}</span>
                                </span>
                                <span className="text-sm text-gray-600">
                                  <i className="fas fa-check-circle text-green-500 mr-1"></i>
                                  {completedTasks} completed
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">Total Progress</div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500"
                                    style={{ width: `${Math.min((completedTasks / Math.max(activeTasks?.filter(t => t.assigned_to === child.id).length || 1, 1)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-semibold text-gray-600">
                                  {activeTasks?.filter(t => t.assigned_to === child.id).length || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Bulletin Board Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#006372]">Family Bulletin</h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {bulletinMessages?.length} messages
                  </span>
                </div>

                <div className="space-y-4">
                  {bulletinMessages?.map((message) => (
                    <div key={message.id} className="p-4 bg-gradient-to-br from-purple-50/30 to-white rounded-xl border border-purple-100/50 hover:border-purple-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {message.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-gray-800">{message.message}</p>
                              <p className="text-sm text-gray-500 mt-2">{message.timestamp}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteBulletinMessage(message.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-2 p-1 hover:bg-red-50 rounded"
                              title="Delete message"
                            >
                              <i className="fas fa-trash text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <textarea
                    value={newBulletinMessage}
                    onChange={(e) => setNewBulletinMessage(e.target.value)}
                    placeholder="Post a message to the family..."
                    className="w-full p-3 border border-[#00C2E0]/30 rounded-lg focus:ring-2 focus:ring-[#00C2E0] h-20"
                  />
                  <button
                    onClick={handleAddBulletinMessage}
                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90"
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    Post Message
                  </button>
                </div>
              </div>

              {/* Reward Requests Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#006372]">Reward Requests</h2>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    {rewardRequests?.filter(r => r.status === "pending").length} pending
                  </span>
                </div>

                <div className="space-y-4">
                  {rewardRequests?.map((request) => (
                    <div key={request.id} className="p-4 bg-gradient-to-br from-amber-50/30 to-white rounded-xl border border-amber-100/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{request.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested by: <span className="font-medium">{request.requester}</span> • 
                            Points: <span className="font-medium">{request.points}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleRewardRequest(request.id, "approved")}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRewardRequest(request.id, "rejected")}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === "approved" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









