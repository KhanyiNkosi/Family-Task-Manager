"use client";

import { useState, useEffect } from "react";
import NotificationAlert from '@/components/NotificationAlert';
import { useNotifications } from '@/hooks/useNotifications';
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
  approved?: boolean;
  description?: string;
  created_at?: string;
  completed_at?: string;
  help_requested?: boolean;
  help_requested_at?: string | null;
  help_message?: string | null;
  category?: string;
  photo_url?: string | null;
  photo_uploaded_at?: string | null;
}

interface Child {
  id: number;
  name: string;
  points: number;
  avatar: string;
  tasksCompleted: number;
}

interface BulletinMessage {
  id: string | number;
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

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  family_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
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
  user?: { id: string; full_name: string };
}

export default function ParentDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [parentProfileImage, setParentProfileImage] = useState("");
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use the notifications hook for real-time notifications
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissNotification 
  } = useNotifications();

  
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
    // AI features temporarily disabled - coming soon with full implementation
    // { href: "/ai-tasks", icon: "fas fa-robot", label: "AI Tasks" },
    // { href: "/ai-suggester", icon: "fas fa-brain", label: "AI Suggester" },
    { href: "/rewards-store", icon: "fas fa-trophy", label: "Rewards Store" },
    { href: "/parent-profile", icon: "fas fa-user", label: "Profile" },
    { href: "/activity-feed", icon: "fas fa-newspaper", label: "Activity Feed" },
    { href: "/achievements", icon: "fas fa-medal", label: "Achievements" },
  ];

  // State for tasks
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);

  // State for children
  const [children, setChildren] = useState<Child[]>([]);
  const [familyChildren, setFamilyChildren] = useState<{ id: string; name: string; total_points?: number }[]>([]);

  // State for bulletin messages
  const [bulletinMessages, setBulletinMessages] = useState<BulletinMessage[]>([]);

  // State for reward redemptions
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);

  // New task form state
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPoints, setNewTaskPoints] = useState("10");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newBulletinMessage, setNewBulletinMessage] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("general");

  // Task filter and sort state
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all");
  const [taskSortBy, setTaskSortBy] = useState<"date" | "points" | "name">("date");

  // Loading state to prevent concurrent calls
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal states
  const [alertModal, setAlertModal] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" | "warning" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: () => {} });

  // Permission check for child modifications
  const canModifyChild = false;
  const canViewChild = true;

  // Modal helpers
  const showAlert = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
          resolve(true);
        }
      });
      // Attach cancel handler
      const cancelHandler = () => {
        setConfirmModal({ show: false, message: "", onConfirm: () => {} });
        resolve(false);
      };
      // Wait for DOM to render modal, then attach cancel handler
      setTimeout(() => {
        const cancelBtn = document.querySelector('.confirm-modal-cancel');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', cancelHandler, { once: true });
        }
      }, 0);
    });
  };

  const handleChildAction = (action: string) => {
    if (!canModifyChild) {
      return;
    }
  };

  // Load tasks from database
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isLoadingData) return;
      setIsLoadingData(true);
      
      try {
        if (isMounted) {
          await Promise.all([
            loadUserName(),
            loadTasks(),
            loadChildren(),
            loadRedemptions(),
            loadBulletinMessages()
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const supabase = createClientSupabaseClient();

    // Subscribe to task changes
    const tasksSubscription = supabase
      .channel('parent-tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task change detected:', payload);
          console.log('Event type:', payload.eventType);
          
          // Note: Notifications are handled by database triggers and useNotifications hook
          // No need to manually create notifications here
          
          // Reload tasks
          loadTasks();
        }
      )
      .subscribe();

    // Subscribe to reward redemption changes
    const redemptionsSubscription = supabase
      .channel('parent-redemptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reward_redemptions' },
        (payload) => {
          console.log('Redemption change detected:', payload);
          console.log('Event type:', payload.eventType);
          // Always reload redemptions after any event to ensure UI is in sync
          loadRedemptions();
        }
      )
      .subscribe();

    // Subscribe to bulletin message changes
    const bulletinSubscription = supabase
      .channel('parent-bulletin-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bulletin_messages' },
        (payload) => {
          console.log('Bulletin message change detected:', payload);
          
          // Show notification for new bulletin messages (from notification system)
          // Note: The database trigger handles creating notifications for family members
          
          // Reload bulletin messages
          loadBulletinMessages();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(redemptionsSubscription);
      supabase.removeChannel(bulletinSubscription);
    };
  }, []); // Remove isLoadingData dependency to prevent subscription recreation

  const loadRedemptions = async () => {
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

      // First, get all family member IDs
      const { data: familyMembers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('family_id', profile.family_id);

      if (!familyMembers || familyMembers.length === 0) return;

      const familyMemberIds = familyMembers.map(m => m.id);

      // Only query reward_redemptions by user_id (not family_id)
      const { data: redemptionsData, error } = await supabase
        .from('reward_redemptions')
        .select('*')
        .in('user_id', familyMemberIds)
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Error loading redemptions:', error);
        return;
      }

      // Load rewards separately
      if (redemptionsData && redemptionsData.length > 0) {
        const rewardIds = [...new Set(redemptionsData.map(r => r.reward_id))];
        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('*')
          .in('id', rewardIds);

        // Manually join the data
        const enrichedRedemptions = redemptionsData.map(redemption => ({
          ...redemption,
          reward: rewardsData?.find(r => r.id === redemption.reward_id),
          user: familyMembers.find(m => m.id === redemption.user_id)
        }));

        setRedemptions(enrichedRedemptions);
        console.log('Redemptions loaded:', enrichedRedemptions);
      } else {
        setRedemptions([]);
      }
    } catch (error: any) {
      // Ignore AbortError - it's expected during cleanup/re-renders
      if (error?.name === 'AbortError') return;
      console.error('Error in loadRedemptions:', error);
    }
  };

  const loadBulletinMessages = async () => {
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

      // Load bulletin messages for the family
      const { data: messagesData, error } = await supabase
        .from('bulletin_messages')
        .select('*, poster:profiles!posted_by(full_name)')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bulletin messages:', error);
        // If table doesn't exist yet, just set empty array
        if (error.code === '42P01') {
          setBulletinMessages([]);
        }
        return;
      }

      // Transform database messages to UI format
      const transformedMessages = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        avatar: msg.poster?.full_name?.charAt(0).toUpperCase() || 'U',
        message: msg.message,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          month: 'short',
          day: 'numeric'
        })
      }));

      setBulletinMessages(transformedMessages);
      console.log('Bulletin messages loaded:', transformedMessages.length);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error in loadBulletinMessages:', error);
    }
  };

  const loadUserName = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

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
        // For each profile, check if they're a child and calculate their points
        const childrenWithPoints = [];
        
        for (const familyMember of familyProfiles) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', familyMember.id)
            .single();
          
          // Only include children
          if (userProfile?.role === 'child') {
            // Calculate points from approved tasks
            const { data: approvedTasks } = await supabase
              .from('tasks')
              .select('points')
              .eq('assigned_to', familyMember.id)
              .eq('approved', true);
            
            const earnedPoints = approvedTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;
            
            // Calculate points spent on APPROVED redemptions only
            const { data: redemptions } = await supabase
              .from('reward_redemptions')
              .select('points_spent')
              .eq('user_id', familyMember.id)
              .eq('status', 'approved');
            
            const spentPoints = redemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
            
            const currentPoints = earnedPoints - spentPoints;
            
            console.log(`[Points Calc] ${familyMember.full_name}:`, {
              earnedPoints,
              spentPoints,
              currentPoints,
              approvedTasksCount: approvedTasks?.length || 0
            });
            
            childrenWithPoints.push({
              id: familyMember.id,
              name: familyMember.full_name,
              total_points: currentPoints
            });
          }
        }
        
        console.log('[loadChildren] Setting familyChildren state:', childrenWithPoints);
        setFamilyChildren(childrenWithPoints);
        console.log('Children loaded with points:', childrenWithPoints);
      }
    } catch (error: any) {
      // Ignore AbortError - it's expected during cleanup/re-renders
      if (error?.name === 'AbortError') return;
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

      // Load all tasks for this family, with status filter if needed
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (taskStatusFilter === 'pending') {
        // Pending: not completed and not approved
        query = query.eq('completed', false).eq('approved', false);
      } else if (taskStatusFilter === 'completed') {
        // Completed view: show only completed but not yet approved
        query = query.eq('completed', true).eq('approved', false);
      } else {
        // "all" filter: exclude approved tasks (they're done and archived)
        query = query.eq('approved', false);
      }

      const { data: tasks, error } = await query;

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      if (tasks) {
        const formattedTasks: Task[] = tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignedTo: task.assigned_to,
          assigned_to: task.assigned_to,
          points: task.points,
          status: (task.approved ? 'approved' : task.completed ? 'completed' : 'pending') as "pending" | "completed" | "approved",
          completed: task.completed,
          approved: task.approved || false,
          dueDate: task.due_date,
          due_date: task.due_date,
          created_at: task.created_at,
          completed_at: task.completed_at,
          help_requested: task.help_requested || false,
          help_requested_at: task.help_requested_at,
          help_message: task.help_message,
          category: task.category,
          photo_url: task.photo_url,
          photo_uploaded_at: task.photo_uploaded_at
        }));
        setActiveTasks(formattedTasks);
      }
    } catch (error: any) {
      // Ignore AbortError - it's expected during cleanup/re-renders
      if (error?.name === 'AbortError') return;
      console.error('Error in loadTasks:', error);
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = [...activeTasks];

    // Apply status filter
    if (taskStatusFilter === "pending") {
      filtered = filtered.filter(t => t.status === "pending" || (!t.completed && !t.approved));
    } else if (taskStatusFilter === "completed") {
      filtered = filtered.filter(t => t.status === "completed" || t.status === "approved" || t.completed || t.approved);
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

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskAssignee) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to create tasks', "error");
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
        showAlert('Failed to create task: ' + error.message, "error");
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
      showAlert("New task added successfully!", "success");
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      showAlert('Failed to create task', "error");
    }
  };

  // Complete task
  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = activeTasks?.map(task =>
      task.id === taskId ? { ...task, status: "completed" as const } : task
    );
    setActiveTasks(updatedTasks);
    showAlert("Task marked as completed!", "success");
  };

  // Approve task completion
  const handleApproveTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Get the task to find points and assigned user
      const task = activeTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        showAlert('Task not found', "error");
        return;
      }

      console.log('Approving task:', { taskId, assignedTo: task.assigned_to, points: task.points });

      // Update task - set approved to true (and ensure completed is true)
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          completed: true, 
          approved: true 
        })
        .eq('id', taskId);

      if (taskError) {
        console.error('Error approving task:', taskError);
        showAlert(`Failed to approve task: ${taskError.message}`, "error");
        return;
      }

      console.log('Task approved successfully!');

      // Remove task from UI immediately - it's now completed and approved
      setActiveTasks(activeTasks.filter(t => t.id !== taskId));
      
      // Points are calculated dynamically from approved tasks in database
      // Reload children data to reflect updated points
      await loadChildren();
      
      showAlert(`Task approved! ${task.points} points awarded to child!`, "success");
    } catch (error) {
      console.error('Error in handleApproveTask:', error);
      showAlert(`Failed to approve task: ${(error as any).message}`, "error");
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
        showAlert('Failed to reject task', "error");
        return;
      }

      // Update local state
      setActiveTasks(activeTasks.map(task =>
        task.id === taskId ? { ...task, status: 'pending', completed: false, completed_at: undefined } : task
      ));
      
      showAlert('Task rejected and sent back to child', "success");
    } catch (error) {
      console.error('Error in handleRejectTask:', error);
      showAlert('Failed to reject task', "error");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Check if task is completed/approved first
      const { data: task } = await supabase
        .from('tasks')
        .select('approved, completed, task_name, points, assigned_to')
        .eq('id', taskId)
        .single();
      
      // If task is completed OR approved, don't delete - just hide from UI
      if (task?.completed || task?.approved) {
        const confirmed = await showConfirm(
          `This task has been completed and points (${task.points}) have been earned. \n\nRemoving it will hide it from your view but the child's points will NOT be affected. Continue?`
        );
        
        if (!confirmed) return;
        
        // Simply remove from UI without deleting from database
        // Points calculation only counts tasks in database, so points remain
        setActiveTasks(activeTasks.filter(t => t.id !== taskId));
        showAlert('Task hidden - points remain in balance', "success");
        
        // Reload children to confirm points unchanged
        loadChildren();
        return;
      }
      
      // For non-completed tasks, proceed with normal deletion
      const confirmed = await showConfirm("Are you sure you want to delete this task?");
      if (!confirmed) return;
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        showAlert('Failed to delete task', "error");
        return;
      }

      setActiveTasks(activeTasks.filter(task => task.id !== taskId));
      showAlert('Task deleted successfully', "success");
    } catch (error) {
      console.error('Error in handleDeleteTask:', error);
      showAlert('Failed to delete task', "error");
    }
  };

  // Resolve help request
  const handleResolveHelp = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      console.log('Resolving help request for task:', taskId);
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          help_requested: false,
          help_requested_at: null,
          help_message: null
        })
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('Error resolving help request:', error);
        showAlert(`Failed to resolve help request: ${error.message}`, "error");
        return;
      }

      console.log('Help request resolved successfully:', data);

      // Update local state
      setActiveTasks(activeTasks.map(task =>
        task.id === taskId ? { ...task, help_requested: false, help_requested_at: null, help_message: null } : task
      ));
      
      showAlert('Help request resolved!', "success");
    } catch (error) {
      console.error('Error in handleResolveHelp:', error);
      showAlert(`Failed to resolve help request: ${(error as any).message}`, "error");
    }
  };

  // Create a new reward
  // Add bulletin message
  const handleAddBulletinMessage = async () => {
    if (!newBulletinMessage.trim()) return;

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to post a message', "error");
        return;
      }

      // Get user's family_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Family ID not found', "error");
        return;
      }

      // Insert bulletin message to database
      const { data, error } = await supabase
        .from('bulletin_messages')
        .insert({
          family_id: profile.family_id,
          posted_by: user.id,
          message: newBulletinMessage.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bulletin message:', error);
        showAlert('Failed to post message. Please try again.', "error");
        return;
      }

      // Clear input
      setNewBulletinMessage("");
      
      // Reload bulletin messages to show the new one
      await loadBulletinMessages();
      
      console.log('Bulletin message posted successfully');
    } catch (error: any) {
      console.error('Error in handleAddBulletinMessage:', error);
      showAlert(`Failed to post message: ${error.message}`, "error");
    }
  };

  // Delete bulletin message
  const handleDeleteBulletinMessage = async (messageId: string | number) => {
    const confirmed = await showConfirm("Are you sure you want to delete this message?");
    if (!confirmed) return;

    try {
      const supabase = createClientSupabaseClient();
      
      // Delete from database
      const { error } = await supabase
        .from('bulletin_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting bulletin message:', error);
        showAlert('Failed to delete message. Please try again.', "error");
        return;
      }

      // Reload bulletin messages to reflect the deletion
      await loadBulletinMessages();
      
      console.log('Bulletin message deleted successfully');
    } catch (error: any) {
      console.error('Error in handleDeleteBulletinMessage:', error);
      showAlert(`Failed to delete message: ${error.message}`, "error");
    }
  };

  // Handle reward redemption approval
  const handleApproveRedemption = async (redemptionId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption) return;

      // Update redemption status to approved
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', redemptionId);

      if (redemptionError) {
        console.error('Error approving redemption:', redemptionError);
        showAlert('Failed to approve redemption', "error");
        return;
      }

      // Points are calculated dynamically from approved tasks minus redemptions
      // No need to manually deduct points - they'll be reflected automatically
      
      // Update local state
      setRedemptions(redemptions.map(r =>
        r.id === redemptionId ? { ...r, status: 'approved', approved_at: new Date().toISOString(), approved_by: user.id } : r
      ));
      
      // Reload children to update their points (recalculates from tasks/redemptions)
      await loadChildren();
      
      showAlert(`Redemption approved! ${redemption.points_spent} points deducted from child.`, "success");
    } catch (error) {
      console.error('Error in handleApproveRedemption:', error);
      showAlert('Failed to approve redemption', "error");
    }
  };

  const handleRejectRedemption = async (redemptionId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption) return;

      // Update redemption status to rejected
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', redemptionId);

      if (error) {
        console.error('Error rejecting redemption:', error);
        showAlert('Failed to reject redemption', "error");
        return;
      }

      // Update local state
      setRedemptions(redemptions.map(r =>
        r.id === redemptionId ? { ...r, status: 'rejected', approved_at: new Date().toISOString(), approved_by: user.id } : r
      ));
      
      showAlert('Redemption rejected.', "success");
    } catch (error) {
      console.error('Error in handleRejectRedemption:', error);
      showAlert('Failed to reject redemption', "error");
    }
  };

  const handleDeleteRedemption = async (redemptionId: string) => {
    try {
      console.log('Attempting to delete redemption:', redemptionId);
      const confirmed = await showConfirm('Are you sure you want to delete this redemption? This action cannot be undone.');
      if (!confirmed) {
        console.log('Delete redemption cancelled by user.');
        return;
      }

      const supabase = createClientSupabaseClient();

      // Delete the redemption
      const { error } = await supabase
        .from('reward_redemptions')
        .delete()
        .eq('id', redemptionId);

      if (error) {
        console.error('Error deleting redemption:', error);
        showAlert('Failed to delete redemption', "error");
        return;
      }

      console.log('Redemption deleted successfully:', redemptionId);
      // Update local state
      setRedemptions(redemptions.filter(r => r.id !== redemptionId));
      showAlert('Redemption deleted successfully.', "success");
    } catch (error) {
      console.error('Error in handleDeleteRedemption:', error);
      showAlert('Failed to delete redemption', "error");
    }
  };

  // Handle reward request (legacy - keeping for compatibility)
  const handleRewardRequest = (requestId: number, status: "approved" | "rejected") => {
    const updatedRequests = rewardRequests?.map(request =>
      request.id === requestId ? { ...request, status } : request
    );
    setRewardRequests(updatedRequests);
    showAlert(`Reward request ${status === "approved" ? "approved" : "rejected"}!`, "success");
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

  const handleLogout = async () => {
    const confirmed = await showConfirm("Are you sure you want to logout?");
    if (confirmed) {
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
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
        maxNotifications={3}
        autoClose={8000}
      />

      <div className="flex">
        {/* SIDEBAR - Hidden on mobile */}
        <aside className="sidebar hidden lg:block bg-gradient-to-b from-[#006372] to-[#004955] text-white w-64 p-6 fixed h-screen">
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
        <div className="lg:ml-64 flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Mobile Hamburger Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-64 h-full bg-gradient-to-b from-[#006372] to-[#004955] text-white p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-2xl font-extrabold">
                    <i className="fas fa-smile text-3xl"></i>
                    <span>FamilyTask</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
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
                <div className="mt-auto pt-6 border-t border-white/20 space-y-3 absolute bottom-6 left-6 right-6">
                  <button
                    onClick={() => { window.history.back(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
                  >
                    <i className="fas fa-arrow-left"></i>
                    Go Back
                  </button>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-100 rounded-xl hover:bg-red-500/30 transition-all font-medium border border-red-400/30"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Header */}
          <div className="lg:hidden mb-4 bg-gradient-to-r from-[#006372] to-[#004955] text-white px-4 py-3 rounded-xl flex items-center justify-between">
            <button onClick={() => setMobileMenuOpen(true)} className="text-2xl">
              <i className="fas fa-bars"></i>
            </button>
            <div className="flex items-center gap-3">
              <i className="fas fa-smile text-2xl"></i>
              <span className="font-bold text-lg">FamilyTask</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
          
          <header className="mb-10">\n            <div className="flex items-center justify-between">\n              <div>\n                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#006372]">\n                  {userName ? `${userName}'s Family Dashboard` : 'Family Dashboard'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Monitor your family's tasks, rewards, and activities</p>
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#006372]">Active Family Tasks</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {getFilteredAndSortedTasks().length} tasks
                  </span>
                </div>

                {/* Filter and Sort Controls */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value as "all" | "pending" | "completed")}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
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
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        <option value="general">General</option>
                        <option value="chores">Chores</option>
                        <option value="homework">Homework</option>
                        <option value="school">School</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="sport">Sport</option>
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
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                      >
                        <option value="date">Date (Newest First)</option>
                        <option value="points">Points (Highest First)</option>
                        <option value="name">Name (A-Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {getFilteredAndSortedTasks().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-tasks text-4xl text-gray-300 mb-3"></i>
                      <p>No tasks match your filters</p>
                      <p className="text-sm">Try adjusting your filters or add a new task</p>
                    </div>
                  ) : (
                    getFilteredAndSortedTasks().map((task) => {
                    const childName = familyChildren.find(c => c.id === task.assigned_to)?.name || task.assignedTo;
                    return (
                    <div key={task.id} className="p-4 bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100/50">
                      <div className="flex items-center justify-between mb-2 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-800">{task.title}</h3>
                            {task.category && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                                {task.category}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.status === 'completed' || task.status === 'approved' || task.completed || task.approved
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {task.status === 'completed' || task.status === 'approved' || task.completed || task.approved ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Assigned to: <span className="font-medium">{childName}</span>
                            {task.due_date && (
                              <> • Due: <span className="font-medium">{new Date(task.due_date).toLocaleDateString()}</span></>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                            <i className="fas fa-star text-amber-500"></i>
                            {task.points}
                          </span>
                          {(task.status === "pending" || (!task.completed && !task.approved)) && (
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 whitespace-nowrap"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                            title="Delete task"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-2">{task.description}</p>
                      )}
                      {task.photo_url && (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-camera text-blue-500"></i>
                            <span className="text-sm font-medium text-gray-700">Task Photo (Verification)</span>
                          </div>
                          <a
                            href={task.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={task.photo_url}
                              alt="Task completion photo"
                              className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const errorMsg = document.createElement('div');
                                errorMsg.className = 'p-4 bg-red-50 border border-red-200 rounded-lg text-center';
                                errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500 mb-2"></i><p class="text-sm text-red-700">Photo failed to load</p>';
                                e.currentTarget.parentElement?.appendChild(errorMsg);
                              }}
                            />
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            Click to view full size • Uploaded {task.photo_uploaded_at ? new Date(task.photo_uploaded_at).toLocaleString() : 'recently'}
                          </p>
                        </div>
                      )}
                    </div>
                    );
                  })
                  )}
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
                      <option value="sport">Sport</option>
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setFamilyChildren([]);
                        loadChildren();
                      }}
                      className="text-gray-500 hover:text-[#00C2E0] transition-colors"
                      title="Refresh points"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                    <div className="text-sm text-gray-600">
                      <span className="text-[#00C2E0] font-medium">{familyChildren.length}</span> children
                    </div>
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

              {/* Reward Redemptions Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#006372]">Reward Redemptions</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadRedemptions}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                      title="Refresh redemptions"
                    >
                      <i className="fas fa-refresh mr-1"></i>
                      Refresh
                    </button>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      {redemptions?.filter(r => r.status === "pending").length} pending
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {redemptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-gift text-4xl text-gray-300 mb-3"></i>
                      <p>No redemption requests yet</p>
                      <p className="text-sm">Children can redeem rewards from their dashboard</p>
                    </div>
                  ) : (
                    redemptions.map((redemption) => {
                      const childName = redemption.user?.full_name || 'Unknown';
                      const rewardTitle = redemption.reward?.title || 'Unknown Reward';
                      
                      return (
                        <div key={redemption.id} className={`p-4 rounded-xl border shadow-sm ${
                          redemption.status === 'pending' 
                            ? 'bg-gradient-to-br from-amber-50/30 to-white border-amber-100/50'
                            : redemption.status === 'approved'
                            ? 'bg-gradient-to-br from-green-50/30 to-white border-green-100/50'
                            : 'bg-gradient-to-br from-red-50/30 to-white border-red-100/50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{rewardTitle}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Requested by: <span className="font-medium text-amber-700">{childName}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1">
                                  <i className="fas fa-star text-amber-500"></i>
                                  {redemption.points_spent}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(redemption.redeemed_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {redemption.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => handleApproveRedemption(redemption.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                                    title="Approve and deduct points"
                                  >
                                    <i className="fas fa-check mr-1"></i>
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectRedemption(redemption.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                                    title="Reject request"
                                  >
                                    <i className="fas fa-times mr-1"></i>
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                                    redemption.status === "approved" 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-red-100 text-red-700"
                                  }`}>
                                    {redemption.status === "approved" ? (
                                      <><i className="fas fa-check-circle"></i> Approved</>
                                    ) : (
                                      <><i className="fas fa-times-circle"></i> Rejected</>
                                    )}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteRedemption(redemption.id)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-red-100 hover:text-red-700 transition-colors"
                                    title="Delete this redemption"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 rounded-t-2xl ${
              alertModal.type === "error" ? "bg-red-50" :
              alertModal.type === "success" ? "bg-green-50" :
              alertModal.type === "warning" ? "bg-yellow-50" :
              "bg-blue-50"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`text-3xl ${
                  alertModal.type === "error" ? "text-red-500" :
                  alertModal.type === "success" ? "text-green-500" :
                  alertModal.type === "warning" ? "text-yellow-500" :
                  "text-blue-500"
                }`}>
                  {alertModal.type === "error" && "❌"}
                  {alertModal.type === "success" && "✅"}
                  {alertModal.type === "warning" && "⚠️"}
                  {alertModal.type === "info" && "ℹ️"}
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  {alertModal.type === "error" && "Error"}
                  {alertModal.type === "success" && "Success"}
                  {alertModal.type === "warning" && "Warning"}
                  {alertModal.type === "info" && "Notice"}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6 whitespace-pre-line">{alertModal.message}</p>
              <button
                onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
                className={`w-full py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all ${
                  alertModal.type === "error" ? "bg-red-500" :
                  alertModal.type === "success" ? "bg-green-500" :
                  alertModal.type === "warning" ? "bg-yellow-500" :
                  "bg-blue-500"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="text-3xl">❓</div>
                <h3 className="text-lg font-bold">Confirm Action</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="confirm-modal-cancel flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmModal({ show: false, message: '', onConfirm: () => {} });
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#006372] to-[#00C2E0] hover:opacity-90 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






