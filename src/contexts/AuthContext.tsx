import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'petugas_sekolah' | 'petugas_pesantren' | null;

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Get role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    setRole((roleData?.role as UserRole) || null);
    setUserName(profileData?.display_name || '');
    setIsLoggedIn(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setRole(null);
        setUserName('');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userName, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
