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

        // Get all family members who are children
        const { data: childProfiles } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            created_at
          `)
          .eq('family_id', profile.family_id)
          .neq('id', user.id);

        if (childProfiles) {
          const childIds = childProfiles.map(c => c.id);
          
          if (childIds.length > 0) {
            const { data: userProfiles } = await supabase
              .from('user_profiles')
              .select('id, role')
              .in('id', childIds)
              .eq('role', 'child');

            // Calculate points dynamically for each child
            const childrenDataPromises = childProfiles.map(async (child) => {
              const userProfile = userProfiles?.find(up => up.id === child.id);
              if (!userProfile) return null;

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
        } else {
          console.log('No childIds found');
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
      {/* Premium Child Limit Warning */}
      {!premiumLoading && !isPremium && children.length >= 1 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">👑</div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-1">Child Limit Reached</h3>
              <p className="text-gray-600 text-sm mb-3">
                You've reached the maximum of 1 child on the free plan. Upgrade to Premium for unlimited children!
              </p>
              <Link
                href="/pricing"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition text-sm"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      )}

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

      {/* Children List - Only show if there are children */}
      {!loading && children.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">
              <i className="fas fa-users text-cyan-500 mr-2"></i>
              Family Members ({children.length})
            </h3>
            <button
              onClick={fetchFamilyData}
              className="p-1.5 text-gray-500 hover:text-cyan-500 transition text-xs"
              title="Refresh"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>

          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{child.name}</h4>
                    <p className="text-xs text-gray-500">{child.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
                    <i className="fas fa-star text-xs"></i>
                    <span>{child.points || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
