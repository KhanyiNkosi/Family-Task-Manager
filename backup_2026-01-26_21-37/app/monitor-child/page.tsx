"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MonitorChildPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Parent-only access
    const userRole = sessionStorage.getItem("userRole") || "child";
    if (userRole !== "parent") {
      alert("Parent access required");
      router.push("/child-dashboard");
    }
  }, [router]);

  const childStats = [
    { name: "Alex", points: 1250, tasks: 47, level: 8, avatar: "👦" },
    { name: "Emma", points: 980, tasks: 32, level: 6, avatar: "👧" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/parent-dashboard" className="flex items-center gap-2 hover:opacity-80">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Parent Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold">Monitor Children</h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <i className="fas fa-eye text-blue-500 text-xl"></i>
            <div>
              <h3 className="font-bold text-blue-800">Parent View-Only Mode</h3>
              <p className="text-blue-700 text-sm">
                You can monitor child progress but cannot make changes to their dashboard.
                Use the Parent Dashboard to manage tasks and rewards.
              </p>
            </div>
          </div>
        </div>

        {/* Children Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {childStats.map((child, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center text-3xl">
                  {child.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                  <p className="text-gray-600">Child Account</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Points</p>
                  <p className="text-2xl font-bold text-blue-800">{child.points.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Tasks Done</p>
                  <p className="text-2xl font-bold text-green-800">{child.tasks}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">Level</p>
                  <p className="text-2xl font-bold text-purple-800">{child.level}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(child.points % 1000) / 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                  View Tasks
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                  View Rewards
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Parent Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/parent-dashboard"
              className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-center hover:opacity-90"
            >
              <i className="fas fa-tasks text-2xl mb-2"></i>
              <p className="font-bold">Manage Tasks</p>
            </Link>
            <Link 
              href="/rewards-store"
              className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-center hover:opacity-90"
            >
              <i className="fas fa-gift text-2xl mb-2"></i>
              <p className="font-bold">Manage Rewards</p>
            </Link>
            <Link 
              href="/parent-profile"
              className="p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-center hover:opacity-90"
            >
              <i className="fas fa-cog text-2xl mb-2"></i>
              <p className="font-bold">Settings</p>
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 text-sm">
              <i className="fas fa-info-circle mr-2"></i>
              Remember: You're in view-only mode. To make changes, use the Parent Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
