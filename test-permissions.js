// Simulate permission testing
console.log("=== PERMISSION TEST ===");

// Test as Child
sessionStorage.setItem('userRole', 'child');
console.log("Testing as Child...");
console.log("Should access: /child-dashboard, /child-profile, /rewards-store");
console.log("Should NOT access: /parent-dashboard, /parent-profile");

// Test as Parent  
sessionStorage.setItem('userRole', 'parent');
console.log("`nTesting as Parent...");
console.log("Should access: /parent-dashboard, /parent-profile, /child-dashboard (Child View)");

// Clear test data
sessionStorage.removeItem('userRole');
console.log("`nTest complete!");
