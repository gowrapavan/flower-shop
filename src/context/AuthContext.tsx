"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loadingUser: boolean;
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  updateUserCache: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // 1. Check Local Storage FIRST (Zero API calls)
    const cachedUser = localStorage.getItem('flower-user');
    
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
      setLoadingUser(false);
    } else {
      // 2. Only if local storage is empty, check the server
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : { user: null })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('flower-user', JSON.stringify(data.user));
          }
        })
        .finally(() => setLoadingUser(false));
    }
  }, []);

  // Call this when Login or Register succeeds
  const loginUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('flower-user', JSON.stringify(userData));
  };

  // Call this when updating profile details
  const updateUserCache = (userData: User) => {
    setUser(userData);
    localStorage.setItem('flower-user', JSON.stringify(userData));
  };

  // Call this to logout
  const logoutUser = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('flower-user');
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, loadingUser, loginUser, logoutUser, updateUserCache }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};