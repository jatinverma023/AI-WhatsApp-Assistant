import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, User as UserIcon, Calendar, Clock, MessageSquare, ChevronRight, Filter, Download, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, formatRelativeTime } from '../utils/date';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/dashboard/users');
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.phone_number.includes(search) || 
    (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
  );

  const getMemoryStatus = (user) => {
    let fields = 0;
    if (user.profession) fields++;
    if (user.coding_experience) fields++;
    if (user.interests && user.interests.length > 0) fields++;
    if (user.goals && user.goals.length > 0) fields++;
    if (user.favorite_topics && user.favorite_topics.length > 0) fields++;

    if (fields >= 3) return { label: 'Active', color: 'text-success bg-success/10 border-success/20', dot: 'bg-success' };
    if (fields > 0) return { label: 'Partial', color: 'text-warning bg-warning/10 border-warning/20', dot: 'bg-warning' };
    return { label: 'No Memory', color: 'text-danger bg-danger/10 border-danger/20', dot: 'bg-danger' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Users</h1>
          <p className="text-textSecondary text-sm">Manage and monitor platform users across the CRM.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-textSecondary group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-textSecondary focus:outline-none focus:border-white/30 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 border border-border bg-surface rounded-lg text-textSecondary hover:text-white hover:bg-white/5 transition-all hidden md:flex" title="Filter">
            <Filter size={18} />
          </button>
          <button className="p-2 border border-border bg-surface rounded-lg text-textSecondary hover:text-white hover:bg-white/5 transition-all hidden md:flex" title="Export">
            <Download size={18} />
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel overflow-hidden border border-border"
      >
        {loading ? (
          <div className="p-24 flex justify-center">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-surface/30">
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider">Memory Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider">First Seen</th>
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider">Interactions</th>
                  <th className="px-6 py-4 text-xs font-medium text-textSecondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.map((user) => {
                  const lastActiveDate = user.last_interaction || user.updated_at || user.created_at;
                  const intCount = user.interaction_count || 0;
                  const memStatus = getMemoryStatus(user);
                  
                  return (
                    <tr key={user._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface to-surfaceHover border border-border flex items-center justify-center text-textSecondary group-hover:text-white transition-colors shadow-sm">
                            <UserIcon size={18} />
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{user.name || 'Unknown'}</div>
                            <div className="text-xs text-textSecondary mt-0.5">{user.phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wider border ${memStatus.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${memStatus.dot}`}></span>
                          {memStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-textSecondary">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="opacity-50" />
                          {formatDate(user.created_at).split(',')[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-textSecondary">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="opacity-50" />
                          {formatRelativeTime(lastActiveDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-black/50 border border-border text-white">
                          <MessageSquare size={12} className="text-accent" />
                          {intCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/users/${encodeURIComponent(user.phone_number)}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-textSecondary hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-textSecondary">
                        <UserIcon size={32} className="opacity-20 mb-3" />
                        <p className="text-sm font-medium text-white mb-1">No users found</p>
                        <p className="text-xs">There are no users matching "{search}".</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
