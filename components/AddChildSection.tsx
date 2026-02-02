"use client";

import { useState, useEffect } from "react";

interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  joinedAt: string;
}

export default function AddChildSection() {
  const [familyCode, setFamilyCode] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchFamilyCode();
    fetchChildren();
  }, []);

  const fetchFamilyCode = async () => {
    try {
      const response = await fetch('/api/family/code');
      if (response.ok) {
        const data = await response.json();
        setFamilyCode(data.familyCode);
      }
    } catch (error) {
      console.error('Error fetching family code:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/family/children');
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'FamilyTask Invitation',
        text: `Join our family on FamilyTask! Use this code: ${familyCode}`,
        url: `${window.location.origin}/register`
      });
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="space-y-6">
      {/* Family Code Card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-2">Family Invitation Code</h3>
            <p className="text-white/90 text-sm">
              Share this code with your children to join your family
            </p>
          </div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <i className={`fas ${showCode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-2xl font-bold tracking-wider">
              {showCode ? familyCode : '••••••••••••••••••••'}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyCode}
            className="flex-1 bg-white text-purple-600 py-3 rounded-xl font-bold hover:bg-purple-50 transition flex items-center justify-center gap-2"
          >
            <i className={`fas ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleShareCode}
            className="flex-1 bg-white/20 backdrop-blur-sm py-3 rounded-xl font-bold hover:bg-white/30 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-share-alt"></i>
            Share
          </button>
        </div>

        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm text-white/90">
            <i className="fas fa-info-circle mr-2"></i>
            Children need this code to register. They can sign up at:{' '}
            <span className="font-bold">{window.location.origin}/register</span>
          </p>
        </div>
      </div>

      {/* Children List */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            <i className="fas fa-users text-cyan-500 mr-2"></i>
            Family Members ({children.length})
          </h3>
          <button
            onClick={fetchChildren}
            className="p-2 text-gray-500 hover:text-cyan-500 transition"
            title="Refresh"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p>Loading children...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <p className="text-gray-600 mb-2">No children have joined yet</p>
            <p className="text-sm text-gray-500">
              Share your family code to invite children
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{child.name}</h4>
                    <p className="text-sm text-gray-500">{child.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 text-amber-600 font-bold">
                    <i className="fas fa-star"></i>
                    <span>{child.points || 0} pts</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(child.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <i className="fas fa-question-circle"></i>
          How to add a child
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Share your family code with your child</li>
          <li>Have them visit the registration page</li>
          <li>They select "Child" as their role</li>
          <li>Enter the family code during sign-up</li>
          <li>They'll appear here once registered!</li>
        </ol>
      </div>
    </div>
  );
}
