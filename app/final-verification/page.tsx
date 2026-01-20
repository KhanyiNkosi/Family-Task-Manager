"use client";

import { useState } from "react";

export default function FinalVerificationPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
    console.log(result);
  };

  const runSimpleTest = () => {
    addResult("Starting simple test...");
    
    // Test 1: No role
    addResult("Test 1: Clearing sessionStorage");
    sessionStorage.clear();
    
    addResult("Opening /parent-dashboard with no role");
    setTimeout(() => {
      window.open("/parent-dashboard", "_blank");
      addResult("Expected: Should redirect to /login");
    }, 500);
    
    // Test 2: Parent role
    setTimeout(() => {
      addResult("Test 2: Setting userRole = 'parent'");
      sessionStorage.setItem("userRole", "parent");
      
      addResult("Opening /parent-dashboard as parent");
      setTimeout(() => {
        window.open("/parent-dashboard", "_blank");
        addResult("Expected: Should load parent-dashboard");
      }, 500);
    }, 3000);
    
    // Test 3: Child role
    setTimeout(() => {
      addResult("Test 3: Setting userRole = 'child'");
      sessionStorage.setItem("userRole", "child");
      
      addResult("Opening /parent-dashboard as child");
      setTimeout(() => {
        window.open("/parent-dashboard", "_blank");
        addResult("Expected: Should redirect to /child-dashboard");
        addResult("=== TESTS COMPLETE ===");
        addResult("Check the 3 opened tabs for results");
      }, 500);
    }, 6000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Permission Test</h1>
      
      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
        <h2 className="text-xl font-bold text-green-800 mb-3">The Fix</h2>
        <p className="mb-2"><span className="font-bold">Old (buggy):</span> <code>const role = userRole || "child";</code></p>
        <p className="mb-2"><span className="font-bold">New (fixed):</span> <code>if (userRole === null || userRole === undefined) router.push("/set-role");</code></p>
        <p className="text-green-700">✅ No more automatic conversion of null to "child"!</p>
      </div>
      
      <button 
        onClick={runSimpleTest}
        className="w-full mb-8 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold text-lg"
      >
        Run Permission Tests
      </button>
      
      <div className="bg-white rounded-lg border shadow p-6">
        <h2 className="text-xl font-bold mb-4">Test Progress</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Click "Run Permission Tests" to start</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                <span className="font-mono text-sm">{result}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

