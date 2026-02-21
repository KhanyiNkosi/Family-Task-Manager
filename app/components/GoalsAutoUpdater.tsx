/**
 * FamilyTask - Family Task Manager
 * Copyright (c) 2026 FamilyTask. All rights reserved.
 * 
 * Goals Auto-Updater Component
 * Automatically updates goals when tasks are approved and points are earned
 * NOTE: All goals are now points-based only for automatic tracking
 */

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
                const taskPoints = payload.new?.points || 0;
                console.log('🎯 [GoalsAutoUpdater] Task just got approved! Points:', taskPoints);
                handleTaskApproval(user.id, taskPoints);
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

  const handleTaskApproval = (userId: string, pointsEarned: number) => {
    const goalsKey = `childGoals:${userId}`;
    const savedGoals = localStorage.getItem(goalsKey);

    if (!savedGoals) {
      console.log('⚠️ [GoalsAutoUpdater] No goals found in localStorage');
      return;
    }

    const currentGoals: Goal[] = JSON.parse(savedGoals);
    const updatedGoals = incrementTaskGoals(currentGoals, pointsEarned);

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

  const incrementTaskGoals = (goals: Goal[], pointsEarned: number): Goal[] => {
    const today = new Date().toISOString().split('T')[0];

    console.log('🔄 [GoalsAutoUpdater] Incrementing goals. Points earned:', pointsEarned, 'Today:', today);

    return goals.map((goal) => {
      // Only auto-increment active goals
      if (goal.status !== 'active') {
        return goal;
      }

      // All goals are points-based now
      const unitLower = goal.unit.toLowerCase();
      if (!unitLower.includes('point')) {
        // Skip non-points goals (shouldn't exist, but safe check)
        return goal;
      }

      // Check if goal is still active (not expired)
      const shouldIncrement = goal.dueDate >= today;

      console.log('  🎯 Checking goal:', goal.title);
      console.log('    - Status:', goal.status);
      console.log('    - Current:', goal.currentValue, '/', goal.targetValue, 'points');
      console.log('    - Due date:', goal.dueDate);
      console.log('    - Should increment?', shouldIncrement);

      if (shouldIncrement) {
        // Always increment by points earned
        const newValue = goal.currentValue + pointsEarned;
        console.log('    ✅ Incrementing!', goal.currentValue, '→', newValue, `(+${pointsEarned} points)`);

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
        console.log('    ⏭️ Skipped (expired)');
      }

      return goal;
    });
  };

  // This component renders nothing - it just runs the subscription in the background
  return null;
}
