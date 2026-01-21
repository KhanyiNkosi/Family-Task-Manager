"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Define interfaces
interface BulletinMessage {
  id: number;
  avatar: string;
  message: string;
  timestamp: string;
}

interface Task {
  id: number;
  name: string;
  points: number;
  assignedTo: string;
}

interface PendingTask {
  id: number;
  title: string;
  assignedTo: string;
  points: number;
  dueDate: string;
  status: "pending" | "approved";
  description: string;
}

interface RewardRequest {
  id: string;
  child: string;
  name: string;
  requester: string;
  points: number;
}

export default function ParentDashboardPage() {
  const [tasksCompleted, setTasksCompleted] = useState(3);
  const [tasksPending, setTasksPending] = useState(1);
  const [totalPoints, setTotalPoints] = useState(212);
  const [requests, setRequests] = useState<RewardRequest[]>([
    { id: "req-1", child: "C", name: "Video Game Hour", requester: "Child", points: 50 }
  ]);
  
  // FIXED: Added timestamp property
  const [bulletinMessages, setBulletinMessages] = useState<BulletinMessage[]>([
    { id: 1, avatar: "C", message: "Can we get pizza for movie night? 🍕", timestamp: "2:30 PM" },
    { id: 2, avatar: "M", message: "Family movie night this Friday!", timestamp: "1:45 PM" }
  ]);
  
  const [activeTasks, setActiveTasks] = useState<Task[]>([
    { id: 1, name: "Homework", points: 10, assignedTo: "Alex" },
    { id: 2, name: "Clean Room", points: 15, assignedTo: "Sarah" }
  ]);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPoints, setNewTaskPoints] = useState("");
  const [newBulletinMessage, setNewBulletinMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // TASK APPROVAL STATE
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([
    {
      id: 1,
      title: "Complete Science Project",
      assignedTo: "Alex",
      points: 25,
      dueDate: "Tomorrow",
      status: "pending",
      description: "Finish the solar system model for science class"
    },
    {
      id: 2,
      title: "Practice Piano",
      assignedTo: "Sarah",
      points: 15,
      dueDate: "Today",
      status: "pending",
      description: "30 minutes of piano practice"
    }
  ]);

  const pathname = usePathname();
  const router = useRouter();

  // FIXED: Permission check with proper hydration handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole');
      setUserRole(role);
      
      console.log('Parent Dashboard - User role:', role);

      // Only allow parent access
      if (role !== 'parent') {
        console.warn('Access denied to parent dashboard. User role:', role);

        // Redirect based on role
        if (role === 'child') {
          router.push('/child-dashboard');
        } else {
          router.push('/login');
        }
        return;
      }

      console.log('Parent access granted to dashboard');
      setIsLoading(false);
    }
  }, [router]);

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/parent-dashboard", icon: "fas fa-chart-bar", label: "Dashboard", active: true },
    { href: "/child-dashboard", icon: "fas fa-child", label: "Child View" },
    { href: '/ai-tasks', icon: 'fas fa-robot', label: 'AI Tasks' },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
    { href: "/parent-profile", icon: "fas fa-user", label: "Profile" },
  ];

  // Task approval functions
  const handleApproveTask = (taskId: number) => {
    setPendingTasks(pendingTasks.map(task =>
      task.id === taskId ? { ...task, status: "approved" } : task
    ));
    setTimeout(() => {
      setPendingTasks(pendingTasks.filter(task => task.id !== taskId));
      setTotalPoints(prev => prev + (pendingTasks.find(t => t.id === taskId)?.points || 0));
      alert("Task approved! Points awarded.");
    }, 300);
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setPendingTasks(pendingTasks.filter(task => task.id !== taskId));
      alert("Task deleted.");
    }
  };

  const postBulletin = () => {
    if (!newBulletinMessage.trim()) return;

    const newMessage: BulletinMessage = {
      id: bulletinMessages.length + 1,
      avatar: "P", // Parent
      message: newBulletinMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBulletinMessages([...bulletinMessages, newMessage]);
    setNewBulletinMessage("");
  };

  const saveNewTask = () => {
    if (!newTaskName.trim() || !newTaskPoints.trim()) return;

    const newTask: Task = {
      id: activeTasks.length + 1,
      name: newTaskName,
      points: parseInt(newTaskPoints),
      assignedTo: "Unassigned"
    };

    setActiveTasks([...activeTasks, newTask]);
    setTasksPending(prev => prev + 1);
    setNewTaskName("");
    setNewTaskPoints("");
    setShowTaskModal(false);
    alert(`Task "${newTaskName}" created for ${newTaskPoints} points!`);
  };

  const approveRequest = (requestId: string) => {
    const request = requests.find(req => req.id === requestId);
    if (request) {
      setTotalPoints(prev => prev - request.points);
      setRequests(requests.filter(req => req.id !== requestId));
      alert(`Approved "${request.name}"! ${request.points} points deducted.`);
    }
  };

  const rejectRequest = (requestId: string) => {
    setRequests(requests.filter(req => req.id !== requestId));
    alert("Request rejected.");
  };

  const markTaskComplete = (taskId: number) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (task) {
      setTotalPoints(prev => prev + task.points);
      setTasksCompleted(prev => prev + 1);
      setTasksPending(prev => prev - 1);
      setActiveTasks(activeTasks.filter(t => t.id !== taskId));
      
      // Add to pending tasks for approval
      const pendingTask: PendingTask = {
        id: Date.now(),
        title: task.name,
        assignedTo: task.assignedTo,
        points: task.points,
        dueDate: "Now",
        status: "pending",
        description: `Completed: ${task.name}`
      };
      
      setPendingTasks(prev => [...prev, pendingTask]);
      alert(`Task "${task.name}" marked complete! Awaiting approval for ${task.points} points.`);
    }
  };

  // Load pending AI tasks from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingAITasks = JSON.parse(localStorage.getItem('pendingAITasks') || '[]');
      console.log('Loaded AI tasks:', pendingAITasks);

      if (pendingAITasks.length > 0) {
        setPendingTasks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = pendingAITasks.filter((task: any) => !existingIds.has(task.id));

          if (newTasks.length > 0) {
            console.log('Adding new AI tasks:', newTasks);
            return [...prev, ...newTasks];
          }
          return prev;
        });
        
        // Clear after loading
        localStorage.removeItem('pendingAITasks');
      }
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
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

        {/* Sidebar Footer */}
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
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                sessionStorage.removeItem('userRole');
                sessionStorage.removeItem('userEmail');
                sessionStorage.removeItem('userName');
                router.push('/login');
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-100 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-400/30"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#006372]">Parent Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your family tasks and rewards</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Role: {userRole || 'Not set'}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {pendingTasks.length} tasks pending approval
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg">
              <div className="text-sm font-medium">Family Points</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <i className="fas fa-star text-yellow-300"></i> {totalPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Tasks Completed</div>
                <div className="text-3xl font-bold text-green-600 mt-1">{tasksCompleted}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-green-500 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Tasks Pending</div>
                <div className="text-3xl font-bold text-amber-600 mt-1">{tasksPending}</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-amber-500 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Active Tasks</div>
                <div className="text-3xl font-bold text-cyan-600 mt-1">{activeTasks.length}</div>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-tasks text-cyan-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Task Approval Section */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-tasks text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Task Approvals</h2>
                <p className="text-gray-600 text-sm">Review and approve completed tasks</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-semibold">
              {pendingTasks.length} pending
            </div>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingTasks.map((task) => (
                <div key={task.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          task.assignedTo === "Alex" ? "bg-blue-100" : "bg-pink-100"
                        }`}>
                          <span className="text-xl">{task.assignedTo.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-lg">{task.assignedTo}</div>
                          <div className="text-sm text-gray-600">Completed task</div>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xl mb-2">{task.title}</h3>
                      <p className="text-gray-600 mb-4">{task.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-star text-yellow-500"></i>
                            <span className="font-bold text-gray-800">{task.points} points</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Due: <span className="font-medium">{task.dueDate}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            className="w-12 h-12 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center justify-center shadow-lg"
                            title="Approve Task"
                          >
                            <i className="fas fa-check text-xl"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-12 h-12 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center justify-center shadow-lg"
                            title="Delete Task"
                          >
                            <i className="fas fa-trash text-xl"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-500 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Pending Tasks</h3>
              <p className="text-gray-600">All tasks have been reviewed and approved.</p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Active Tasks & Create Task */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Active Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Create Task
              </button>
            </div>

            <div className="space-y-4">
              {activeTasks.map(task => (
                <div key={task.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-tasks text-cyan-600"></i>
                    </div>
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-star text-yellow-500"></i> {task.points} points
                        </span>
                        <span>•</span>
                        <span>Assigned to: {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => markTaskComplete(task.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <i className="fas fa-check"></i> Mark Complete
                  </button>
                </div>
              ))}
            </div>

            {/* Bulletin Board */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-bullhorn text-purple-500"></i> Family Bulletin
              </h3>
              <div className="space-y-4 mb-4">
                {bulletinMessages.map(msg => (
                  <div key={msg.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center font-bold">
                        {msg.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{msg.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBulletinMessage}
                  onChange={(e) => setNewBulletinMessage(e.target.value)}
                  placeholder="Post a message to the family..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onKeyPress={(e) => e.key === 'Enter' && postBulletin()}
                />
                <button
                  onClick={postBulletin}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Right column - Reward Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Reward Requests</h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {requests.length} pending
              </span>
            </div>

            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                          <i className="fas fa-gift text-cyan-600 text-xl"></i>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{req.name}</div>
                          <p className="text-gray-600 text-sm mt-1">Requested by {req.requester}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-star text-yellow-500"></i>
                              <span className="font-bold">{req.points} points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-check-circle text-green-500 text-2xl"></i>
                </div>
                <p className="text-gray-600">No pending reward requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Task</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Task Name</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="e.g., Clean room, Homework"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Points Value</label>
                  <input
                    type="number"
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="e.g., 10, 25, 50"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={saveNewTask}
                  className="flex-1 bg-cyan-500 text-white py-3 rounded-lg font-bold hover:bg-cyan-600 transition"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
