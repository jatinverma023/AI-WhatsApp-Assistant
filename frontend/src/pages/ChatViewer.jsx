import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, User, Bot, Clock, Search, Download, Copy, Info, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Simple mock sentiment analyzer based on keywords
const analyzeSentiment = (text) => {
  const t = text.toLowerCase();
  if (t.includes('love') || t.includes('great') || t.includes('thanks') || t.includes('awesome') || t.includes('good') || t.includes('haha') || t.includes('hola')) return { emoji: '😊', label: 'Positive', color: 'text-success bg-success/10 border-success/20' };
  if (t.includes('bad') || t.includes('error') || t.includes('wrong') || t.includes('hate') || t.includes('fix') || t.includes('broken')) return { emoji: '😔', label: 'Negative', color: 'text-danger bg-danger/10 border-danger/20' };
  return { emoji: '😐', label: 'Neutral', color: 'text-textSecondary bg-surface border-border' };
};

export default function ChatViewer() {
  const { id } = useParams();
  const phone = decodeURIComponent(id);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, profileRes] = await Promise.all([
          api.get(`/dashboard/users/${encodeURIComponent(phone)}/history`),
          api.get(`/dashboard/users/${encodeURIComponent(phone)}/profile`)
        ]);
        setMessages(historyRes.data);
        setProfile(profileRes.data);
      } catch (error) {
        console.error("Failed to fetch chat or profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[calc(100vh-8rem)] flex glass-panel overflow-hidden border border-border max-w-7xl mx-auto shadow-2xl rounded-2xl">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border relative bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link to="/users" className="p-2 rounded-lg hover:bg-white/10 transition-colors text-textSecondary hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface to-surfaceHover border border-border flex items-center justify-center text-textSecondary shadow-sm">
                <User size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-white tracking-tight">{profile?.name || phone}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <p className="text-[10px] text-textSecondary uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={14} className="text-textSecondary group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 bg-black border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-textSecondary focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <button className="p-2 border border-border bg-surface rounded-lg text-textSecondary hover:text-white hover:bg-white/5 transition-all" title="Export Chat">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="relative">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin"></div>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-textSecondary space-y-3">
              <MessageSquare size={32} className="opacity-20" />
              <p className="text-sm">No messages found.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredMessages.map((msg, idx) => {
                const isModel = msg.role === 'model';
                const sentiment = !isModel ? analyzeSentiment(msg.content) : null;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 > 1 ? 0 : idx * 0.05 }}
                    key={msg._id || idx} 
                    className={cn(
                      "flex w-full relative z-10",
                      isModel ? "justify-start" : "justify-end"
                    )}
                  >
                    <div className={cn(
                      "flex max-w-[85%] md:max-w-[75%] gap-3",
                      isModel ? "flex-row" : "flex-row-reverse"
                    )}>
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-auto mb-5 border",
                        isModel ? "bg-white text-black border-transparent" : "bg-surface border-border text-textSecondary"
                      )}>
                        {isModel ? <Bot size={14} /> : <User size={14} />}
                      </div>
                      
                      <div className={cn(
                        "flex flex-col group",
                        isModel ? "items-start" : "items-end"
                      )}>
                        {/* Sentiment Badge (User Only) */}
                        {!isModel && sentiment && (
                          <div className={`mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium border flex items-center gap-1 ${sentiment.color}`}>
                            <span>{sentiment.emoji}</span> {sentiment.label}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {/* Copy button appears on hover */}
                          {!isModel && (
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-textSecondary hover:text-white transition-all rounded" title="Copy message" onClick={() => navigator.clipboard.writeText(msg.content)}>
                              <Copy size={12} />
                            </button>
                          )}
                          
                          <div className={cn(
                            "px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
                            isModel 
                              ? "bg-surface border border-border text-textPrimary rounded-bl-sm" 
                              : "bg-[#005c4b] text-white rounded-br-sm shadow-[0_1px_2px_rgba(0,0,0,0.3)]" // WhatsApp dark green
                          )}>
                            {msg.content}
                          </div>

                          {/* Copy button appears on hover */}
                          {isModel && (
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-textSecondary hover:text-white transition-all rounded" title="Copy message" onClick={() => navigator.clipboard.writeText(msg.content)}>
                              <Copy size={12} />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-textSecondary px-1 font-medium">
                          <Clock size={10} className="opacity-70" />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!isModel && <CheckCircle2 size={10} className="text-accent ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
