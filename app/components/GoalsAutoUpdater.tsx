"use client";

import { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  dueDate: string;
}

/**
 * Global component that subscribes to task approvals and auto-updates goals
 * This runs on all pages, so goals update even when My Goals page isn't open
 */
export default function GoalsAutoUpdater() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isChild, setIsChild] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    const initialize = async () => {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !isMounted) return;

      // Check if user is a child
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Only set up for child users
      if (profile?.role !== 'child') {
        console.log('👤 Not a child user - skipping goals auto-updater');
        return;
      }

      setUserId(user.id);
      setIsChild(true);

      console.log('🎯 Goals Auto-Updater initialized for user:', user.id);

      // Subscribe to task updates
      subscription = supabase
        .channel('global-goals-tasks-subscription')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('🔔 [GoalsAutoUpdater] Task UPDATE received');
            
            // Check if task is assigned to current user and was just approved
            if (payload.new?.assigned_to === user.id) {
              if (payload.new?.approved === true && payload.old?.approved === false) {
                console.log('🎯 [GoalsAutoUpdater] Task just got approved! Updating goals...');
                handleTaskApproval(user.id);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 [GoalsAutoUpdater] Subscription status:', status);
        });
    };

    initialize();

    return () => {
      isMounted = false;
      if (subscription) {
        console.log('🔌 [GoalsAutoUpdater] Unsubscribing...');
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleTaskApproval = (userId: string) => {
    const goalsKey = `childGoals:${userId}`;
    const savedGoals = localStorage.getItem(goalsKey);

    if (!savedGoals) {
      console.log('⚠️ [GoalsAutoUpdater] No goals found in localStorage');
      return;
    }

    const currentGoals: Goal[] = JSON.parse(savedGoals);
    const updatedGoals = incrementTaskGoals(currentGoals);

    console.log('📈 [GoalsAutoUpdater] Updated goals:', updatedGoals);

    // Save updated goals
    localStorage.setItem(goalsKey, JSON.stringify(updatedGoals));

    // Dispatch custom event so My Goals page can update if it's open
    window.dispatchEvent(new CustomEvent('goalsUpdated', { detail: updatedGoals }));

    // Check if any goal was just completed
    const newlyCompleted = updatedGoals.filter((g, i) => 
      g.status === 'completed' && currentGoals[i]?.status === 'active'
    );

    if (newlyCompleted.length > 0) {
      console.log('🎉 [GoalsAutoUpdater] Goals completed:', newlyCompleted.map(g => g.title));
      
      // Show browser notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        newlyCompleted.forEach(goal => {
          new Notification('🎉 Goal Completed!', {
            body: `"${goal.title}" - Great work!`,
            icon: '/favicon.ico'
          });
        });
      }
    }
  };

  const incrementTaskGoals = (goals: Goal[]): Goal[] => {
    const today = new Date().toISOString().split('T')[0];

    console.log('🔄 [GoalsAutoUpdater] Incrementing task goals. Today:', today);

    return goals.map((goal) => {
      // Only auto-increment goals with 'tasks' unit
      if (goal.status !== 'active' || !goal.unit.toLowerCase().includes('task')) {
        return goal;
      }

      // Check if goal is still active (not expired)
      const shouldIncrement = goal.dueDate >= today;

      console.log('  🎯 Checking goal:', goal.title);
      console.log('    - Status:', goal.status);
      console.log('    - Unit:', goal.unit);
      console.log('    - Due date:', goal.dueDate);
      console.log('    - Should increment?', shouldIncrement);

      if (shouldIncrement) {
        const newValue = goal.currentValue + 1;
        console.log('    ✅ Incrementing!', goal.currentValue, '→', newValue);

        // Check if goal is now completed
        if (newValue >= goal.targetValue) {
          console.log('    🎉 Goal completed!');
          return {
            ...goal,
            currentValue: newValue,
            status: 'completed' as const
          };
        }

        return {
          ...goal,
          currentValue: newValue
        };
      } else {
        console.log('    ⏭️ Skipped (expired or wrong type)');
      }

      return goal;
    });
  };

  // This component renders nothing - it just runs the subscription in the background
  return null;
}
