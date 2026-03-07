import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'student' | 'employee' | 'therapist';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  selectedTherapistId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  selectTherapist: (therapistId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'mindtrack_users';
const CURRENT_USER_KEY = 'mindtrack_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore storage errors on load
    } finally {
      setIsLoading(false);
    }
  }

  async function getStoredUsers(): Promise<Record<string, { name: string; password: string; role: UserRole }>> {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  async function register(name: string, email: string, password: string, role: UserRole) {
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@ru.is')) {
      throw new Error('You must use a Reykjavík University email (@ru.is)');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (!name.trim()) {
      throw new Error('Name is required');
    }

    const users = await getStoredUsers();

    if (users[normalizedEmail]) {
      throw new Error('An account with this email already exists');
    }

    users[normalizedEmail] = { name: name.trim(), password, role };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    const newUser: User = { name: name.trim(), email: normalizedEmail, role };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const users = await getStoredUsers();
    const stored = users[normalizedEmail];

    if (!stored || stored.password !== password) {
      throw new Error('Invalid email or password');
    }

    const loggedInUser: User = { name: stored.name, email: normalizedEmail, role: stored.role };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  async function logout() {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  }

  async function selectTherapist(therapistId: string) {
  if (!user) return;

  const updatedUser: User = { ...user, selectedTherapistId: therapistId };
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  setUser(updatedUser);
}

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, selectTherapist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
