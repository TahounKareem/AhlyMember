import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isRegisteredUser: boolean;
  isAdmin: boolean;
}

export interface UserData {
  uid: string;
  displayName: string;
  role: string;
  points: number;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isRegisteredUser: false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Anonymous sign-in failed:", e);
        }
        return;
      }

      setUser(firebaseUser);

      if (!firebaseUser.isAnonymous) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData({ uid: firebaseUser.uid, ...userSnap.data() } as UserData);
        } else {
          setUserData({
            uid: firebaseUser.uid,
            displayName: `عضو #${firebaseUser.uid.substring(0, 4)}`,
            role: 'member',
            points: 0,
          });
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isRegisteredUser = user !== null && !user.isAnonymous;
  const isAdmin = isRegisteredUser && userData?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isRegisteredUser, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
