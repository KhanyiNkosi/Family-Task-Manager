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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Child | null>(null);
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

  const handleDeleteMember = async (member: Child) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      const supabase = createClientSupabaseClient();
      
      // Delete the member's profile (CASCADE will delete related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberToDelete.id);
      
      if (error) {
        console.error('Error deleting family member:', error);
        alert('Failed to delete family member. Please try again.');
        return;
      }
      
      // Refresh the list
      await fetchFamilyData();
      
      // Close modal
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      
      alert(`${memberToDelete.name} has been removed from the family.`);
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('An error occurred while deleting the family member.');
    }
  };

  const cancelDeleteMember = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
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
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-users text-blue-500"></i>
              Family Members ({children.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{child.name}</p>
                    <p className="text-xs text-gray-500 truncate">{child.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1">
                      <i className="fas fa-star text-amber-500 text-xs"></i>
                      {child.points}
                    </span>
                    <button
                      onClick={() => handleDeleteMember(child)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove family member"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Remove Family Member?</h3>
              <p className="text-gray-600">
                Are you sure you want to remove <span className="font-bold text-gray-800">{memberToDelete.name}</span> from your family?
              </p>
              <p className="text-sm text-red-600 mt-3">
                ⚠️ This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Their profile and account</li>
                <li>• All their tasks (pending and completed)</li>
                <li>• Their points and achievements</li>
                <li>• All their activity history</li>
              </ul>
              <p className="text-sm font-bold text-red-600 mt-3">
                This action cannot be undone!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteMember}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMember}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
