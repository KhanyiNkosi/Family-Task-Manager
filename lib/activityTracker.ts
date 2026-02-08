// Activity tracking utility for child profile
// This helps track child activities across the app

export interface Activity {
  id: string;
  type: 'task' | 'reward' | 'goal' | 'ai';
  title: string;
  points: number;
  time: string;
  icon: string;
  color: string;
}

export const trackActivity = (
  type: Activity['type'],
  title: string,
  points: number
) => {
  const activities = JSON.parse(localStorage.getItem('childActivities') || '[]');
  
  const iconMap = {
    task: 'fa-check',
    reward: 'fa-gift',
    goal: 'fa-bullseye',
    ai: 'fa-robot',
  };
  
  const colorMap = {
    task: 'text-green-500',
    reward: 'text-[#00C2E0]',
    goal: 'text-purple-500',
    ai: 'text-blue-500',
  };
  
  const newActivity: Activity = {
    id: Date.now().toString(),
    type,
    title,
    points,
    time: new Date().toLocaleString(),
    icon: iconMap[type],
    color: colorMap[type],
  };
  
  // Add to beginning of array (most recent first)
  activities.unshift(newActivity);
  
  // Keep only last 50 activities
  const trimmedActivities = activities.slice(0, 50);
  
  localStorage.setItem('childActivities', JSON.stringify(trimmedActivities));
};

export const getRecentActivities = (limit: number = 10): Activity[] => {
  const activities = JSON.parse(localStorage.getItem('childActivities') || '[]');
  return activities.slice(0, limit);
};

export const clearActivities = () => {
  localStorage.removeItem('childActivities');
};
