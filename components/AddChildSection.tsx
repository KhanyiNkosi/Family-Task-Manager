"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { usePremium } from '@/hooks/usePremium';
import Link from 'next/link';

interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  joinedAt: string;
  role?: string;
}

interface AddChildSectionProps {
  onChildrenLoaded?: (children: Child[]) => void;
}

export default function AddChildSection({ onChildrenLoaded }: AddChildSectionProps) {
  const [familyCode, setFamilyCode] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { isPremium, isLoading: premiumLoading } = usePremium();

  useEffect(() => {
    fetchFamilyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const supabase = createClientSupabaseClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      if (!user) {
        console.error('No user found');
        return;
      }

      console.log('Fetching profile for user:', user.id);

      // Get user's profile to get family_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        console.error('Full error details:', JSON.stringify(profileError, null, 2));
        return;
      }

      console.log('Profile data:', profile);

      if (profile?.family_id) {
        setFamilyCode(profile.family_id);

        // Get only children in the family (exclude parents)
        const { data: childProfiles } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            created_at,
            role
          `)
          .eq('family_id', profile.family_id)
          .eq('role', 'child');

        if (childProfiles && childProfiles.length > 0) {
            // Calculate points dynamically for each child
            const childrenDataPromises = childProfiles.map(async (child) => {

              // Calculate points from approved tasks
              const { data: approvedTasks } = await supabase
                .from('tasks')
                .select('points')
                .eq('assigned_to', child.id)
                .eq('approved', true);
              
              const earnedPoints = approvedTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;
              
              // Calculate points spent on APPROVED redemptions only
              const { data: redemptions } = await supabase
                .from('reward_redemptions')
                .select('points_spent')
                .eq('user_id', child.id)
                .eq('status', 'approved');
              
              const spentPoints = redemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
              
              const currentPoints = earnedPoints - spentPoints;

              return {
                id: child.id,
                name: child.full_name,
                email: child.email,
                points: currentPoints,
                joinedAt: child.created_at,
                role: child.role,
              };
            });

            const childrenData = (await Promise.all(childrenDataPromises)).filter(child => child !== null) as Child[];

            console.log('Children loaded:', childrenData);
            setChildren(childrenData);
            if (onChildrenLoaded) {
              console.log('Calling onChildrenLoaded with:', childrenData);
              onChildrenLoaded(childrenData);
            }
        } else {
          console.log('No child profiles found');
          setChildren([]);
          if (onChildrenLoaded) {
            onChildrenLoaded([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'FamilyTask Invitation',
        text: `Join our family on FamilyTask! Use this code: ${familyCode}`,
        url: `${window.location.origin}/register`
      });
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="space-y-4">
      {/* Premium Badge for Unlimited Children */}
      {!premiumLoading && isPremium && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-3 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Premium Member</h3>
              <p className="text-purple-100 text-xs">Unlimited children • Photo verification • Custom rewards</p>
            </div>
          </div>
        </div>
      )}

      {/* Family Members List with Delete Option */}
      {!loading && children.length > 0 && (
        <div className="bg-whiRemoved - Moved to Parent Profile Page */
}
