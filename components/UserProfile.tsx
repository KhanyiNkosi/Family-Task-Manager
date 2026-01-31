// components/UserProfile.tsx - Fixed with return statement
'use client';

import { createClientSupabaseClient } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

interface Profile {
  id?: string;
  user_id?: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
}

export function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Get user profile using client-side anon key
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          setProfile(profileData as Profile);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (  // <-- ADDED THIS RETURN STATEMENT
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-3 text-gray-800">Your Profile</h2>

      {profile ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium">{profile.full_name || 'User'}</p>
              <p className="text-sm text-gray-500 capitalize">{profile.role || 'member'}</p>
            </div>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-3 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-3">Not signed in</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition font-medium"
          >
            Sign In with Google
          </button>
        </div>
      )}
    </div>
  );
}
