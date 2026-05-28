import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { can as checkPermission } from '../config/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('pos_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pos_token', data.token);
    localStorage.setItem('pos_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const can = useCallback((permission) => checkPermission(user?.role, permission), [user?.role]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
