"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState<number | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const categories = ['All', 'Family Activity', 'Education', 'Cooking', 'Outdoor', 'Wellness', 'Community'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const samplePrompts = [
    'Fun educational activities for 8 year old',
    'Weekend projects for the whole family',
    'Chores that teach responsibility',
    'Creative rainy day ideas',
    'Outdoor learning activities',
  ];

  const chatSampleQuestions = [
    'How do I motivate my teenager to do chores?',
    'Suggest activities for a 6 year old',
    'What are good rewards for completing homework?',
    'How to balance points between siblings?',
  ];

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Mock AI API function for suggestions
  const generateAISuggestions = async (userPrompt: string): Promise<Suggestion[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiCategories = ['Family Activity', 'Education', 'Cooking', 'Outdoor', 'Wellness', 'Community'];
    const adjectives = ['Smart', 'Creative', 'Fun', 'Educational', 'Interactive', 'Engaging', 'Teamwork'];
    const nouns = ['Challenge', 'System', 'Project', 'Activity', 'Mission', 'Adventure', 'Quest'];
    
    const newSuggestions: Suggestion[] = [];
    const numSuggestions = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numSuggestions; i++) {
      const category = aiCategories[Math.floor(Math.random() * aiCategories.length)];
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      
      const descriptions = [
        `A ${adjective.toLowerCase()} ${noun.toLowerCase()} that ${userPrompt.toLowerCase()}`,
        `Based on your interest in "${userPrompt}", this activity promotes teamwork and learning.`,
        `Perfect for families looking to ${userPrompt.toLowerCase()} while having fun together.`,
        `This ${category.toLowerCase()} suggestion combines learning with enjoyment for all ages.`
      ];
      
      newSuggestions.push({
        id: suggestions.length + i + 1,
        title: `${adjective} ${noun}: ${category}`,
        category,
        points: 150 + Math.floor(Math.random() * 150),
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        generatedByAI: true,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    return newSuggestions;
  };

  // Mock AI Chat Response function
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = [
      `Based on your question about "${userMessage}", I recommend creating a structured routine with clear expectations. Consider using a point system where tasks earn rewards that your child values.`,
      `For "${userMessage}", try turning activities into games. For example, set a timer and see how much can be accomplished in 15 minutes, with bonus points for beating the clock.`,
      `Regarding "${userMessage}", balance is key. Make sure tasks are age-appropriate and mix necessary chores with fun activities. Consider a weekly family meeting to discuss and assign tasks together.`,
      `I suggest for "${userMessage}" to create a visual chart with tasks and rewards. Children respond well to visual cues and immediate feedback. You could also try a sticker chart for younger kids.`,
      `For "${userMessage}", consider implementing a "choice board" where children can select from a list of approved activities. This gives them autonomy while ensuring tasks get done.`,
      `My advice for "${userMessage}" is to connect tasks to natural consequences and rewards. For example, "When your homework is done, you can have screen time" creates clear cause and effect.`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleGenerateSuggestions = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt first!', 'error');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const newSuggestions = await generateAISuggestions(prompt);
      setSuggestions(prev => [...newSuggestions, ...prev]);
      showNotification(`🎉 Generated ${newSuggestions.length} new AI suggestions!`, 'success');
      setPrompt("");
    } catch (error) {
      showNotification('Failed to generate suggestions. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) {
      showNotification('Please type a message first!', 'error');
      return;
    }
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);
    
    try {
      // Get AI response
      const aiResponse = await generateAIResponse(chatInput);
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: chatMessages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      // If the message is about generating tasks, also create suggestions
      if (chatInput.toLowerCase().includes('suggest') || chatInput.toLowerCase().includes('idea') || chatInput.toLowerCase().includes('activity')) {
        // Automatically generate suggestions based on chat
        setTimeout(async () => {
          const newSuggestions = await generateAISuggestions(chatInput);
          setSuggestions(prev => [...newSuggestions, ...prev]);
          
          // Add a follow-up message about the generated suggestions
          const followUpMessage: ChatMessage = {
            id: chatMessages.length + 3,
            text: `I've also generated ${newSuggestions.length} task suggestions based on our conversation! You can find them in the suggestions list above.`,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          setChatMessages(prev => [...prev, followUpMessage]);
        }, 500);
      }
    } catch (error) {
      showNotification('Failed to get AI response. Please try again.', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUseChatQuestion = (question: string) => {
    setChatInput(question);
    // Auto-focus the chat input
    setTimeout(() => {
      const chatInputEl = document.getElementById('chat-input');
      if (chatInputEl) {
        chatInputEl.focus();
      }
    }, 100);
  };

  const handleUseSuggestion = async (suggestionId: number) => {
    setIsCreatingTask(suggestionId);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      const existingTasks = JSON.parse(localStorage.getItem('familytask-created-tasks') || '[]');
      const newTask = {
        id: Date.now(),
        title: suggestion.title,
        category: suggestion.category,
        points: suggestion.points,
        description: suggestion.description,
        assignedTo: 'Unassigned',
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'ai-suggester'
      };
      
      existingTasks.push(newTask);
      localStorage.setItem('familytask-created-tasks', JSON.stringify(existingTasks));
      
      showNotification(`✅ Task "${suggestion.title}" created! Assign it from the dashboard.`, 'success');
    }
    
    setIsCreatingTask(null);
  };

  const handleSaveSuggestion = (suggestionId: number) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      const savedSuggestions = JSON.parse(localStorage.getItem('familytask-saved-suggestions') || '[]');
      
      if (!savedSuggestions.some((s: Suggestion) => s.id === suggestionId)) {
        savedSuggestions.push(suggestion);
        localStorage.setItem('familytask-saved-suggestions', JSON.stringify(savedSuggestions));
        showNotification(`💾 "${suggestion.title}" saved to your favorites!`, 'success');
      } else {
        showNotification('This suggestion is already saved.', 'error');
      }
    }
  };

  const handleUseSamplePrompt = (sample: string) => {
    setPrompt(sample);
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredSuggestions = selectedCategory === 'All' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const aiGeneratedCount = suggestions.filter(s => s.generatedByAI).length;
  const totalPointsValue = suggestions.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-[#D8EEFE] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Notification Toast */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl animate-slideIn ${
            notification.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'} text-xl`}></i>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#00C2E0] rounded-full relative flex justify-center items-center overflow-hidden">
              <div className="eyes absolute top-5 w-10 h-3 flex justify-between">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="smile absolute bottom-4 w-8 h-4 border-b-3 border-white rounded-b-full"></div>
            </div>
            <h1 className="text-5xl font-black text-[#006372]">AI Family Suggester</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get personalized task suggestions powered by AI. Perfect for keeping kids engaged and learning!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Suggestions', value: suggestions.length.toString(), color: 'bg-[#00C2E0]', icon: 'fa-lightbulb' },
            { label: 'AI Generated', value: aiGeneratedCount.toString(), color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: 'fa-robot' },
            { label: 'Total Points Value', value: totalPointsValue.toString(), color: 'bg-[#006372]', icon: 'fa-star' },
            { label: 'Chat Messages', value: chatMessages.length.toString(), color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: 'fa-comments' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-5 text-center border border-gray-100">
              <div className={`inline-flex w-12 h-12 ${stat.color} rounded-full items-center justify-center text-white mb-3`}>
                <i className={`fas ${stat.icon} text-xl`}></i>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* AI Prompt Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask AI for Suggestions</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Describe what you're looking for:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Educational activities for 8 year old that teach science'"
              className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Sample Prompts */}
          <div className="mb-6">
            <p className="text-gray-600 mb-3">Try one of these prompts:</p>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleUseSamplePrompt(sample)}
                  className="px-4 py-2 bg-[#00C2E0]/10 text-[#006372] rounded-lg hover:bg-[#00C2E0]/20 transition-colors text-sm font-medium"
                >
                  <i className="fas fa-magic mr-2"></i>
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Generating AI Suggestions...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                Generate Task Ideas
              </>
            )}
          </button>

          <p className="text-gray-500 text-sm mt-4 text-center">
            Our AI will create personalized task suggestions based on your prompt
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-filter text-gray-500"></i>
            <span className="text-gray-700 font-medium">Filter by:</span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C2E0]"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredSuggestions.length} of {suggestions.length} suggestions
          </div>
        </div>

        {/* AI Suggestions Grid */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Personalized Suggestions</h2>
            <div className="text-sm text-gray-500">
              {aiGeneratedCount > 0 && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  <i className="fas fa-robot mr-1"></i>
                  {aiGeneratedCount} AI Generated
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border ${
                  suggestion.generatedByAI 
                    ? 'border-purple-200 border-l-4 border-l-purple-500' 
                    : 'border-gray-100'
                } hover:shadow-2xl transition-all duration-300`}
              >
                <div className="p-6">
                  {suggestion.generatedByAI && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">
                      <i className="fas fa-robot"></i>
                      AI Generated
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{suggestion.title}</h3>
                    <span className="px-3 py-1 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-full text-sm font-bold shadow">
                      +{suggestion.points} pts
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#00C2E0]/10 text-[#006372] rounded-full text-sm font-medium">
                      <i className="fas fa-tag mr-1"></i>
                      {suggestion.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{suggestion.description}</p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUseSuggestion(suggestion.id)}
                      disabled={isCreatingTask === suggestion.id}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-lg hover:opacity-90 font-medium transition-all disabled:opacity-50"
                    >
                      {isCreatingTask === suggestion.id ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          Use This
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleSaveSuggestion(suggestion.id)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Save for later"
                    >
                      <i className="fas fa-bookmark"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Chat - NOW FULLY INTERACTIVE! */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">AI Assistant Chat</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#00C2E0]/10 text-[#006372] rounded-full text-sm">
              <i className="fas fa-circle text-xs text-green-500"></i>
              <span>AI Assistant Online</span>
            </div>
          </div>
          
          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef}
            className="mb-6 h-80 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200"
          >
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-br-none'
                        : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === 'ai' && (
                        <div className="w-6 h-6 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] rounded-full flex items-center justify-center text-white text-xs">
                          <i className="fas fa-robot"></i>
                        </div>
                      )}
                      <span className="text-xs font-medium opacity-80">
                        {message.sender === 'ai' ? 'FamilyTask AI' : 'You'}
                      </span>
                      <span className="text-xs opacity-60">{message.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl p-4 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-bl-none border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] rounded-full flex items-center justify-center text-white text-xs">
                        <i className="fas fa-robot"></i>
                      </div>
                      <span className="text-xs font-medium opacity-80">FamilyTask AI</span>
                      <span className="text-xs opacity-60">typing...</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="flex space-x-4">
            <input
              id="chat-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Ask me anything about family task management..."
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
              disabled={isChatLoading}
            />
            <button
              onClick={handleSendChatMessage}
              disabled={isChatLoading || !chatInput.trim()}
              className="px-6 py-4 bg-gradient-to-r from-[#00C2E0] to-[#00A3CC] text-white rounded-xl hover:opacity-90 font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChatLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send
                </>
              )}
            </button>
          </div>
          
          {/* Sample Chat Questions */}
          <div className="mt-4">
            <p className="text-gray-600 mb-2 text-sm">Try asking:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {chatSampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleUseChatQuestion(question)}
                  className="p-3 bg-[#00C2E0]/5 text-[#006372] rounded-lg hover:bg-[#00C2E0]/10 transition-colors text-left border border-[#00C2E0]/10 text-sm"
                >
                  <i className="fas fa-comment-dots mr-2 text-[#00C2E0]"></i>
                  &quot;{question}&quot;
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-500">
            <i className="fas fa-info-circle mr-1"></i>
            The AI assistant can also automatically generate task suggestions based on your conversation
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-3">How Our AI Works</h3>
          <p className="opacity-90 mb-6">
            Our AI analyzes thousands of successful family patterns to suggest activities 
            that promote teamwork, learning, and fun while building positive habits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <i className="fas fa-brain text-3xl mb-3"></i>
              <div className="font-bold text-lg mb-2">Smart Analysis</div>
              <p className="text-sm opacity-90">Learns from successful family patterns</p>
            </div>
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <i className="fas fa-comments text-3xl mb-3"></i>
              <div className="font-bold text-lg mb-2">Interactive Chat</div>
              <p className="text-sm opacity-90">Real-time conversation with AI assistant</p>
            </div>
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <i className="fas fa-star text-3xl mb-3"></i>
              <div className="font-bold text-lg mb-2">Reward Optimized</div>
              <p className="text-sm opacity-90">Balanced point system for motivation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
