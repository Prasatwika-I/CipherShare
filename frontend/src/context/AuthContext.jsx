import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getMe, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // { uid, name, email, role, department }
  const [loading, setLoading] = useState(true);

  // On mount, check if a server session exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await logoutUser();
      await signOut(auth);
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
