import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchUserProfile,
  LocalUser,
  loginWithSql,
  updateUserProfile,
  UserProfile,
} from '../lib/db';

interface AuthContextType {
  currentUser: LocalUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const LOCAL_USER_KEY = 'lares.localUserId';
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedUserId = localStorage.getItem(LOCAL_USER_KEY);
      if (!savedUserId) {
        setLoading(false);
        return;
      }

      try {
        const { currentUser: restoredUser, profile } = await fetchUserProfile(savedUserId);
        setCurrentUser(restoredUser);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error restoring local SQL session:', error);
        localStorage.removeItem(LOCAL_USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (email: string, name: string) => {
    const { currentUser: user, profile } = await loginWithSql(email, name);
    localStorage.setItem(LOCAL_USER_KEY, user.uid);
    setCurrentUser(user);
    setUserProfile(profile);
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (profileUpdate: Partial<UserProfile>) => {
    if (!currentUser) return;

    const { currentUser: updatedUser, profile } = await updateUserProfile(currentUser.uid, profileUpdate);
    setCurrentUser(updatedUser);
    setUserProfile(profile);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signIn, signOut, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
