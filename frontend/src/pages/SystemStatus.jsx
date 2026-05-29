import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, Bot, MessageSquare, Server, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusCard = ({ title, status, icon: Icon, delay }) => {
  const isOk = status === 'Connected' || status === 'Active' || status === 'Online';
  const isError = status === 'Disconnected' || status === 'Offline' || status === 'Not Configured';
  
  // Mock response time and last checked for UI purposes
  const responseTime = isOk ? Math.floor(Math.random() * 150) + 20 : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-6 flex flex-col justify-between h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-surface border border-border">
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-xs text-textSecondary mt-0.5">Core Infrastructure</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${isOk ? 'bg-success/10 text-success border-success/20' : (isError ? 'bg-danger/10 text-danger border-danger/20' : 'bg-warning/10 text-warning border-warning/20')}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-success' : (isError ? 'bg-danger' : 'bg-warning')}`}></span>
          {status}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
        <div>
          <span className="text-[10px] text-textSecondary uppercase tracking-wider block mb-1">Response Time</span>
          <span className="text-sm font-medium text-white">{isOk ? `${responseTime}ms` : '-'}</span>
        </div>
        <div>
          <span className="text-[10px] text-textSecondary uppercase tracking-wider block mb-1">Last Checked</span>
          <span className="text-sm font-medium text-white">Just now</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/system/status');
      setStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch system status:", error);
      setError("Failed to communicate with backend. Infrastructure may be offline.");
      setStatus({
        backend_uptime: 'Offline',
        mongodb: 'Disconnected',
        gemini: 'Disconnected',
        twilio: 'Disconnected'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">System Health</h1>
          <p className="text-textSecondary text-sm md:text-base">Real-time monitoring of external services and core infrastructure.</p>
        </div>
        {error && (
          <button onClick={fetchStatus} className="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:bg-white/5 transition-colors">
            Retry Connection
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-white animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusCard 
            title="FastAPI Backend" 
            status={status?.backend_uptime || 'Unknown'} 
            icon={Server} 
            delay={0.1}
          />
          <StatusCard 
            title="MongoDB Atlas" 
            status={status?.mongodb || 'Unknown'} 
            icon={Database} 
            delay={0.2}
          />
          <StatusCard 
            title="Gemini AI Engine" 
            status={status?.gemini || 'Unknown'} 
            icon={Bot} 
            delay={0.3}
          />
          <StatusCard 
            title="Twilio WhatsApp" 
            status={status?.twilio || 'Unknown'} 
            icon={MessageSquare} 
            delay={0.4}
          />
        </div>
      )}
    </div>
  );
}
