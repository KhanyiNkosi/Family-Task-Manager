"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoleTestPage() {
  const [currentRole, setCurrentRole] = useState("");
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

    useEffect(() => {
    setIsClient(true);
    // Check current role on client side only
    const role = sessionStorage.getItem("userRole");
    
    // If no role is set, automatically set to "parent" for easy testing
    if (role === null || role === undefined || role === "not set") {
      console.log("No role set. Auto-setting to 'parent' for testing.");
      sessionStorage.setItem("userRole", "parent");
      setCurrentRole("parent");
    } else {
      setCurrentRole(role);
    }
  }, []);

  const setRole = (role: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userRole", role);
      setCurrentRole(role);
      alert(`Role set to: ${role}`);
    }
  };

  const checkRole = () => {
    if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole") || "not set";
      alert(`Current role: ${role}`);
      setCurrentRole(role);
    }
  };

  const goToParentDashboard = () => {
    router.push("/parent-dashboard");
  };

  const goToParentProfile = () => {
    router.push("/parent-profile");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Role Permission Test</h1>
      
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Current Role</h2>
        <p className="text-lg font-bold text-blue-600">
          {isClient ? currentRole : "Loading..."}
        </p>
        <button 
          onClick={checkRole}
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh Role
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800 mb-2">Set as Parent</h3>
          <button 
            onClick={() => setRole("parent")}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold"
          >
            Set Parent Role
          </button>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Set as Child</h3>
          <button 
            onClick={() => setRole("child")}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
          >
            Set Child Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">Test Parent Dashboard</h3>
          <button 
            onClick={goToParentDashboard}
            className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-bold"
          >
            Go to Parent Dashboard
          </button>
          <p className="text-sm text-gray-600 mt-2">Should work only with "parent" role</p>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-2">Test Parent Profile</h3>
          <button 
            onClick={goToParentProfile}
            className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-bold"
          >
            Go to Parent Profile
          </button>
          <p className="text-sm text-gray-600 mt-2">Should work only with "parent" role</p>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-2">Debug Info</h3>
        <div className="text-sm font-mono bg-black text-green-400 p-3 rounded">
          <p>To test in browser console:</p>
          <p>// Set parent role</p>
          <p>sessionStorage.setItem("userRole", "parent")</p>
          <br/>
          <p>// Set child role</p>
          <p>sessionStorage.setItem("userRole", "child")</p>
          <br/>
          <p>// Check current role</p>
          <p>console.log("Role:", sessionStorage.getItem("userRole"))</p>
        </div>
      </div>
    </div>
  );
}

