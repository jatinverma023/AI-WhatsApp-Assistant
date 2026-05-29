import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, MessageSquare, Activity, Bot, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '../utils/date';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-5 relative overflow-hidden group flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-surface border border-border shadow-inner text-${color}`}>
          <Icon size={18} className={`text-${color}-500`} />
        </div>
        <span className="text-textSecondary font-medium text-sm">{title}</span>
      </div>
      <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success border border-success/20`}>
        <ArrowUpRight size={12} className="mr-1" />
        New
      </div>
    </div>
    
    <div className="relative z-10 flex items-end justify-between">
      <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chatsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/conversations/recent')
        ]);
        setData(statsRes.data);
        setRecentChats(chatsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-border border-t-white animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">WPBot Overview</h1>
          <p className="text-textSecondary text-sm md:text-base max-w-2xl">
            Monitor real-time WhatsApp conversations and AI agent performance.
          </p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={(data?.stats?.total_users || 0).toLocaleString()}
          icon={Users}
          color="white"
          delay={0.1}
        />
        <StatCard
          title="Total Messages"
          value={(data?.stats?.total_messages || 0).toLocaleString()}
          icon={MessageSquare}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="AI Requests"
          value={(data?.stats?.ai_request_count || 0).toLocaleString()}
          icon={Bot}
          color="purple"
          delay={0.3}
        />
        <StatCard
          title="Active Today"
          value={(data?.stats?.active_users_today || 0).toLocaleString()}
          icon={Activity}
          color="green"
          delay={0.4}
        />
      </div>

      {/* Analytics & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 glass-panel p-6 flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Message Activity (Last 7 Days)</h2>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {data?.chart_data?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontSize: '13px' }}
                    labelStyle={{ color: '#A1A1AA', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="messages" name="Total Messages" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorMsgs)" />
                  <Area type="monotone" dataKey="ai_requests" name="AI Requests" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorAI)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-textSecondary space-y-3">
                <Activity size={32} className="opacity-20" />
                <p>No messaging data available for this period.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-panel p-0 flex flex-col overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-white flex items-center justify-between">
              Recent Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {recentChats.map((chat, idx) => (
              <Link 
                key={idx} 
                to={`/users/${encodeURIComponent(chat.phone_number)}`}
                className="flex items-start gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${chat.last_role === 'model' ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white'}`}>
                  {chat.last_role === 'model' ? <Bot size={14} /> : <Users size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-white text-sm truncate">{chat.phone_number}</span>
                    <span className="text-[10px] text-textSecondary whitespace-nowrap ml-2">
                      {formatRelativeTime(chat.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-textSecondary line-clamp-2 leading-relaxed">
                    {chat.last_role === 'model' ? 'AI Response generated' : 'Message received'}
                  </p>
                </div>
              </Link>
            ))}
            {recentChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-textSecondary text-center px-4">
                <Activity size={24} className="opacity-20 mb-2 text-white" />
                <p className="text-sm font-medium text-white mb-0.5">No activity detected</p>
                <p className="text-xs">There are no recent messages in the system.</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-surface/30 backdrop-blur-md mt-auto">
            <Link to="/conversations" className="text-xs text-accent hover:text-white transition-colors flex items-center justify-center font-medium">
              View All Activity <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
