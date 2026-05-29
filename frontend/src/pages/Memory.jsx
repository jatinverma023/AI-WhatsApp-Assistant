import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BrainCircuit, Clock, Tags, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/date';

export default function Memory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMemories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/users');
      const usersWithMemory = response.data.filter(u => 
        u.profession || u.coding_experience || 
        (u.interests && u.interests.length > 0) || 
        (u.goals && u.goals.length > 0) ||
        (u.favorite_topics && u.favorite_topics.length > 0)
      );
      setUsers(usersWithMemory);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
      setError("Failed to load memory profiles. Backend may be unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">AI Memory Engine</h1>
          <p className="text-textSecondary text-sm md:text-base">Automatically extracted long-term context from user conversations.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin"></div>
          </div>
        </div>
      ) : error ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center border border-danger/20 text-danger mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">{error}</h3>
          <button onClick={fetchMemories} className="mt-4 px-6 py-2 bg-surface border border-border rounded-lg hover:bg-white/5 transition-colors">
            Try Again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <BrainCircuit size={48} className="text-textSecondary opacity-20 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No memory extracted yet</h3>
          <p className="text-textSecondary max-w-md">
            The AI engine automatically extracts facts, preferences, and goals as users interact with the bot. Keep chatting to generate memories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <motion.div 
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-card flex flex-col h-full border border-border hover:border-white/10 transition-colors"
            >
              <div className="p-5 border-b border-border/50 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white text-lg">{user.name || user.phone_number}</h3>
                  {user.name && <p className="text-xs text-textSecondary">{user.phone_number}</p>}
                </div>
                <div className="bg-surface border border-border p-2 rounded-lg text-accent">
                  <BrainCircuit size={16} />
                </div>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                {user.profession && (
                  <div>
                    <span className="text-[10px] text-textSecondary uppercase tracking-wider mb-1 block">Profession</span>
                    <span className="text-sm text-textPrimary">{user.profession}</span>
                  </div>
                )}
                
                {user.coding_experience && (
                  <div>
                    <span className="text-[10px] text-textSecondary uppercase tracking-wider mb-1 block">Experience</span>
                    <span className="text-sm text-textPrimary">{user.coding_experience}</span>
                  </div>
                )}

                {(user.interests?.length > 0 || user.favorite_topics?.length > 0 || user.goals?.length > 0) && (
                  <div>
                    <span className="text-[10px] text-textSecondary uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tags size={10} /> Extracted Tags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {user.interests?.map((item, i) => (
                        <span key={`int-${i}`} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-[11px] font-medium">
                          {item}
                        </span>
                      ))}
                      {user.favorite_topics?.map((item, i) => (
                        <span key={`top-${i}`} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md text-[11px] font-medium">
                          {item}
                        </span>
                      ))}
                      {user.goals?.map((item, i) => (
                        <span key={`goal-${i}`} className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-md text-[11px] font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50 bg-black/20 mt-auto flex items-center gap-2 text-xs text-textSecondary">
                <Clock size={12} />
                Last updated: {formatRelativeTime(user.updated_at)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
