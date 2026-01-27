"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoTestPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("=== AUTO TEST STARTING ===");
    
    // Clear storage
    sessionStorage.clear();
    console.log("1. Cleared sessionStorage");
    
    // Test 1: No role
    console.log("2. Testing with NO role...");
    console.log("   Opening parent-dashboard...");
    setTimeout(() => {
      window.open("/parent-dashboard", "_blank");
    }, 1000);
    
    // Test 2: Parent role
    setTimeout(() => {
      console.log("3. Setting userRole = 'parent'...");
      sessionStorage.setItem("userRole", "parent");
      
      console.log("   Opening parent-dashboard...");
      setTimeout(() => {
        window.open("/parent-dashboard", "_blank");
      }, 1000);
    }, 3000);
    
    // Test 3: Child role
    setTimeout(() => {
      console.log("4. Setting userRole = 'child'...");
      sessionStorage.setItem("userRole", "child");
      
      console.log("   Opening parent-dashboard...");
      setTimeout(() => {
        window.open("/parent-dashboard", "_blank");
        console.log("=== AUTO TEST COMPLETE ===");
        console.log("Check the 3 opened tabs for results!");
      }, 1000);
    }, 6000);
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auto Test Running</h1>
      <p className="text-gray-600">Check browser console for test progress.</p>
      <p className="mt-2">Three tabs will open showing the test results.</p>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold text-blue-800 mb-2">Test Sequence:</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Tab 1: No role → Should redirect to /login</li>
          <li>Tab 2: Parent role → Should load parent-dashboard</li>
          <li>Tab 3: Child role → Should redirect to child-dashboard</li>
        </ol>
      </div>
    </div>
  );
}

