// Add this to your authentication logic or middleware
export function checkParentPermission(userRole: string): boolean {
  return userRole === "parent";
}

export function checkChildPermission(userRole: string): boolean {
  return userRole === "child";
}

// Usage in your pages:
// if (!checkParentPermission(currentUser.role)) {
//   redirect("/unauthorized");
// }
