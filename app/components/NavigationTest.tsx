// app/components/NavigationTest.tsx - Quick test component
"use client";

import Link from "next/link";

export default function NavigationTest() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-white p-4 rounded-xl shadow-lg border">
        <summary className="font-semibold text-[#00C2E0] cursor-pointer">
          Quick Navigation Test
        </summary>
        <div className="mt-2 space-y-2">
          <div className="text-sm font-semibold text-gray-600">Public Pages:</div>
          <Link href="/" className="block text-[#00C2E0] hover:underline text-sm">Home</Link>
          <Link href="/about" className="block text-[#00C2E0] hover:underline text-sm">About</Link>
          
          <div className="text-sm font-semibold text-gray-600 mt-3">Child Pages:</div>
          <Link href="/child-dashboard" className="block text-[#00C2E0] hover:underline text-sm">Child Dashboard</Link>
          
          <div className="text-sm font-semibold text-gray-600 mt-3">Parent Pages:</div>
          <Link href="/ai-suggester" className="block text-[#00C2E0] hover:underline text-sm">AI Suggester</Link>
          <Link href="/profile" className="block text-[#00C2E0] hover:underline text-sm">Profile</Link>
          <Link href="/parent-dashboard" className="block text-[#00C2E0] hover:underline text-sm">Parent Dashboard</Link>
          <Link href="/rewards-store" className="block text-[#00C2E0] hover:underline text-sm">Rewards Store</Link>
          <Link href="/settings" className="block text-[#00C2E0] hover:underline text-sm">Settings</Link>
        </div>
      </details>
    </div>
  );
}
