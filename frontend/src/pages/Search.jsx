import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search as SearchIcon, User, Bot, Clock } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setLoading(true);
      api.get(`/dashboard/messages/search?q=${encodeURIComponent(q)}`)
        .then(res => setResults(res.data))
        .catch(err => console.error("Search failed:", err))
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
        <p className="text-textSecondary">
          {q ? `Searching for "${q}"` : "Enter a search query in the top bar to find conversations."}
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12 glass-card">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : results.length > 0 ? (
          results.map((msg) => (
            <Link 
              key={msg._id} 
              to={`/users/${encodeURIComponent(msg.phone_number)}`}
              className="block glass-card p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'model' ? 'bg-primary/20 text-primary' : 'bg-surface border border-white/10 text-textSecondary'}`}>
                  {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{msg.phone_number}</span>
                    <span className="text-xs text-textSecondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-textPrimary line-clamp-3">
                    {msg.content}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : q ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
              <SearchIcon size={24} className="text-textSecondary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-textSecondary">Try adjusting your search terms.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
