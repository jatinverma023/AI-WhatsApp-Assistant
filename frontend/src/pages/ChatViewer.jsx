import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, User, Bot, Clock, Search, Download, Copy, MessageSquare, Briefcase, Code, Languages, Target, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '../utils/date';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, profileRes] = await Promise.all([
        api.get(`/dashboard/users/${encodeURIComponent(phone)}/history`),
        api.get(`/dashboard/users/${encodeURIComponent(phone)}/profile`)
      ]);
      setMessages(historyRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error("Failed to fetch chat or profile:", error);
      setError('Failed to load conversation. Backend may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  // Profile data processing
  const userName = profile?.name || profile?.nickname || 'Unknown';
  const lastActiveDate = profile?.updated_at || profile?.created_at;
  const totalMessages = messages.length;

  return (
    <div className="h-[calc(100vh-8rem)] flex glass-panel overflow-hidden border border-border max-w-7xl mx-auto shadow-2xl rounded-2xl">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-background border-r border-border">
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
                <h2 className="font-semibold text-white tracking-tight">{userName !== 'Unknown' ? userName : phone}</h2>
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
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="relative">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-full text-textSecondary space-y-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center border border-danger/20 text-danger mb-2">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-medium text-white">{error}</p>
              <button onClick={fetchData} className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-white/5 transition-colors text-sm">
                Try Again
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-textSecondary space-y-3">
              <MessageSquare size={32} className="opacity-20 text-white" />
              <p className="text-sm font-medium text-white mb-1">No conversations yet</p>
              <p className="text-xs">There are no messages matching your criteria.</p>
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
                        isModel ? "bg-gradient-to-tr from-accent to-purple-500 text-white border-transparent" : "bg-surface border-border text-textSecondary"
                      )}>
                        {isModel ? <Bot size={14} /> : <User size={14} />}
                      </div>
                      
                      <div className={cn(
                        "flex flex-col group",
                        isModel ? "items-start" : "items-end"
                      )}>
                        {!isModel && sentiment && (
                          <div className={`mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium border flex items-center gap-1 ${sentiment.color}`}>
                            <span>{sentiment.emoji}</span> {sentiment.label}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {!isModel && (
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-textSecondary hover:text-white transition-all rounded" title="Copy message" onClick={() => navigator.clipboard.writeText(msg.content)}>
                              <Copy size={12} />
                            </button>
                          )}
                          
                          <div className={cn(
                            "px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
                            isModel 
                              ? "bg-surface border border-border text-textPrimary rounded-bl-sm" 
                              : "bg-[#005c4b] text-white rounded-br-sm shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                          )}>
                            {msg.content}
                          </div>

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

      {/* Sticky Profile Panel */}
      <div className="w-80 hidden lg:flex flex-col bg-surface/50">
        <div className="px-6 py-5 border-b border-border bg-surface/80 backdrop-blur-xl">
          <h3 className="font-semibold text-white tracking-tight">User Profile</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-white/5 animate-pulse rounded-xl"></div>
              <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
            </div>
          ) : (
            <>
              {/* Identity Card */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-surface to-surfaceHover border border-border flex items-center justify-center text-textSecondary shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">{userName}</h4>
                    <p className="text-xs text-textSecondary mt-0.5">{phone}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-textSecondary flex items-center gap-2"><Languages size={14} /> Language</span>
                    <span className="text-white font-medium">{profile?.preferred_language || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-textSecondary flex items-center gap-2"><Clock size={14} /> Last Active</span>
                    <span className="text-white font-medium">{formatRelativeTime(lastActiveDate)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-textSecondary flex items-center gap-2"><MessageSquare size={14} /> Messages</span>
                    <span className="text-white font-medium">{totalMessages}</span>
                  </div>
                </div>
              </div>

              {/* Known Facts */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-textSecondary mb-3">Known Facts</h4>
                
                {(!profile?.profession && !profile?.coding_experience && (!profile?.interests || profile.interests.length === 0) && (!profile?.goals || profile.goals.length === 0)) ? (
                  <div className="text-center py-4 text-textSecondary text-xs">
                    <BrainCircuit size={20} className="mx-auto mb-2 opacity-20 text-white" />
                    No memory extracted yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile?.profession && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Briefcase size={14} className="text-accent mt-0.5" />
                        <span className="text-white">{profile.profession}</span>
                      </div>
                    )}
                    {profile?.coding_experience && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Code size={14} className="text-accent mt-0.5" />
                        <span className="text-white">{profile.coding_experience}</span>
                      </div>
                    )}
                    {profile?.interests?.length > 0 && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Heart size={14} className="text-accent mt-0.5" />
                        <div className="text-white flex flex-wrap gap-1">
                          Interested in {profile.interests.join(', ')}
                        </div>
                      </div>
                    )}
                    {profile?.goals?.length > 0 && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <Target size={14} className="text-accent mt-0.5" />
                        <div className="text-white flex flex-col gap-1">
                          {profile.goals.map((g, i) => (
                            <span key={i}>• {g}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
