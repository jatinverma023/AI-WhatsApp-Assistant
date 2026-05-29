import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Send, User, Sparkles, MessageSquare, Code, BookOpen, Brain, RefreshCw, PanelLeftClose, PanelLeftOpen, CheckCircle2, Clock, Copy, Plus, Menu, ArrowUpRight, Zap, Target, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '../utils/date';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function WebChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize and load sessions
  useEffect(() => {
    // Check screen size to auto-close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }

    const savedSessions = JSON.parse(localStorage.getItem('wpbot_sessions_list') || '[]');
    let currentSession = localStorage.getItem('wpbot_session');
    
    if (!currentSession) {
      currentSession = 'web_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('wpbot_session', currentSession);
      const newSessionList = [{ id: currentSession, date: new Date().toISOString() }, ...savedSessions];
      localStorage.setItem('wpbot_sessions_list', JSON.stringify(newSessionList));
      setSessions(newSessionList);
    } else {
      // Ensure current is in list
      if (!savedSessions.find(s => s.id === currentSession)) {
        savedSessions.unshift({ id: currentSession, date: new Date().toISOString() });
        localStorage.setItem('wpbot_sessions_list', JSON.stringify(savedSessions));
      }
      setSessions(savedSessions);
    }
    
    setSessionId(currentSession);
    loadHistory(currentSession);
  }, []);

  const loadHistory = async (sid) => {
    try {
      const response = await axios.get(`${API_URL}/chat/history/${sid}`);
      if (response.data && response.data.length > 0) {
        setMessages(response.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat history', error);
      setMessages([]);
    }
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    const newMsg = {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        session_id: sessionId,
        message: userMsg
      });
      
      setMessages(prev => [...prev, {
        role: 'model',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: 'I am sorry, but I am having trouble connecting right now. Please try again later.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    // Use setTimeout to allow state to update before sending (since we can't await setInput)
    setTimeout(() => {
      const form = document.getElementById('chat-form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 50);
  };

  const createNewSession = () => {
    const newSession = 'web_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('wpbot_session', newSession);
    setSessionId(newSession);
    setMessages([]);
    
    const savedSessions = JSON.parse(localStorage.getItem('wpbot_sessions_list') || '[]');
    const newSessionList = [{ id: newSession, date: new Date().toISOString() }, ...savedSessions];
    localStorage.setItem('wpbot_sessions_list', JSON.stringify(newSessionList));
    setSessions(newSessionList);
    
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const switchSession = (sid) => {
    localStorage.setItem('wpbot_session', sid);
    setSessionId(sid);
    loadHistory(sid);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const quickPrompts = [
    { icon: Code, title: "Learn React", text: "Help me learn React component state" },
    { icon: Brain, title: "Explain MongoDB", text: "Explain MongoDB aggregations simply" },
    { icon: BookOpen, title: "Study Plan", text: "Create a 3-day study plan for Python" },
    { icon: Zap, title: "Startup Idea", text: "Brainstorm an AI SaaS startup idea" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #4338ca 0%, transparent 50%, transparent 100%)' }}></div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="flex-shrink-0 bg-[#111116] border-r border-white/10 z-50 overflow-hidden flex flex-col absolute lg:relative h-full transition-all duration-300 shadow-2xl lg:shadow-none"
      >
        <div className="p-4 w-[280px]">
          <button 
            onClick={createNewSession}
            className="flex items-center gap-2 w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium group text-left"
          >
            <div className="bg-indigo-500/20 text-indigo-400 p-1 rounded-md group-hover:bg-indigo-500/30 transition-colors">
              <Plus size={16} />
            </div>
            New Conversation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4 w-[280px]">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <History size={12} /> Recent Chats
          </h3>
          <div className="space-y-1">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => switchSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all truncate flex items-center gap-2 ${
                  s.id === sessionId 
                    ? 'bg-indigo-500/10 text-indigo-300 font-medium' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <MessageSquare size={14} className={s.id === sessionId ? "text-indigo-400" : "opacity-50"} />
                {s.id === sessionId ? 'Current Session' : `Chat (${formatRelativeTime(s.date)})`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10 w-[280px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">WPBot AI</p>
              <p className="text-[10px] text-white/50">v1.0.0 • Production</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 h-full">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bot size={14} />
              </div>
              <span className="font-semibold text-sm">WPBot</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-white/80">Systems Online</span>
            </div>
            <a href="https://github.com/jatinverma023/AI-WhatsApp-Assistant" target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              View Source <ArrowUpRight size={12} />
            </a>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth pb-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full pt-8 flex flex-col min-h-full">
            
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center flex-1 py-12"
              >
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl relative group">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <Bot size={40} className="text-white relative z-10" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">WPBot AI</h2>
                <p className="text-lg text-white/60 text-center max-w-md mb-2">
                  AI-Powered Assistant with Persistent Memory
                </p>
                <p className="text-sm text-white/40 text-center max-w-lg mb-10 leading-relaxed">
                  Ask questions, learn concepts, write code, brainstorm ideas, and continue conversations seamlessly across sessions.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {quickPrompts.map((prompt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="flex flex-col items-start gap-2 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group text-left shadow-lg hover:shadow-indigo-500/10"
                    >
                      <div className="text-white/40 group-hover:text-indigo-400 transition-colors">
                        <prompt.icon size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white/80 group-hover:text-white block mb-0.5">{prompt.title}</span>
                        <span className="text-xs text-white/40 group-hover:text-white/60">{prompt.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8 flex-1 w-full pb-10">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isModel = msg.role === 'model';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        key={idx}
                        className={`flex gap-4 w-full group ${isModel ? 'justify-start' : 'justify-end'}`}
                      >
                        {isModel && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg mt-1 relative">
                            <Bot size={16} />
                            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} max-w-[85%] md:max-w-[75%]`}>
                          <div className="flex items-center gap-3 mb-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-medium text-white/40">
                              {isModel ? 'WPBot AI' : 'You'}
                            </span>
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="flex items-end gap-2">
                            {isModel && (
                              <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 text-white/30 hover:text-white/80 transition-colors rounded opacity-0 group-hover:opacity-100" title="Copy response">
                                <Copy size={14} />
                              </button>
                            )}
                            
                            <div className={`px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-xl ${
                              isModel 
                                ? (msg.isError ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl rounded-tl-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-2xl rounded-tl-sm backdrop-blur-sm')
                                : 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                            }`}>
                              {msg.content}
                            </div>

                            {!isModel && (
                              <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 text-white/30 hover:text-white/80 transition-colors rounded opacity-0 group-hover:opacity-100" title="Copy text">
                                <Copy size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {!isModel && (
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center text-white/60 mt-1 backdrop-blur-sm">
                            <User size={16} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 w-full justify-start items-center"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg relative">
                      <div className="absolute inset-0 bg-indigo-500 blur animate-pulse opacity-50 rounded-xl"></div>
                      <Bot size={16} className="relative z-10" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 h-[52px] shadow-sm backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent relative z-20">
          <div className="max-w-3xl mx-auto relative">
            <form id="chat-form" onSubmit={handleSend} className="relative flex items-end gap-2 bg-[#1a1a24] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask WPBot anything..."
                className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 text-[15px] py-3 px-4 max-h-48 min-h-[48px] resize-none focus:outline-none focus:ring-0"
                rows={1}
                style={{ height: 'auto', minHeight: '48px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 192) + 'px';
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
                {isLoading && (
                  <div className="absolute w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                )}
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-[11px] font-medium text-white/30">
                WPBot AI can make mistakes. Built with Gemini AI and MongoDB Atlas.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Right Desktop Info Panel */}
      <aside className="hidden xl:flex w-72 flex-shrink-0 bg-[#0a0a0c] border-l border-white/10 flex-col py-6 px-5 relative z-20">
        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" /> Platform Details
        </h3>
        
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Core Capabilities</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Conversational AI Memory</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>WhatsApp Bot Integration</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>MongoDB Persistence</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Profile Fact Extraction</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Session Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Current ID</span>
                <span className="text-white/90 font-mono text-xs bg-black/50 px-2 py-1 rounded">{sessionId || '---'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Messages</span>
                <span className="text-white/90 font-medium">{messages.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Memory Engine</span>
                <span className="text-emerald-400 font-medium text-xs border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
