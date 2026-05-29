import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/dashboard/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError('Invalid username or password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout, isLoading, error };
}
