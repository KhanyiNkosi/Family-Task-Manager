"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from '@/lib/supabaseClient';
import ProfileIcon from "@/app/components/ProfileIcon";

interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number | null;
  rarity: string;
  points_reward: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  is_earned: boolean;
  achievement?: Achievement;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  total_tasks_completed: number;
}

interface UserLevel {
  current_level: number;
  total_xp: number;
  xp_for_next_level: number;
  level_title: string;
}

interface ChildProfile {
  id: string;
  full_name: string;
}

const rarityColors: Record<string, string> = {
  common: 'from-teal-400 to-green-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
};

const rarityBorders: Record<string, string> = {
  common: 'border-teal-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500'
};

export default function AchievementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Map<string, UserAchievement>>(new Map());
  const [allChildrenAchievements, setAllChildrenAchievements] = useState<Map<string, UserAchievement[]>>(new Map());
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [leadingChildNames, setLeadingChildNames] = useState<{
    level?: string;
    currentStreak?: string;
    longestStreak?: string;
  }>({});
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const supabase = createClientSupabaseClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
      setUserName(profile.full_name);
      setUserId(session.user.id);
      await loadAllData(session.user.id, profile.role);
    }
  };

  const loadAllData = async (uid: string, role: string) => {
    const supabase = createClientSupabaseClient();

    // Load all achievements
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .order('rarity', { ascending: true })
      .order('requirement_value', { ascending: true });

    if (achievementsData) {
      setAchievements(achievementsData);
    }

    if (role === 'parent') {
      // For parents, load all children's achievements
      await loadChildrenAchievements(uid, supabase);
    } else {
      // For children, load their own achievements
      await loadOwnAchievements(uid, supabase);
    }

    setLoading(false);
  };

  const loadOwnAchievements = async (uid: string, supabase: any) => {
    // Load user's achievements
    const { data: userAchievementsData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', uid);

    if (userAchievementsData) {
      const map = new Map<string, UserAchievement>();
      userAchievementsData.forEach((ua: UserAchievement) => {
        map.set(ua.achievement_id, ua);
      });
      setUserAchievements(map);
    }

    // Load streak data
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (streakData) {
      setStreak(streakData);
    } else {
      setStreak({
        current_streak: 0,
        longest_streak: 0,
        last_completion_date: null,
        total_tasks_completed: 0
      });
    }

    // Load level data
    const { data: levelData } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (levelData) {
      setLevel(levelData);
    } else {
      setLevel({
        current_level: 1,
        total_xp: 0,
        xp_for_next_level: 100,
        level_title: 'Beginner'
      });
    }
  };

  const loadChildrenAchievements = async (parentId: string, supabase: any) => {
    // Get parent's family_id
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', parentId)
      .single();

    if (!parentProfile?.family_id) {
      return;
    }

    // Get all children in the family
    const { data: childrenProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('family_id', parentProfile.family_id)
      .eq('role', 'child');

    if (!childrenProfiles || childrenProfiles.length === 0) {
      return;
    }

    setChildren(childrenProfiles);

    // Load achievements for ALL children
    const childIds = childrenProfiles.map((c: ChildProfile) => c.id);
    const { data: allAchievementsData } = await supabase
      .from('user_achievements')
      .select('*')
      .in('user_id', childIds);

    if (allAchievementsData) {
      // Group achievements by achievement_id
      const achievementMap = new Map<string, UserAchievement[]>();
      allAchievementsData.forEach((ua: UserAchievement) => {
        const existing = achievementMap.get(ua.achievement_id) || [];
        existing.push(ua);
        achievementMap.set(ua.achievement_id, existing);
      });
      setAllChildrenAchievements(achievementMap);
    }

    // Calculate aggregate stats
    const { data: allStreaks } = await supabase
      .from('user_streaks')
      .select('*')
      .in('user_id', childIds);

    const { data: allLevels } = await supabase
      .from('user_levels')
      .select('*')
      .in('user_id', childIds);

    // Aggregate: Show highest current streak, longest streak ever, highest level, total XP
    if (allStreaks && allStreaks.length > 0) {
      const maxCurrentStreak = Math.max(...allStreaks.map((s: UserStreak) => s.current_streak || 0));
      const maxLongestStreak = Math.max(...allStreaks.map((s: UserStreak) => s.longest_streak || 0));
      const totalTasks = allStreaks.reduce((sum: number, s: UserStreak) => sum + (s.total_tasks_completed || 0), 0);

      // Find which child has the best current streak
      const bestCurrentStreakUser = allStreaks.find((s: any) => s.current_streak === maxCurrentStreak);
      const currentStreakChild = childrenProfiles.find((c: ChildProfile) => c.id === bestCurrentStreakUser?.user_id);
      
      // Find which child has the longest streak ever
      const bestLongestStreakUser = allStreaks.find((s: any) => s.longest_streak === maxLongestStreak);
      const longestStreakChild = childrenProfiles.find((c: ChildProfile) => c.id === bestLongestStreakUser?.user_id);

      setStreak({
        current_streak: maxCurrentStreak,
        longest_streak: maxLongestStreak,
        last_completion_date: null,
        total_tasks_completed: totalTasks
      });
      
      setLeadingChildNames(prev => ({
        ...prev,
        currentStreak: currentStreakChild?.full_name,
        longestStreak: longestStreakChild?.full_name
      }));
    } else {
      setStreak({
        current_streak: 0,
        longest_streak: 0,
        last_completion_date: null,
        total_tasks_completed: 0
      });
    }

    if (allLevels && allLevels.length > 0) {
      const maxLevel = Math.max(...allLevels.map((l: UserLevel) => l.current_level || 1));
      const totalXP = allLevels.reduce((sum: number, l: UserLevel) => sum + (l.total_xp || 0), 0);
      const highestLevelUser = allLevels.find((l: UserLevel) => l.current_level === maxLevel);
      
      // Find which child has the highest level
      const levelChild = childrenProfiles.find((c: ChildProfile) => c.id === (highestLevelUser as any)?.user_id);

      setLevel({
        current_level: maxLevel,
        total_xp: totalXP,
        xp_for_next_level: highestLevelUser?.xp_for_next_level || 100,
        level_title: highestLevelUser?.level_title || 'Beginner'
      });
      
      setLeadingChildNames(prev => ({
        ...prev,
        level: levelChild?.full_name
      }));
    } else {
      setLevel({
        current_level: 1,
        total_xp: 0,
        xp_for_next_level: 100,
        level_title: 'Beginner'
      });
    }
  };

  const getFilteredAchievements = () => {
    if (userRole === 'parent') {
      // For parents, filter based on whether ANY child has earned it
      switch (filter) {
        case 'earned':
          return achievements.filter(a => {
            const childAchievements = allChildrenAchievements.get(a.id) || [];
            return childAchievements.some(ca => ca.is_earned);
          });
        case 'locked':
          return achievements.filter(a => {
            const childAchievements = allChildrenAchievements.get(a.id) || [];
            return !childAchievements.some(ca => ca.is_earned);
          });
        default:
          return achievements;
      }
    } else {
      // For children, use their own achievements
      switch (filter) {
        case 'earned':
          return achievements.filter(a => userAchievements.get(a.id)?.is_earned);
        case 'locked':
          return achievements.filter(a => !userAchievements.get(a.id)?.is_earned);
        default:
          return achievements;
      }
    }
  };

  const calculateProgress = (achievement: Achievement): number => {
    if (userRole === 'parent') {
      // For parents, show highest progress among children
      const childAchievements = allChildrenAchievements.get(achievement.id) || [];
      if (childAchievements.some(ca => ca.is_earned)) return 100;
      
      if (achievement.requirement_value) {
        const maxProgress = Math.max(0, ...childAchievements.map(ca => ca.progress || 0));
        const progress = (maxProgress / achievement.requirement_value) * 100;
        return Math.min(progress, 100);
      }
      return 0;
    } else {
      // For children, show their own progress
      const userAch = userAchievements.get(achievement.id);
      if (userAch?.is_earned) return 100;
      
      if (achievement.requirement_value) {
        const progress = (userAch?.progress || 0) / achievement.requirement_value * 100;
        return Math.min(progress, 100);
      }
      return 0;
    }
  };

  const getProgressText = (achievement: Achievement): string => {
    if (userRole === 'parent') {
      const childAchievements = allChildrenAchievements.get(achievement.id) || [];
      const earnedCount = childAchievements.filter(ca => ca.is_earned).length;
      
      if (earnedCount > 0) {
        return `${earnedCount} of ${children.length} earned`;
      }
      
      if (achievement.requirement_value) {
        const maxProgress = Math.max(0, ...childAchievements.map(ca => ca.progress || 0));
        return `${maxProgress} / ${achievement.requirement_value}`;
      }
      
      return 'Not started';
    } else {
      const userAch = userAchievements.get(achievement.id);
      if (userAch?.is_earned) return 'Earned!';
      
      if (achievement.requirement_value) {
        return `${userAch?.progress || 0} / ${achievement.requirement_value}`;
      }
      
      return 'Not started';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();
  
  // Calculate earned count based on role
  const earnedCount = userRole === 'parent'
    ? achievements.filter(a => {
        const childAchievements = allChildrenAchievements.get(a.id) || [];
        return childAchievements.some(ca => ca.is_earned);
      }).length
    : Array.from(userAchievements.values()).filter(ua => ua.is_earned).length;
    
  const xpProgress = level ? (level.total_xp % level.xp_for_next_level) / level.xp_for_next_level * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white pb-24">
      <ProfileIcon />
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold">🏆 Achievements</h1>
                <p className="text-cyan-100 text-sm">
                  {userRole === 'parent' ? 'Family badges and progress' : 'Unlock badges and level up!'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-100">{userName}</p>
              {userRole !== 'parent' && (
                <p className="text-xs text-cyan-200">{earnedCount} / {achievements.length} earned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Level Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {userRole === 'parent' ? 'Highest Level' : 'Level'}
              </h3>
              <div className="text-3xl">📈</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600 mb-2">
                {level?.current_level || 1}
              </div>
              <p className="text-sm text-gray-600 mb-3">{level?.level_title || 'Beginner'}</p>
              {userRole === 'parent' ? (
                <>
                  <p className="text-xs text-gray-500 mb-1">
                    Total XP: {level?.total_xp || 0}
                  </p>
                  {leadingChildNames.level && (
                    <p className="text-xs text-cyan-600 font-semibold">
                      👑 {leadingChildNames.level}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${xpProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {level?.total_xp || 0} / {level?.xp_for_next_level || 100} XP
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Current Streak Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {userRole === 'parent' ? 'Best Current Streak' : 'Current Streak'}
              </h3>
              <div className="text-3xl">🔥</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {streak?.current_streak || 0}
              </div>
              <p className="text-sm text-gray-600 mb-2">Days in a row</p>
              {userRole === 'parent' && leadingChildNames.currentStreak && (
                <p className="text-xs text-orange-600 font-semibold">
                  👑 {leadingChildNames.currentStreak}
                </p>
              )}
            </div>
          </div>

          {/* Best Streak Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {userRole === 'parent' ? 'Longest Ever' : 'Best Streak'}
              </h3>
              <div className="text-3xl">⭐</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {streak?.longest_streak || 0}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {userRole === 'parent' ? 'Record streak' : 'Personal record'}
              </p>
              {userRole === 'parent' && leadingChildNames.longestStreak && (
                <p className="text-xs text-yellow-600 font-semibold">
                  👑 {leadingChildNames.longestStreak}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({achievements.length})
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'earned'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'locked'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Locked ({achievements.length - earnedCount})
          </button>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const isEarned = userRole === 'parent'
              ? (allChildrenAchievements.get(achievement.id) || []).some(ca => ca.is_earned)
              : userAchievements.get(achievement.id)?.is_earned;
            const progress = calculateProgress(achievement);
            const progressText = getProgressText(achievement);

            // For parents, get which children earned this badge
            const childrenWhoEarned = userRole === 'parent'
              ? (allChildrenAchievements.get(achievement.id) || [])
                  .filter(ca => ca.is_earned)
                  .map(ca => children.find(c => c.id === ca.user_id)?.full_name)
                  .filter(Boolean)
              : [];

            return (
              <div
                key={achievement.id}
                className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg ${
                  isEarned ? `border-2 ${rarityBorders[achievement.rarity]}` : 'opacity-75'
                }`}
              >
                {/* Badge Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                      rarityColors[achievement.rarity]
                    } flex items-center justify-center text-4xl shadow-lg transition-all ${
                      isEarned 
                        ? 'ring-4 ring-white shadow-2xl scale-110' 
                        : 'opacity-60 brightness-90'
                    }`}
                    style={isEarned ? {
                      filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))',
                      animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    } : {}}
                  >
                    <i className={achievement.icon}></i>
                  </div>
                </div>

                {/* Badge Info */}
                <h3 className="text-center font-bold text-gray-900 mb-2">
                  {achievement.title}
                </h3>
                <p className="text-center text-xs text-gray-600 mb-4">
                  {achievement.description}
                </p>

                {/* Rarity Badge */}
                <div className="flex justify-center mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
                      rarityColors[achievement.rarity]
                    }`}
                  >
                    {achievement.rarity.toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                {!isEarned && achievement.requirement_value && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progressText}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Status */}
                {isEarned ? (
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm">
                      ✓ Earned +{achievement.points_reward} XP
                    </span>
                    {userRole === 'parent' && childrenWhoEarned.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p className="font-semibold mb-1">Earned by:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {childrenWhoEarned.map((childName, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs"
                            >
                              {childName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {userRole === 'child' && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(userAchievements.get(achievement.id)!.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm">
                      🔒 Locked
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-600 text-lg">No achievements in this category</p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <Link
              href={userRole === 'parent' ? '/parent-dashboard' : '/child-dashboard'}
              className="flex flex-col items-center text-gray-600 hover:text-cyan-600 transition"
            >
              <span className="text-2xl">🏠</span>
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              href="/activity-feed"
              className="flex flex-col items-center text-gray-600 hover:text-cyan-600 transition"
            >
              <span className="text-2xl">📰</span>
              <span className="text-xs mt-1">Activity</span>
            </Link>
            <Link
              href="/achievements"
              className="flex flex-col items-center text-cyan-600"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs mt-1 font-semibold">Badges</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
