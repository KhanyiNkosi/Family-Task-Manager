// app/navigation.ts - Central navigation configuration
export const NAVIGATION_CONFIG = {
  // Public pages
  home: "/",
  about: "/about",
  login: "/login",
  signup: "/signup",
  
  // Child dashboard pages
  childDashboard: "/child-dashboard",
  childHome: "/child-dashboard?tab=home",
  childRewards: "/child-dashboard?tab=rewards",
  childAI: "/child-dashboard?tab=ai",
  childSettings: "/child-dashboard?tab=settings",
  childProfile: "/child-dashboard?tab=profile",
  
  // Parent dashboard pages
  parentDashboard: "/parent-dashboard",
  parentHome: "/parent-dashboard?tab=home",
  parentAI: "/ai-suggester",
  parentRewards: "/rewards-store",
  parentCalendar: "/calendar",
  parentFamily: "/family-members",
  parentSettings: "/settings",
  parentProfile: "/profile",
};

// Helper function to get navigation links
export function getNavigation(type: "child" | "parent") {
  if (type === "child") {
    return {
      home: NAVIGATION_CONFIG.childHome,
      dashboard: NAVIGATION_CONFIG.childDashboard,
      rewards: NAVIGATION_CONFIG.childRewards,
      ai: NAVIGATION_CONFIG.childAI,
      settings: NAVIGATION_CONFIG.childSettings,
      profile: NAVIGATION_CONFIG.childProfile,
    };
  }
  
  return {
    home: NAVIGATION_CONFIG.parentHome,
    dashboard: NAVIGATION_CONFIG.parentDashboard,
    ai: NAVIGATION_CONFIG.parentAI,
    rewards: NAVIGATION_CONFIG.parentRewards,
    calendar: NAVIGATION_CONFIG.parentCalendar,
    family: NAVIGATION_CONFIG.parentFamily,
    settings: NAVIGATION_CONFIG.parentSettings,
    profile: NAVIGATION_CONFIG.parentProfile,
  };
}
