import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Send, User, Sparkles, MessageSquare, Code, BookOpen, Brain, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function WebChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize session ID
  useEffect(() => {
    let storedSession = localStorage.getItem('wpbot_session');
    if (!storedSession) {
      storedSession = 'web_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('wpbot_session', storedSession);
    }
    setSessionId(storedSession);
    
    // Load history
    const loadHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/chat/history/${storedSession}`);
        if (response.data && response.data.length > 0) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Failed to load chat history', error);
      }
    };
    
    loadHistory();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI immediately
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
      
      // Add AI response
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
  };

  const resetSession = () => {
    const newSession = 'web_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('wpbot_session', newSession);
    setSessionId(newSession);
    setMessages([]);
  };

  const quickPrompts = [
    { icon: Code, text: "Write a React component for a button" },
    { icon: BookOpen, text: "Explain MongoDB indexes simply" },
    { icon: Brain, text: "What do you remember about me?" },
    { icon: Sparkles, text: "Tell me a programming joke" }
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-textPrimary font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center shadow-lg text-white">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-none">WPBot AI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs text-textSecondary font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
        <button 
          onClick={resetSession}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-textSecondary hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-border"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-3xl mx-auto px-4 py-8 relative z-10 flex flex-col min-h-full">
          
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center flex-1 py-12"
            >
              <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 shadow-2xl relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent/20 to-purple-600/20 blur-xl"></div>
                <Bot size={40} className="text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-textSecondary text-center max-w-md mb-8">
                I am WPBot AI, your intelligent assistant powered by Gemini. I can help with coding, general questions, and I'll remember our conversation!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {quickPrompts.map((prompt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                  >
                    <div className="text-textSecondary group-hover:text-accent transition-colors">
                      <prompt.icon size={20} />
                    </div>
                    <span className="text-sm text-textSecondary group-hover:text-white transition-colors">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 flex-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isModel = msg.role === 'model';
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={idx}
                      className={`flex gap-4 w-full ${isModel ? 'justify-start' : 'justify-end'}`}
                    >
                      {isModel && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                          <Bot size={14} />
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} max-w-[85%] md:max-w-[75%]`}>
                        <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                          isModel 
                            ? (msg.isError ? 'bg-danger/10 text-danger border border-danger/20 rounded-2xl rounded-tl-sm' : 'bg-surface border border-border text-white rounded-2xl rounded-tl-sm')
                            : 'bg-accent text-white rounded-2xl rounded-tr-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>

                      {!isModel && (
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex-shrink-0 flex items-center justify-center text-textSecondary mt-1">
                          <User size={14} />
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
                  className="flex gap-4 w-full justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                    <Bot size={14} />
                  </div>
                  <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 h-10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-textSecondary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-background border-t border-border p-4 relative z-20">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-surface border border-border rounded-2xl p-1.5 shadow-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Message WPBot AI..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-textSecondary text-sm py-3 px-4 max-h-32 min-h-[44px] resize-none focus:outline-none focus:ring-0"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '44px'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-accent text-white hover:bg-accentHover shadow-md'
                  : 'bg-white/5 text-textSecondary cursor-not-allowed'
              }`}
            >
              <Send size={18} className={isLoading ? 'opacity-50' : ''} />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-textSecondary">
              WPBot AI can make mistakes. Consider verifying important information.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
