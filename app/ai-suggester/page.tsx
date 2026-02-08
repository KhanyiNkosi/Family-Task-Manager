"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// TODO: Add proper authentication check here
// For now, this page is parent-only
// In a real app, check user role/type before rendering
type Suggestion = {
  id: number;
  title: string;
  category: string;
  points: number;
  description: string;
  generatedByAI: boolean;
  createdAt: string;
};

type ChatMessage = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

export default function AlSuggestorPage() {
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: 1, title: 'Weekend Cleanup Challenge', category: 'Family Activity', points: 200, description: 'Turn cleaning into a game with timed challenges', generatedByAI: false, createdAt: '2026-01-17' },
    { id: 2, title: 'Homework Helper System', category: 'Education', points: 150, description: 'Pair older kids with younger ones for homework help', generatedByAI: false, createdAt: '2026-01-17' },
    { id: 3, title: 'Meal Prep Team', category: 'Cooking', points: 180, description: 'Assign different meal prep tasks to family members', generatedByAI: false, createdAt: '2026-01-17' },
    { id: 4, title: 'Green Thumb Garden', category: 'Outdoor', points: 250, description: 'Create a family garden with watering schedules', generatedByAI: false, createdAt: '2026-01-17' },
    { id: 5, title: 'Digital Detox Day', category: 'Wellness', points: 100, description: 'Screen-free day with alternative activities', generatedByAI: false, createdAt: '2026-01-17' },
    { id: 6, title: 'Charity Together', category: 'Community', points: 300, description: 'Family volunteer activity with bonus points', generatedByAI: false, createdAt: '2026-01-17' },
  ]);

  const [prompt, setPrompt] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'Hi! I\'m your FamilyTask AI Assistant. I can help you generate task ideas, suggest family activities, balance points, and solve family management challenges. What would you like help with today?', sender: 'ai', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);

  // Modal states
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });

  // Modal helper functions
  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
          resolve(true);
        },
      });
      setTimeout(() => {
        (window as any)._confirmCancelHandler = () => resolve(false);
      }, 0);
    });
  };

  useEffect(() => {
    // Check if user should be here (parent-only for now)
    const userRole = localStorage.getItem('familytask-user-role') || sessionStorage.getItem('userRole');
    
    if (userRole === 'child') {
      showAlert('AI Suggester is for parents only!', "warning");
      setTimeout(() => router.push('/child-dashboard'), 1500);
      return;
    }
    
    // Scroll chat to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, router]);

  const generateSuggestions = () => {
    if (prompt.trim() === '') {
      showAlert('Please enter a prompt first!', "warning");
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      text: prompt,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Simulate AI thinking
    const thinkingMessage: ChatMessage = {
      id: chatMessages.length + 2,
      text: '🤔 Thinking about your request...',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, userMessage, thinkingMessage]);

    // Simulate AI response after delay
    setTimeout(() => {
      const newSuggestion: Suggestion = {
        id: suggestions.length + 1,
        title: `AI Idea: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
        category: 'AI Generated',
        points: Math.floor(Math.random() * 100) + 50,
        description: `Based on your prompt: "${prompt}". This is a family activity designed to engage everyone.`,
        generatedByAI: true,
        createdAt: new Date().toISOString().split('T')[0]
      };

      const aiResponse: ChatMessage = {
        id: chatMessages.length + 3,
        text: `I've generated a new suggestion based on your prompt! Check out "${newSuggestion.title}" in the suggestions list.`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSuggestions([...suggestions, newSuggestion]);
      setChatMessages(prev => [...prev.slice(0, -1), aiResponse]);
      setPrompt('');
    }, 2000);
  };

  const handleChatSend = () => {
    if (chatInput.trim() === '') return;

    // Add user message
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Simulate AI response
    const aiResponse: ChatMessage = {
      id: chatMessages.length + 2,
      text: `I understand you're asking about "${chatInput}". As your FamilyTask AI, I can help you create engaging tasks, suggest point values, and design family activities. Try using the suggestion generator above for specific task ideas!`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, userMessage, aiResponse]);
    setChatInput('');
  };

  const saveSuggestion = (suggestion: Suggestion) => {
    const saved = JSON.parse(localStorage.getItem('familytask-saved-suggestions') || '[]');
    saved.push({ ...suggestion, savedAt: new Date().toLocaleString() });
    localStorage.setItem('familytask-saved-suggestions', JSON.stringify(saved));
    showAlert(`Saved "${suggestion.title}" to your suggestions!`, "success");
  };

  const deleteSuggestion = async (id: number) => {
    const confirmed = await showConfirm('Are you sure you want to delete this suggestion?');
    if (confirmed) {
      setSuggestions(suggestions.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH FAMILYTASK LOGO - SAME AS AI-TASKS PAGE */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* FAMILYTASK LOGO */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-smile text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">FamilyTask</h1>
                  <p className="text-white/80 text-sm">AI Task Suggester</p>
                </div>
              </Link>
            </div>

            {/* NAVIGATION */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Link
                  href="/ai-tasks"
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                >
                  <i className="fas fa-tasks"></i>
                  View AI Tasks
                </Link>
                <Link
                  href="/parent-dashboard"
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* EXISTING CONTENT - NO CHANGES BELOW THIS LINE */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#006372]">AI Task Suggester</h2>
              <p className="text-gray-600 mt-2">Generate smart task suggestions for your family with AI assistance</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-[#00C2E0]/30 px-6 py-3 rounded-xl">
                <div className="text-sm text-gray-600">AI Suggestions Created</div>
                <div className="text-2xl font-bold text-[#006372]">{suggestions.filter(s => s.generatedByAI).length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - SUGGESTION GENERATOR */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Generate New Suggestions</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What kind of tasks are you looking for?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    rows={4}
                    placeholder="E.g., 'indoor activities for rainy days', 'educational tasks for teenagers', 'ways to encourage sibling cooperation'..."
                  />
                </div>

                <button
                  onClick={generateSuggestions}
                  className="w-full bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-3"
                >
                  <i className="fas fa-robot text-xl"></i>
                  Generate AI Suggestions
                </button>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-lightbulb text-blue-500 text-xl mt-1"></i>
                    <div>
                      <h4 className="font-bold text-blue-800">Tips for Best Results</h4>
                      <ul className="text-blue-700 text-sm mt-2 space-y-1">
                        <li>• Be specific about age groups, interests, or challenges</li>
                        <li>• Mention if you want indoor/outdoor activities</li>
                        <li>• Specify if tasks should be individual or group-based</li>
                        <li>• Include any special requirements or constraints</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHAT ASSISTANT */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <i className="fas fa-comments text-[#00C2E0]"></i>
                  AI Chat Assistant
                </h3>

                <div 
                  ref={chatContainerRef}
                  className="h-80 overflow-y-auto mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
                >
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <i className={`fas ${message.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                          <span className="text-xs opacity-75">
                            {message.sender === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-xs opacity-50 ml-auto">{message.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                    placeholder="Ask the AI anything about family tasks..."
                  />
                  <button
                    onClick={handleChatSend}
                    className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - SUGGESTIONS LIST */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">All Suggestions</h3>
                  <div className="text-sm text-gray-600">
                    {suggestions.length} total suggestions
                  </div>
                </div>

                <div className="space-y-6">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-teal-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              suggestion.category === 'Family Activity' ? 'bg-purple-100 text-purple-800' :
                              suggestion.category === 'Education' ? 'bg-green-100 text-green-800' :
                              suggestion.category === 'Cooking' ? 'bg-yellow-100 text-yellow-800' :
                              suggestion.category === 'Outdoor' ? 'bg-blue-100 text-blue-800' :
                              suggestion.category === 'Wellness' ? 'bg-pink-100 text-pink-800' :
                              suggestion.category === 'Community' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {suggestion.category}
                            </span>
                            {suggestion.generatedByAI && (
                              <span className="px-2 py-1 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white text-xs rounded-full">
                                <i className="fas fa-robot mr-1"></i> AI Generated
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{suggestion.title}</h4>
                          <p className="text-gray-600">{suggestion.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#00C2E0]">+{suggestion.points}</div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          Created: {suggestion.createdAt}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => saveSuggestion(suggestion)}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white rounded-lg font-medium hover:opacity-90 transition"
                          >
                            <i className="fas fa-save mr-2"></i>
                            Save
                          </button>
                          <button
                            onClick={() => deleteSuggestion(suggestion.id)}
                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-[#00C2E0]/30">
                  <h4 className="text-lg font-bold text-[#006372] mb-4">How to Use AI Suggestions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-xl">
                      <div className="text-[#00C2E0] text-2xl mb-2">1</div>
                      <h5 className="font-bold text-gray-800 mb-1">Generate Ideas</h5>
                      <p className="text-gray-600 text-sm">Use the generator or chat to get task ideas</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl">
                      <div className="text-[#00C2E0] text-2xl mb-2">2</div>
                      <h5 className="font-bold text-gray-800 mb-1">Save & Review</h5>
                      <p className="text-gray-600 text-sm">Save suggestions you like for later review</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl">
                      <div className="text-[#00C2E0] text-2xl mb-2">3</div>
                      <h5 className="font-bold text-gray-800 mb-1">Create Tasks</h5>
                      <p className="text-gray-600 text-sm">Convert suggestions into actual family tasks</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl">
                      <div className="text-[#00C2E0] text-2xl mb-2">4</div>
                      <h5 className="font-bold text-gray-800 mb-1">Assign & Track</h5>
                      <p className="text-gray-600 text-sm">Assign tasks to family members and track progress</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER WITH LOGO - MATCHING AI-TASKS STYLE */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-lg flex items-center justify-center">
                <i className="fas fa-smile text-white"></i>
              </div>
              <div>
                <div className="font-bold text-[#006372]">FamilyTask AI</div>
                <div className="text-sm text-gray-600">Smart family task generation</div>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              AI-powered suggestions to make family management easier and more engaging
            </div>
          </div>
        </div>
      </footer>

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setAlertModal({ ...alertModal, show: false })}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              alertModal.type === "success" ? "bg-green-100" :
              alertModal.type === "error" ? "bg-red-100" :
              alertModal.type === "warning" ? "bg-yellow-100" :
              "bg-blue-100"
            }`}>
              <span className="text-3xl">{
                alertModal.type === "success" ? "✓" :
                alertModal.type === "error" ? "✕" :
                alertModal.type === "warning" ? "⚠" :
                "ℹ"
              }</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertModal.type === "success" ? "text-green-600" :
              alertModal.type === "error" ? "text-red-600" :
              alertModal.type === "warning" ? "text-yellow-600" :
              "text-blue-600"
            }`}>
              {alertModal.type === "success" ? "Success!" :
               alertModal.type === "error" ? "Error" :
               alertModal.type === "warning" ? "Warning" :
               "Information"}
            </h3>
            <p className="text-gray-700 text-center mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                alertModal.type === "success" ? "bg-green-500 hover:bg-green-600" :
                alertModal.type === "error" ? "bg-red-500 hover:bg-red-600" :
                alertModal.type === "warning" ? "bg-yellow-500 hover:bg-yellow-600" :
                "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">?</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">Confirm Action</h3>
            <p className="text-gray-700 text-center mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white hover:opacity-90 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
