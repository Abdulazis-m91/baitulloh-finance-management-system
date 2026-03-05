import { create } from 'zustand' // we'll use simple React context instead

import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'petugas_sekolah' | 'petugas_pesantren' | null;

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const mockUsers = [
  { email: 'admin@baitulloh.sch.id', password: 'admin123', role: 'admin' as UserRole, name: 'Administrator' },
  { email: 'sekolah@baitulloh.sch.id', password: 'sekolah123', role: 'petugas_sekolah' as UserRole, name: 'Petugas Sekolah' },
  { email: 'pesantren@baitulloh.sch.id', password: 'pesantren123', role: 'petugas_pesantren' as UserRole, name: 'Petugas Pesantren' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');

  const login = (email: string, password: string): boolean => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setIsLoggedIn(true);
      setRole(user.role);
      setUserName(user.name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
