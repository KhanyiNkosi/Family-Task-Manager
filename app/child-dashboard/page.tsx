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

interface BulletinMessage {
  id: string;
  message: string;
  posted_by: string;
  poster_name: string;
  created_at: string;
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
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [bulletinMessages, setBulletinMessages] = useState<BulletinMessage[]>([]);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [pepTalkModal, setPepTalkModal] = useState({ show: false, message: "", emoji: "" });
  const [taskHelperModal, setTaskHelperModal] = useState({ show: false, task: null as Task | null, messages: [] as { text: string, sender: 'user' | 'ai' }[] });
  const [helperInput, setHelperInput] = useState("");
  const [alertModal, setAlertModal] = useState({ show: false, message: "", type: "info" as "info" | "success" | "error" | "warning" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: () => {} });
  const [promptModal, setPromptModal] = useState({ show: false, message: "", defaultValue: "", onConfirm: (value: string) => {} });

  // Task filter and sort state
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>("all");
  const [taskSortBy, setTaskSortBy] = useState<"date" | "points" | "name">("date");

  // === MODAL HELPERS ===
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
    });
  };

  const showPrompt = (message: string, defaultValue: string = ""): Promise<string | null> => {
    return new Promise((resolve) => {
      let inputValue = defaultValue;
      setPromptModal({
        show: true,
        message,
        defaultValue,
        onConfirm: (value) => {
          setPromptModal({ show: false, message: "", defaultValue: "", onConfirm: () => {} });
          resolve(value || null);
        }
      });
    });
  };

  // === CHILD-ONLY PERMISSION SYSTEM ===

  // Load bulletin messages function (can be called from subscription)
  const loadBulletinMessages = async () => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) return;

      const { data: bulletinData, error: bulletinError } = await supabase
        .from('bulletin_messages')
        .select('*, poster:profiles!posted_by(full_name)')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (bulletinError) {
        console.error('Error loading bulletin messages:', bulletinError);
        if (bulletinError.code === '42P01') {
          setBulletinMessages([]);
        }
        return;
      }

      if (bulletinData) {
        const transformedBulletin = bulletinData.map((msg: any) => ({
          id: msg.id,
          message: msg.message,
          posted_by: msg.posted_by,
          poster_name: msg.poster?.full_name || 'Family Member',
          created_at: msg.created_at
        }));
        setBulletinMessages(transformedBulletin);
        console.log('Bulletin messages loaded:', transformedBulletin.length);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error in loadBulletinMessages:', error);
    }
  };

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
        
        // Ensure user has a profile entry (needed for reminder feature)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id, family_id')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile && profileCheckError) {
          console.log('No profile found, creating one for reminder feature...');
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.name || 'Child User',
              role: 'child',
              family_id: crypto.randomUUID()
            });
          
          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('✅ Profile created successfully');
          }
        }
        
        // Fetch child's assigned tasks (exclude approved tasks)
        const { data: childTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .or('approved.is.null,approved.eq.false')
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else if (childTasks) {
          console.log('Loaded tasks:', childTasks.length, 'tasks found');
          console.log('Task data:', childTasks);
          // CRITICAL: Filter out approved tasks before setting state
          const unapprovedTasks = childTasks.filter(task => !task.approved);
          console.log('After filtering approved:', unapprovedTasks.length, 'tasks remaining');
          setTasks(unapprovedTasks);
        } else {
          console.log('No tasks data returned (null/undefined)');
        }
        
        // Load available rewards for the family
        const { data: profile } = await supabase
          .from('profiles')
          .select('family_id, full_name')
          .eq('id', user.id)
          .single();

        console.log('User profile:', profile);
        
        // Set user name
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }

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

          // Load bulletin messages for the family
          await loadBulletinMessages();
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
          console.log('Event type:', payload.eventType);
          
          // Check if this task is assigned to current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && (payload.new?.assigned_to === user.id || payload.old?.assigned_to === user.id)) {
              // Handle DELETE event
              if (payload.eventType === 'DELETE') {
                console.log('Task deleted, removing from child view:', payload.old.id);
                setTasks(prevTasks => prevTasks.filter(task => task.id !== payload.old.id));
                return;
              }
              
              // Show notification for INSERT
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
              
              // Reload tasks and points for INSERT/UPDATE
              const fetchUpdatedData = async () => {
                const { data: childTasks } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('assigned_to', user.id)
                  .or('approved.is.null,approved.eq.false')
                  .order('created_at', { ascending: false });
                
                if (childTasks) {
                  console.log('Real-time: Loaded', childTasks.length, 'tasks');
                  // CRITICAL: Filter out approved tasks before setting state
                  const unapprovedTasks = childTasks.filter(task => !task.approved);
                  console.log('Real-time: After filtering approved:', unapprovedTasks.length, 'tasks');
                  setTasks(unapprovedTasks);
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

    // Subscribe to bulletin message changes
    const bulletinSubscription = supabase
      .channel('child-bulletin-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bulletin_messages' },
        (payload) => {
          console.log('Bulletin message change detected:', payload);
          console.log('Event type:', payload.eventType);
          
          // Reload bulletin messages when any change occurs (INSERT, UPDATE, DELETE)
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
      showAlert("Access Denied! This section is for parents only.", "error");
      router.push("/child-dashboard");
      return;
    }
    
    // Also check for any "parent-" routes
    if (pathname.includes("parent-")) {
      showAlert("Parent section detected! Redirecting to child dashboard.", "warning");
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
    { href: "/my-goals", icon: "fas fa-bullseye", label: "My Goals", active: false },
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
    // ALWAYS exclude approved tasks first (baseline filter)
    let filtered = tasks.filter(t => !t.approved);

    // Apply status filter
    if (taskStatusFilter === "pending") {
      filtered = filtered.filter(t => !t.completed);
    } else if (taskStatusFilter === "completed") {
      filtered = filtered.filter(t => t.completed);
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

  const sendTaskReminder = async (taskId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to send reminders', "error");
        return;
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Family setup incomplete. Ask your parent to add you to the family.', "warning");
        return;
      }

      // Get parent user ID from family
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('family_id', profile.family_id)
        .eq('role', 'parent')
        .maybeSingle();

      console.log('Task reminder - parent lookup:', { parentProfile, parentError, familyId: profile.family_id });

      if (!parentProfile) {
        showAlert(
          "No parent found in your family. Ask your parent to:\n1. Log in to the app\n2. Make sure they're in the same family",
          "warning"
        );
        return;
      }

      // Create notification for parent
      const { error, data } = await supabase
        .from('notifications')
        .insert({
          user_id: parentProfile.id,
          family_id: profile.family_id,
          type: 'task',
          title: '⏰ Task Approval Reminder',
          message: `${profile.full_name || 'Your child'} is waiting for approval on: "${task.title}" (${task.points} points)`,
          read: false,
          action_url: '/parent-dashboard',
          action_text: 'Review Task'
        })
        .select();

      if (error) {
        console.error('Failed to create notification:', error);
        throw error;
      }

      console.log('✅ Reminder notification created:', data);
      showAlert('Reminder sent to parent! 📬', "success");
    } catch (error) {
      console.error('Error sending task reminder:', error);
      showAlert('Failed to send reminder', "error");
    }
  };

  const sendRewardReminder = async (redemptionId: string) => {
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to send reminders', "error");
        return;
      }

      const redemption = redemptions.find(r => r.id === redemptionId);
      if (!redemption || !redemption.reward) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, family_id')
        .eq('id', user.id)
        .single();

      if (!profile?.family_id) {
        showAlert('Family setup incomplete. Ask your parent to add you to the family.', "warning");
        return;
      }

      // Get parent user ID from family
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('family_id', profile.family_id)
        .eq('role', 'parent')
        .maybeSingle();

      console.log('Reward reminder - parent lookup:', { parentProfile, parentError, familyId: profile.family_id });

      if (!parentProfile) {
        showAlert(
          "No parent found in your family. Ask your parent to:\n1. Log in to the app\n2. Make sure they're in the same family",
          "warning"
        );
        return;
      }

      // Create notification for parent
      const { error, data } = await supabase
        .from('notifications')
        .insert({
          user_id: parentProfile.id,
          family_id: profile.family_id,
          type: 'reward',
          title: '⏰ Reward Approval Reminder',
          message: `${profile.full_name || 'Your child'} is waiting for approval on reward: "${redemption.reward.title}" (${redemption.points_spent} points)`,
          read: false,
          action_url: '/rewards-store',
          action_text: 'Review Reward'
        })
        .select();

      if (error) {
        console.error('Failed to create notification:', error);
        throw error;
      }

      console.log('✅ Reminder notification created:', data);
      showAlert('Reminder sent to parent! 📬', "success");
    } catch (error) {
      console.error('Error sending reward reminder:', error);
      showAlert('Failed to send reminder', "error");
    }
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
        showAlert(`Failed to complete task: ${error.message}`, "error");
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
      showAlert(`Error: ${error.message}`, "error");
    }
  };

  const requestHelp = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      // Prompt for help message
      const helpMessage = await showPrompt(`What help do you need with "${task?.title}"?`);
      
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
        showAlert('Failed to request help', "error");
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
      showAlert('You have already requested this reward!', "warning");
      return;
    }

    if (points < reward.points_cost) {
      showAlert(`You need ${reward.points_cost} points to redeem this reward!`, "warning");
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showAlert('You must be logged in to redeem rewards', "error");
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
        showAlert('Failed to redeem reward: ' + error.message, "error");
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
      showAlert('Failed to redeem reward', "error");
    }
  };

  const getPepTalk = () => {
    const hour = new Date().getHours();
    const completedCount = tasks.filter(t => t.completed && !t.approved).length;
    const totalPoints = points;
    
    // Time-based greetings
    const timeGreeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    
    // Context-aware message categories
    const morningMessages = [
      { text: "Good morning, champion! 🌅 You've got this!", emoji: "🌅" },
      { text: "Rise and shine! ☀️ Today's tasks are waiting for you!", emoji: "☀️" },
      { text: "Morning superstar! 🌟 Let's make today amazing!", emoji: "🌟" },
      { text: "A new day, a new adventure! 🚀 Let's go!", emoji: "🚀" }
    ];
    
    const afternoonMessages = [
      { text: "Keep that energy up! ⚡ You're doing great!", emoji: "⚡" },
      { text: "Afternoon power boost! 💪 You're on fire!", emoji: "💪" },
      { text: "Look at you go! 🎯 Keep crushing it!", emoji: "🎯" },
      { text: "You're unstoppable today! 🔥 Keep going!", emoji: "🔥" }
    ];
    
    const eveningMessages = [
      { text: "Evening warrior! 🌙 Finish strong!", emoji: "🌙" },
      { text: "You've got this! ✨ One more push!", emoji: "✨" },
      { text: "Almost there! 🌟 You're amazing!", emoji: "🌟" },
      { text: "End the day like a champion! 🏆 You can do it!", emoji: "🏆" }
    ];
    
    // Progress-based messages
    const noTasksMessages = [
      { text: "Ready to start your adventure? 🎮 Let's tackle some tasks!", emoji: "🎮" },
      { text: "Fresh start! 🌱 Every journey begins with one task!", emoji: "🌱" },
      { text: "Time to shine! 💫 Pick a task and show what you can do!", emoji: "💫" }
    ];
    
    const fewTasksMessages = [
      { text: "You're on a roll! 🎲 Keep that momentum going!", emoji: "🎲" },
      { text: "Awesome progress! 🌈 You're building something great!", emoji: "🌈" },
      { text: "Look at you! 🎪 Every task makes you stronger!", emoji: "🎪" }
    ];
    
    const manyTasksMessages = [
      { text: "WOW! You're a task-completing LEGEND! 🏆", emoji: "🏆" },
      { text: "Incredible work! 🎉 You're absolutely crushing it!", emoji: "🎉" },
      { text: "SUPERSTAR ALERT! ⭐ You're on fire today!", emoji: "⭐" },
      { text: "You're UNSTOPPABLE! 🚀 Keep soaring!", emoji: "🚀" }
    ];
    
    // Points-based encouragement
    const pointsMessages = [
      { text: `${totalPoints} points and counting! 💎 You're a point-earning machine!`, emoji: "💎" },
      { text: `Your ${totalPoints} points show your dedication! 🎖️ Keep it up!`, emoji: "🎖️" },
      { text: `${totalPoints} points of pure awesomeness! 🌟 You rock!`, emoji: "🌟" }
    ];
    
    // General motivation
    const generalMessages = [
      { text: "You're doing AMAZING! 🎨 Keep painting your success!", emoji: "🎨" },
      { text: "Believe in yourself! 🦋 You're capable of great things!", emoji: "🦋" },
      { text: "Every small step is a BIG victory! 🎯 You're winning!", emoji: "🎯" },
      { text: "Your hard work is noticed! 👀 Keep being awesome!", emoji: "👀" },
      { text: "You make it look easy! 🎭 That's how talented you are!", emoji: "🎭" },
      { text: "Consistency is your superpower! 💪 Use it wisely!", emoji: "💪" },
      { text: "You're an inspiration! 🌺 Never stop being you!", emoji: "🌺" },
      { text: "Challenge accepted and CRUSHED! 🎮 Level up!", emoji: "🎮" },
      { text: "Your future self will thank you! 🔮 Keep going!", emoji: "🔮" },
      { text: "You're writing your own success story! 📖 What a tale!", emoji: "📖" }
    ];
    
    // Select message based on context
    let selectedMessages;
    
    if (completedCount === 0) {
      selectedMessages = noTasksMessages;
    } else if (completedCount <= 3) {
      selectedMessages = fewTasksMessages;
    } else {
      selectedMessages = manyTasksMessages;
    }
    
    // Mix in time-based messages
    if (timeGreeting === "morning") {
      selectedMessages = [...selectedMessages, ...morningMessages];
    } else if (timeGreeting === "afternoon") {
      selectedMessages = [...selectedMessages, ...afternoonMessages];
    } else {
      selectedMessages = [...selectedMessages, ...eveningMessages];
    }
    
    // Add points and general messages for more variety
    if (totalPoints > 0) {
      selectedMessages = [...selectedMessages, ...pointsMessages];
    }
    selectedMessages = [...selectedMessages, ...generalMessages];
    
    // Pick a random message
    const randomMessage = selectedMessages[Math.floor(Math.random() * selectedMessages.length)];
    
    // Show modal with animation
    setPepTalkModal({ show: true, message: randomMessage.text, emoji: randomMessage.emoji });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setPepTalkModal({ show: false, message: "", emoji: "" });
    }, 5000);
  };

  const openTaskHelper = (task: Task) => {
    const welcomeMessage = {
      text: `Hi! 👋 I'm here to help you with "${task.title}". Ask me questions like:\n• How do I start?\n• Where do I find the tools?\n• Can you break this down into steps?\n• What's the best way to do this?`,
      sender: 'ai' as const
    };
    setTaskHelperModal({ show: true, task, messages: [welcomeMessage] });
  };

  const sendHelperMessage = () => {
    if (!helperInput.trim() || !taskHelperModal.task) return;

    const userMessage = { text: helperInput, sender: 'user' as const };
    const newMessages = [...taskHelperModal.messages, userMessage];
    
    // Simulate AI thinking
    setTaskHelperModal({ ...taskHelperModal, messages: [...newMessages, { text: '🤔 Thinking...', sender: 'ai' }] });
    
    setTimeout(() => {
      const response = generateTaskHelp(helperInput, taskHelperModal.task!);
      const aiMessage = { text: response, sender: 'ai' as const };
      setTaskHelperModal({ ...taskHelperModal, messages: [...newMessages, aiMessage] });
      setHelperInput('');
    }, 1000);
  };

  const generateTaskHelp = (question: string, task: Task): string => {
    const lowerQuestion = question.toLowerCase();
    const taskTitle = task.title.toLowerCase();
    const taskDesc = task.description?.toLowerCase() || '';
    const category = task.category?.toLowerCase() || '';
    const fullTaskText = `${taskTitle} ${taskDesc}`;

    // Task-specific keyword detection
    const getTaskSpecificAdvice = (type: string): string => {
      // Homework/School tasks
      if (fullTaskText.includes('homework') || fullTaskText.includes('math') || fullTaskText.includes('reading') || fullTaskText.includes('study')) {
        if (type === 'start') return `To start "${task.title}": First, gather your books, pencils, and paper. Find a quiet spot with good lighting. Read the instructions twice before beginning. Start with the problem you understand best! 📚✨`;
        if (type === 'steps') return `Breaking down "${task.title}":\n\n1️⃣ Read all instructions carefully\n2️⃣ Gather materials (textbook, notebook, calculator)\n3️⃣ Start with easiest questions first\n4️⃣ Show your work for math problems\n5️⃣ Take 5-min break every 20 minutes\n6️⃣ Double-check your answers\n\nStudy tip: Explain it out loud to yourself! 🎓`;
        if (type === 'where') return `For "${task.title}", you'll need:\n• Your backpack or school bag\n• Textbooks (usually on your desk or shelf)\n• Pencils/pens (desk drawer)\n• Calculator (ask parent if needed)\n• Quiet space (your room or dining table)\n\nHave everything before you start! 📝`;
      }

      // Cleaning tasks
      if (fullTaskText.includes('clean') || fullTaskText.includes('room') || fullTaskText.includes('bedroom') || fullTaskText.includes('tidy')) {
        if (type === 'start') return `Start "${task.title}" by picking up big items off the floor first! Put clothes in hamper, toys in bins. This makes the room look way better immediately and motivates you to finish! 🧹`;
        if (type === 'steps') return `"${task.title}" - Room cleaning steps:\n\n1️⃣ Put dirty clothes in hamper\n2️⃣ Put toys/games back on shelves\n3️⃣ Make your bed (pull up sheets & blanket)\n4️⃣ Clear off desk - organize papers\n5️⃣ Dust surfaces with cloth\n6️⃣ Vacuum or sweep floor\n7️⃣ Take out any trash\n\nPro tip: Put on music! 🎵`;
        if (type === 'where') return `For "${task.title}", grab:\n• Hamper/laundry basket (closet/corner of room)\n• Cleaning cloth (under sink or laundry room)\n• Vacuum/broom (hall closet or garage)\n• Trash bag if needed\n\nMost cleaning supplies are under the kitchen sink! 🧼`;
      }

      // Pet care
      if (fullTaskText.includes('dog') || fullTaskText.includes('pet') || fullTaskText.includes('cat') || fullTaskText.includes('walk')) {
        if (type === 'start') return `For "${task.title}": First, grab the leash (usually by the door). Let your dog see it - they'll get excited! Put on your shoes, check if it's raining (grab jacket if needed), then clip on the leash. Your dog will be so happy! 🐕💙`;
        if (type === 'steps') return `"${task.title}" - Pet care steps:\n\n1️⃣ Get leash and poop bags (by door)\n2️⃣ Put on shoes and jacket\n3️⃣ Clip leash to collar\n4️⃣ Walk around the block (15-20 mins)\n5️⃣ Let them sniff and do their business\n6️⃣ Pick up poop (use bag!)\n7️⃣ Come home, give them water\n8️⃣ Wash your hands\n\nYour pet loves this time with you! 🐾`;
        if (type === 'where') return `For "${task.title}", find:\n• Leash (hanging by front/back door)\n• Poop bags (near leash or in garage)\n• Dog treats (pantry or pet shelf)\n• Water bowl (kitchen floor or pet area)\n\nCheck your dog's collar is secure before going! 🦴`;
      }

      // Dishes/Kitchen
      if (fullTaskText.includes('dish') || fullTaskText.includes('kitchen') || fullTaskText.includes('wash') || fullTaskText.includes('plates')) {
        if (type === 'start') return `To start "${task.title}": Scrape leftover food into trash first. Then stack plates by size. Fill sink with warm soapy water. Start with cups and glasses (cleanest items first), then plates, then pots. You'll be done quick! 🍽️`;
        if (type === 'steps') return `"${task.title}" - Dishwashing made easy:\n\n1️⃣ Scrape food into trash\n2️⃣ Stack by type (cups, plates, pots)\n3️⃣ Fill sink with warm soapy water\n4️⃣ Wash cups first (they're cleanest)\n5️⃣ Then plates and bowls\n6️⃣ Pots and pans last\n7️⃣ Rinse with clean water\n8️⃣ Dry with towel or let air-dry\n9️⃣ Put away when dry\n\nTip: Hot water = easier cleaning! 💧`;
        if (type === 'where') return `For "${task.title}", you need:\n• Dish soap (under sink or by sink)\n• Sponge (also under sink)\n• Dish towel (drawer near sink)\n• Drying rack (on counter)\n\nIf sink is full, ask parent to remove garbage disposal items! 🧽`;
      }

      // Trash/Outdoor
      if (fullTaskText.includes('trash') || fullTaskText.includes('garbage') || fullTaskText.includes('bins')) {
        if (type === 'start') return `For "${task.title}": Check all small trash cans in rooms (bathrooms, bedrooms). Empty them into the big kitchen trash bag. Tie the bag tight, take it outside to the bin. Don't forget to put a new bag in! 🗑️`;
        if (type === 'steps') return `"${task.title}" - Trash duty:\n\n1️⃣ Collect small trash bags from all rooms\n2️⃣ Empty into main kitchen trash\n3️⃣ Tie bag securely (no holes!)\n4️⃣ Take outside to bin (put in garage if cold)\n5️⃣ Put new bag in kitchen can\n6️⃣ Replace small bathroom bags if needed\n7️⃣ Wash hands when done\n\nQuick task - you got this! 💪`;
        if (type === 'where') return `For "${task.title}", find:\n• Main trash bin (outside by garage/curb)\n• Extra trash bags (under kitchen sink)\n• Small trash cans (bathrooms, bedrooms)\n\nIf bins are full, ask parent where overflow bags go! 🚮`;
      }

      // Yard work
      if (fullTaskText.includes('yard') || fullTaskText.includes('lawn') || fullTaskText.includes('rake') || fullTaskText.includes('garden')) {
        if (type === 'start') return `To start "${task.title}": Check the weather first - if it's too hot, wait till evening. Grab your tools from the shed/garage. Wear old clothes and closed-toe shoes. Work in sections - don't try to do it all at once! 🌳`;
        if (type === 'steps') return `"${task.title}" - Outdoor work plan:\n\n1️⃣ Check weather - dress appropriately\n2️⃣ Get tools (garage/shed)\n3️⃣ Start in one corner/section\n4️⃣ Work methodically across the area\n5️⃣ Take water breaks every 15 mins\n6️⃣ Collect debris in bags/bin\n7️⃣ Put tools back clean\n8️⃣ Wash up when done\n\nYard work = fresh air + exercise! 🌿`;
        if (type === 'where') return `For "${task.title}", look for:\n• Rake/tools (garage or shed)\n• Work gloves (also garage)\n• Yard waste bags (near trash cans)\n• Water bottle (bring from kitchen!)\n\nAsk parent where they keep specific lawn equipment! 🛠️`;
      }

      return ''; // Will fall through to generic responses
    };

    // Question type detection with task-specific answers
    if (lowerQuestion.includes('start') || lowerQuestion.includes('begin')) {
      const specific = getTaskSpecificAdvice('start');
      if (specific) return specific;
      return `To start "${task.title}": Break it into the tiniest first step possible. What's one thing you can do right now in 30 seconds? Do that! Then the next step will feel easier. 🚀`;
    }

    if (lowerQuestion.includes('where') || lowerQuestion.includes('find') || lowerQuestion.includes('tool') || lowerQuestion.includes('supply') || lowerQuestion.includes('need')) {
      const specific = getTaskSpecificAdvice('where');
      if (specific) return specific;
      return `For "${task.title}", common places to check:\n• Garage/shed for tools\n• Under kitchen sink for cleaning supplies\n• Closets/pantry for household items\n• Your room/desk for school stuff\n\nCan't find it? Ask your parent - they'll know exactly where it is! 🔍`;
    }

    if (lowerQuestion.includes('step') || lowerQuestion.includes('break') || lowerQuestion.includes('how')) {
      const specific = getTaskSpecificAdvice('steps');
      if (specific) return specific;
      
      // Generic but still useful step breakdown
      return `Here's how to tackle "${task.title}":\n\n1️⃣ Understand what "done" looks like\n2️⃣ Gather everything you'll need\n3️⃣ Clear your workspace\n4️⃣ Start with the easiest part\n5️⃣ Work steadily - short breaks OK\n6️⃣ Check your work\n7️⃣ Clean up after\n\n${task.description ? `Remember: ${task.description}` : 'You\'ve got this!'} ⭐`;
    }

    if (lowerQuestion.includes('best way') || lowerQuestion.includes('tips') || lowerQuestion.includes('advice')) {
      return `Pro tips for "${task.title}":\n\n🎵 Put on your favorite music\n⏱️ Set a timer - race against it!\n🎯 Focus on quality, not just speed\n🎁 Reward yourself after (snack/screen time)\n💪 Do it when you're most energized\n\n${task.description ? `Parent said: "${task.description}"` : 'Remember why this matters to your family!'} ✨`;
    }

    if (lowerQuestion.includes('hard') || lowerQuestion.includes('difficult') || lowerQuestion.includes('can\'t') || lowerQuestion.includes('help')) {
      return `I hear you - "${task.title}" feels tough! 💙\n\nTry this:\n🎯 Do just 5 minutes. Set a timer.\n💪 After 5 mins, you can stop OR keep going\n🌟 You'll probably want to finish!\n\n${task.description ? `Remember: ${task.description}\n\n` : ''}If it's truly too hard, ask your parent to break it down more. That's totally OK! You're not giving up, you're being smart. 🧠`;
    }

    if (lowerQuestion.includes('time') || lowerQuestion.includes('long') || lowerQuestion.includes('quick')) {
      const estimatedTime = Math.ceil(task.points / 5);
      return `"${task.title}" usually takes about ${estimatedTime}-${estimatedTime + 10} minutes if you focus and don't get distracted.\n\nQuick tips:\n⏰ Set a timer for ${estimatedTime} minutes\n📱 Put phone away during task\n🎯 Stay focused = finish faster\n🎉 Then enjoy your free time!\n\nIt's worth ${task.points} points - that's ${estimatedTime} mins of work for rewards! 💎`;
    }

    // Default with task description if available
    if (task.description) {
      return `About "${task.title}":\n\n${task.description}\n\nThis task is worth ${task.points} points! ${
        task.points >= 100 ? 'That\'s a big one - take your time and do it well! 🏆' :
        task.points >= 50 ? 'Good value for your effort! 💪' :
        'Quick task - you\'ll finish in no time! ⚡'
      }\n\nWhat specifically would you like help with? Ask me about:\n• How to start\n• Where to find things\n• Step-by-step breakdown\n• Time it takes`;
    }

    return `I'm here to help with "${task.title}"! (${task.points} points) 🌟\n\nAsk me specific questions like:\n• "How do I start?"\n• "Where can I find...?"\n• "Can you break this into steps?"\n• "How long will it take?"\n• "What's the best way?"\n\nThe more specific your question, the better I can help! 💡`;
  };

  const stats = {
    todo: tasks.filter(t => !t.completed && !t.approved).length,
    completed: tasks.filter(t => t.completed && !t.approved).length,
    redeemed: redemptions.filter(r => r.status === 'approved').length
  };

  const todoTasks = tasks.filter(task => !task.completed && !task.approved);
  const completedTasks = tasks.filter(task => task.completed && !task.approved);

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
          
          {/* Settings Link */}
          <Link
            href="/child-settings"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white/90 rounded-xl hover:bg-white/20 transition-all font-medium"
          >
            <i className="fas fa-cog"></i>
            <span>My Settings</span>
          </Link>
          
          {/* Logout Button */}
          <LogoutButton variant="sidebar" />
        </div>
      </aside>

      <main className="main-content ml-64 flex-1 p-10">
        {/* Header with permission badge */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#006372]">
                {userName ? `${userName}'s Dashboard` : 'Child Dashboard'}
              </h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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

          <Link href="/my-goals" className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg border border-purple-400 hover:shadow-xl transition-all cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white/90 text-sm font-medium">My Goals</h3>
                <div className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
                  Track Goals
                  <i className="fas fa-arrow-right text-lg"></i>
                </div>
              </div>
              <i className="fas fa-bullseye text-3xl text-white/80"></i>
            </div>
          </Link>
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
                  
                  {task.completed && !task.approved && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-700">
                          <i className="fas fa-clock"></i>
                          <span className="text-sm font-medium">Waiting for parent approval</span>
                        </div>
                        <button
                          onClick={() => sendTaskReminder(task.id)}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                          title="Send reminder to parent"
                        >
                          <i className="fas fa-bell"></i>
                          Remind
                        </button>
                      </div>
                    </div>
                  )}
                  {!task.completed && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => completeTask(task.id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <i className="fas fa-check mr-2"></i>Mark Complete
                      </button>
                      <button
                        onClick={() => openTaskHelper(task)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        title="Get AI help with this task"
                      >
                        <i className="fas fa-lightbulb"></i>
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
                          <div className="text-xs text-gray-500 mt-1 mb-3">Waiting for parent...</div>
                          <button
                            onClick={() => sendRewardReminder(redemption?.id || '')}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
                            title="Send reminder to parent"
                          >
                            <i className="fas fa-bell"></i>
                            Send Reminder
                          </button>
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

        {/* Family Bulletin Board */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-bullhorn text-2xl text-purple-500"></i>
              <h2 className="text-xl font-bold text-gray-800">Family Bulletin</h2>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {bulletinMessages.length} messages
            </span>
          </div>

          {bulletinMessages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-clipboard text-5xl text-gray-300 mb-4"></i>
              <p className="text-lg">No family messages yet</p>
              <p className="text-sm mt-2">Messages from parents will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bulletinMessages.map((message) => {
                const messageDate = new Date(message.created_at);
                const isToday = messageDate.toDateString() === new Date().toDateString();
                const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = isToday ? 'Today' : messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div 
                    key={message.id} 
                    className="p-4 bg-gradient-to-br from-purple-50/50 to-white rounded-xl border border-purple-100/50 hover:border-purple-200 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {message.poster_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-800">{message.poster_name}</div>
                            <div className="text-xs text-gray-500">{dateStr} at {timeStr}</div>
                          </div>
                          <i className="fas fa-thumbtack text-purple-400 text-sm"></i>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <i className="fas fa-info-circle text-purple-500"></i>
              <span>Messages are posted by parents and stay until they remove them.</span>
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
        <div className="fixed bottom-6 right-6 bg-white p-4 rounded-xl shadow-2xl border-l-4 border-[#00C2E0] animate-slideIn z-50 max-w-md">
          <div className="font-bold text-gray-800 mb-1">Great Job! 🎉</div>
          <div className="text-sm text-gray-600">{toast.message}</div>
        </div>
      )}

      {/* Pep Talk Modal */}
      {pepTalkModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setPepTalkModal({ show: false, message: "", emoji: "" })}
        >
          <div 
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 p-1 rounded-3xl shadow-2xl max-w-md mx-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 relative overflow-hidden">
              {/* Sparkle Effects */}
              <div className="absolute top-4 left-4 text-4xl animate-bounce">✨</div>
              <div className="absolute top-4 right-4 text-4xl animate-bounce delay-100">⭐</div>
              <div className="absolute bottom-4 left-8 text-3xl animate-bounce delay-200">💫</div>
              <div className="absolute bottom-4 right-8 text-3xl animate-bounce delay-300">🌟</div>
              
              {/* Main Content */}
              <div className="relative z-10 text-center">
                <div className="text-7xl mb-4 animate-pulse">{pepTalkModal.emoji}</div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  Pep Talk!
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {pepTalkModal.message}
                </p>
                <button
                  onClick={() => setPepTalkModal({ show: false, message: "", emoji: "" })}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  Thanks! 💪
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Helper Modal */}
      {taskHelperModal.show && taskHelperModal.task && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4"
          onClick={() => setTaskHelperModal({ show: false, task: null, messages: [] })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="text-white font-bold text-lg">Task Helper AI</h3>
                  <p className="text-white/80 text-sm">{taskHelperModal.task.title}</p>
                </div>
              </div>
              <button
                onClick={() => setTaskHelperModal({ show: false, task: null, messages: [] })}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {taskHelperModal.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={helperInput}
                  onChange={(e) => setHelperInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendHelperMessage()}
                  placeholder="Ask me anything about this task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendHelperMessage}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ask about how to start, where to find things, or tips! 🤖
              </p>
            </div>
          </div>
        </div>
      )}

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
            <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="text-3xl">❓</div>
                <h3 className="text-lg font-bold">Confirm Action</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 w-full animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <div className="text-3xl">✏️</div>
                <h3 className="text-lg font-bold">Input Required</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">{promptModal.message}</p>
              <input
                type="text"
                defaultValue={promptModal.defaultValue}
                id="prompt-input"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent mb-6"
                placeholder="Type your response..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('prompt-input') as HTMLInputElement;
                    promptModal.onConfirm(input?.value || '');
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPromptModal({ show: false, message: "", defaultValue: "", onConfirm: () => {} });
                    promptModal.onConfirm('');
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('prompt-input') as HTMLInputElement;
                    promptModal.onConfirm(input?.value || '');
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90 transition-all"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








