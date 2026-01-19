"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AISuggesterPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai">("ai");
  const [dadSkills, setDadSkills] = useState("Grilling\nFixing things\nLawn mowing");
  const [availableTasks, setAvailableTasks] = useState("Take out the trash\nSet the table\nClear the table\nFeed the pet\nHelp with groceries");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      title: "Help with groceries",
      member: "Dad",
      avatar: "https://i.pravatar.cc/100?u=1",
      description: "As an adult, he can manage heavier items and assist with shopping logistics, aligning with his practical skills.",
      points: 20
    },
    {
      id: 2,
      title: "Lawn mowing",
      member: "Dad",
      avatar: "https://i.pravatar.cc/100?u=1",
      description: "Matches his skill of 'Lawn mowing' perfectly. Good physical activity and outdoor task.",
      points: 25
    },
    {
      id: 3,
      title: "Set the table",
      member: "Child",
      avatar: "https://i.pravatar.cc/100?u=2",
      description: "Simple, routine task suitable for younger family members to build responsibility.",
      points: 10
    },
    {
      id: 4,
      title: "Feed the pet",
      member: "Child",
      avatar: "https://i.pravatar.cc/100?u=2",
      description: "Caring for pets teaches responsibility and routine. Great for developing empathy.",
      points: 15
    }
  ]);

  const pathname = usePathname();
  
  const familyMembers = [
    { name: "Dad", age: 42, icon: "fas fa-shield-alt", avatar: "https://i.pravatar.cc/100?u=1" },
    { name: "Mom", age: 40, icon: "fas fa-heart", avatar: "https://i.pravatar.cc/100?u=3" },
    { name: "Child", age: 12, icon: "fas fa-child", avatar: "https://i.pravatar.cc/100?u=2" }
  ];

  const handleGenerateSuggestions = () => {
    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Add new AI-generated suggestions
      const newSuggestions = [
        {
          id: suggestions.length + 1,
          title: "Take out the trash",
          member: "Dad",
          avatar: "https://i.pravatar.cc/100?u=1",
          description: "Regular chore that fits well with 'Fixing things' skill - requires coordination and timing.",
          points: 15
        },
        {
          id: suggestions.length + 2,
          title: "Clear the table",
          member: "Child",
          avatar: "https://i.pravatar.cc/100?u=2",
          description: "Teamwork task that helps after meals. Good for developing coordination skills.",
          points: 8
        }
      ];
      
      setSuggestions([...suggestions, ...newSuggestions]);
      setIsGenerating(false);
      alert("AI suggestions generated! Added 2 new task matches.");
    }, 2000);
  };

  const handleAddToTaskList = (suggestionId: number) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      alert(`Added "${suggestion.title}" to ${suggestion.member}'s task list for ${suggestion.points} points!`);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="sidebar w-70 bg-[#006372] text-white h-screen fixed p-8">
        <div className="logo text-2xl font-black mb-10 flex items-center gap-2.5">
          <i className="fas fa-smile"></i> FamilyTask
        </div>
        
        <Link
          href="/parent-dashboard"
          className="nav-link flex items-center gap-3 px-4 py-3 text-white/70 no-underline rounded-xl mb-2 hover:bg-white/5 transition-colors"
        >
          <i className="fas fa-home"></i> Home
        </Link>
        <div 
          className="nav-link active flex items-center gap-3 px-4 py-3 text-white no-underline rounded-xl mb-2 bg-white/10 cursor-pointer"
        >
          <i className="fas fa-brain"></i> AI Suggester
        </div>
        <Link
          href="/rewards-store"
          className="nav-link flex items-center gap-3 px-4 py-3 text-white/70 no-underline rounded-xl mb-2 hover:bg-white/5 transition-colors"
        >
          <i className="fas fa-gift"></i> Rewards Store
        </Link>
        <Link
          href="/profile"
          className="nav-link flex items-center gap-3 px-4 py-3 text-white/70 no-underline rounded-xl mb-2 hover:bg-white/5 transition-colors"
        >
          <i className="fas fa-user"></i> Profile
        </Link>
      </div>

      {/* Main Content */}
      <div className="main-content ml-70 w-[calc(100%-280px)] p-10">
        {/* AI Suggester Tab */}
        <div className="ai-view">
          <h1 className="ai-title text-2xl font-black text-[#00C2E0] mb-3">
            AI Task Suggester
          </h1>
          <p className="text-[#64748b] mb-6 text-base">
            Let our AI help find the right tasks for each family member based on their skills, habits, and age.
          </p>

          <h2 className="ai-subtitle text-xl font-bold text-[#00C2E0] mb-5">
            Family & Tasks
          </h2>
          
          {/* AI Input Container */}
          <div className="ai-input-container bg-[#f8fafc] rounded-2xl p-6 border border-[#e2e8f0] mb-8">
            <div className="text-[#00C2E0] font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-microchip"></i> Input for AI
            </div>
            
            {/* Family Members Input */}
            <div className="space-y-6 mb-6">
              {familyMembers.map((member) => (
                <div key={member.name} className="mb-5">
                  <div className="member-info flex items-center gap-2 text-[#00C2E0] font-semibold mb-3">
                    <i className={member.icon}></i> 
                    {member.name} 
                    <small className="text-[#64748b] font-normal">Age: {member.age}</small>
                  </div>
                  <label className="textarea-label block text-sm font-medium text-gray-700 mb-2">
                    Skills (one per line)
                  </label>
                  <textarea 
                    className="ai-textarea w-full rounded-xl border border-[#cbd5e1] px-4 py-3 font-inherit mb-4 resize-none"
                    rows={3}
                    placeholder="Enter skills..."
                    defaultValue={member.name === "Dad" ? dadSkills : ""}
                    onChange={(e) => {
                      if (member.name === "Dad") setDadSkills(e.target.value);
                    }}
                  />
                </div>
              ))}
            </div>

            <label className="textarea-label block font-bold text-gray-700 mb-2">
              Available Tasks (one per line)
            </label>
            <textarea 
              className="ai-textarea w-full rounded-xl border border-[#cbd5e1] px-4 py-3 font-inherit mb-6 resize-none"
              rows={5}
              value={availableTasks}
              onChange={(e) => setAvailableTasks(e.target.value)}
            />

            <button 
              onClick={handleGenerateSuggestions}
              disabled={isGenerating}
              className="btn-generate w-full bg-[#00C2E0] text-white border-none py-4 rounded-xl font-bold text-base cursor-pointer flex justify-center items-center gap-2.5 hover:bg-[#00A8C2] transition-colors disabled:opacity-70"
            >
              <i className="fas fa-magic"></i>
              {isGenerating ? "Generating AI Suggestions..." : "Generate Suggestions"}
            </button>
          </div>

          <h2 className="ai-subtitle text-xl font-bold text-[#00C2E0] mb-5">
            Suggestions ({suggestions.length})
          </h2>

          {/* Suggestions Grid */}
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-card bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#f1f5f9]">
                <div className="suggestion-header flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">{suggestion.title}</h3>
                  <div className="member-info flex items-center gap-2 text-[#00C2E0] font-semibold">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img 
                        src={suggestion.avatar} 
                        alt={suggestion.member}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {suggestion.member}
                  </div>
                </div>
                <p className="text-[#64748b] text-sm mb-4 leading-relaxed">
                  {suggestion.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-[#00C2E0] font-bold">
                    <i className="fas fa-star mr-1"></i> {suggestion.points} points
                  </div>
                  <button 
                    onClick={() => handleAddToTaskList(suggestion.id)}
                    className="btn-add bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-1.5 hover:bg-[#00C2E0] hover:text-white hover:border-[#00C2E0] transition-colors"
                  >
                    <i className="fas fa-plus"></i> Add to Task List
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

