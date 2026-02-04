"use client";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

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
              .select('id, role, total_points')
              .in('id', childIds)
              .eq('role', 'child');

            const childrenData = childProfiles.map(child => {
              const userProfile = userProfiles?.find(up => up.id === child.id);
              return {
                id: child.id,
                name: child.full_name,
                email: child.email,
                points: userProfile?.total_points || 0,
                joinedAt: child.created_at,
              };
            }).filter(child => userProfiles?.some(up => up.id === child.id));

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
      {/* Compact Family Code Card */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Family Code</h3>
              <p className="text-xs text-gray-500">Share with children to join</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
              {showCode ? familyCode.slice(0, 8) + '...' : '••••••••'}
            </div>
            <button
              onClick={() => setShowCode(!showCode)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title={showCode ? 'Hide' : 'Show'}
            >
              <i className={`fas ${showCode ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium flex items-center gap-1.5"
            >
              <i className={`fas ${copiedCode ? 'fa-check' : 'fa-copy'} text-xs`}></i>
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

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
