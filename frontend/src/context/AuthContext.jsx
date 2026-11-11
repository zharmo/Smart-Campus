import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const handle = (r) => { localStorage.setItem('token', r.data.token); setUser(r.data.user); return r.data.user; };
  const login = (email, password) => api.post('/auth/login', { email, password }).then(handle);
  const register = (data) => api.post('/auth/register', data).then(handle);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}
