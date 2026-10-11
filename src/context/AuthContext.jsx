import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jobit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (fbUser && db) {
            const userRef = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const userData = { uid: fbUser.uid, ...snap.data() };
              setCurrentUser(userData);
              localStorage.setItem('jobit_user', JSON.stringify(userData));
            } else {
              const defaultData = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Customer',
                phone: fbUser.phoneNumber || '',
                role: 'customer',
                photo: fbUser.photoURL || '',
                city: 'Celina, Delaware'
              };
              await setDoc(userRef, defaultData, { merge: true });
              setCurrentUser(defaultData);
              localStorage.setItem('jobit_user', JSON.stringify(defaultData));
            }
          }
        } catch {
          // Quiet offline fallback
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const loginWithPhone = async (phone, otp, name = 'Valued Customer') => {
    const uid = 'usr_' + phone.replace(/\D/g, '').slice(-10);
    const profile = {
      uid,
      phone,
      name: name || 'Valued Customer',
      role: 'customer',
      city: 'Celina, Delaware',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    };

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, profile, { merge: true });
      } catch {
        // Fallback to local storage
      }
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('jobit_user', JSON.stringify(updated));

    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      } catch {
        // Fallback
      }
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch {
        // Fallback
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('jobit_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithPhone,
        updateUserProfile,
        logout,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
