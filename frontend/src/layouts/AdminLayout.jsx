import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, BrainCircuit, 
  Activity, Bot, LogOut, Search, Database, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { motion } from 'framer-motion';

export default function AdminLayout() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sysStatus, setSysStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/dashboard/system/status')
        .then(res => setSysStatus(res.data))
        .catch(err => console.error(err));
    }
  }, [isAuthenticated]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Conversations', path: '/conversations', icon: MessageSquare },
    { name: 'AI Memory', path: '/memory', icon: BrainCircuit },
    { name: 'System Health', path: '/status', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-sm">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="bg-surface border-r border-border flex flex-col relative z-20"
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-surface border border-border rounded-full p-1 text-textSecondary hover:text-white transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 pb-2">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Bot className="text-black" size={18} />
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap">
                <h1 className="font-semibold text-white tracking-tight">WPBot AI Platform</h1>
                <p className="text-[9px] text-textSecondary uppercase tracking-widest mt-0.5">AI-Powered Assistant</p>
              </motion.div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && !isCollapsed && (
                  <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                )}
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-textSecondary group-hover:text-white'}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-surface border border-border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-4">
          <div className={`flex items-center gap-3 p-2 rounded-lg ${!isCollapsed && 'hover:bg-white/5 transition-colors cursor-pointer'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white font-medium text-xs flex-shrink-0 shadow-glow-primary">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${sysStatus?.mongodb === 'Connected' ? 'bg-success' : 'bg-danger'}`} />
                  <p className="text-[10px] text-textSecondary truncate">System Healthy</p>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <button onClick={logout} className="p-1.5 text-textSecondary hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Logout">
                <LogOut size={14} />
              </button>
            )}
          </div>
          
          {!isCollapsed && (
             <div className="pt-2 text-[10px] text-textSecondary/50 text-center space-y-0.5">
               <p>Version 1.0.0</p>
               <p>Powered by Gemini + MongoDB</p>
             </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex-1 flex items-center max-w-md">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              }}
              className="relative w-full group"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-textSecondary group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search anything (Cmd+K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 pl-9 py-2 text-sm text-white placeholder:text-textSecondary"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-surface rounded-full border border-border">
              <div className="flex items-center gap-1.5" title="MongoDB">
                <Database size={12} className={sysStatus?.mongodb === 'Connected' ? 'text-textSecondary' : 'text-danger'} />
                <div className={`w-1.5 h-1.5 rounded-full ${sysStatus?.mongodb === 'Connected' ? 'bg-success shadow-[0_0_8px_#10B981]' : 'bg-danger'}`} />
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5" title="Gemini AI">
                <BrainCircuit size={12} className={sysStatus?.gemini === 'Active' ? 'text-textSecondary' : 'text-danger'} />
                <div className={`w-1.5 h-1.5 rounded-full ${sysStatus?.gemini === 'Active' ? 'bg-success shadow-[0_0_8px_#10B981]' : 'bg-danger'}`} />
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
