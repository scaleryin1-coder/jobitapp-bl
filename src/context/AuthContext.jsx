import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const defaultAuthContext = {
  currentUser: null,
  loading: false,
  loginWithPhone: async () => null,
  loginAsWorker: async () => null,
  loginAsAdmin: async () => null,
  updateUserProfile: async () => {},
  logout: async () => {},
  isFirebaseConfigured: false
};

const AuthContext = createContext(defaultAuthContext);

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
                city: localStorage.getItem('jobit_user_location') || 'Mumbai, Maharashtra'
              };
              await setDoc(userRef, defaultData, { merge: true });
              setCurrentUser(defaultData);
              localStorage.setItem('jobit_user', JSON.stringify(defaultData));
            }
          }
        } catch {
          // Offline fallback
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const getLocalUserByPhone = (cleanTenDigits) => {
    try {
      const raw = localStorage.getItem('jobit_registered_users');
      const users = raw ? JSON.parse(raw) : {};
      return users[cleanTenDigits] || null;
    } catch {
      return null;
    }
  };

  const saveLocalUserByPhone = (cleanTenDigits, userProfile) => {
    try {
      const raw = localStorage.getItem('jobit_registered_users');
      const users = raw ? JSON.parse(raw) : {};
      users[cleanTenDigits] = userProfile;
      localStorage.setItem('jobit_registered_users', JSON.stringify(users));
    } catch {}
  };

  const checkPhoneRegistered = async (phone) => {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    if (cleanTenDigits === '8289968045') {
      return { isRegistered: true, isAdmin: true };
    }

    // 1. Check local users map
    const localExisting = getLocalUserByPhone(cleanTenDigits);
    if (localExisting) {
      return { isRegistered: true, user: localExisting };
    }

    // 2. Check Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const uid = 'usr_' + cleanTenDigits;
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const user = { uid, ...snap.data() };
          saveLocalUserByPhone(cleanTenDigits, user);
          return { isRegistered: true, user };
        }
      } catch {}
    }

    return { isRegistered: false };
  };

  const loginWithPhone = async (phone, otp, name = '') => {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanTenDigits = rawDigits.slice(-10);

    // Direct Admin Secret Bypass Number (+918289968045 / 8289968045)
    if (cleanTenDigits === '8289968045') {
      const adminProfile = {
        uid: 'admin_master',
        name: 'Master Admin',
        email: 'admin@jobit.com',
        phone: '+91 82899 68045',
        role: 'admin',
        city: 'Headquarters'
      };

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'users', 'admin_master'), adminProfile, { merge: true });
        } catch {}
      }

      setCurrentUser(adminProfile);
      localStorage.setItem('jobit_user', JSON.stringify(adminProfile));
      return adminProfile;
    }

    const uid = 'usr_' + cleanTenDigits;

    // Single-Account Check: check if this mobile number is already registered
    let existingProfile = getLocalUserByPhone(cleanTenDigits);

    if (!existingProfile && isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          existingProfile = { uid, ...snap.data() };
        }
      } catch {}
    }

    if (existingProfile) {
      // Existing single account found -> Log directly into this existing account without duplicating
      const mergedProfile = {
        ...existingProfile,
        uid,
        phone: `+91 ${cleanTenDigits}`,
        role: existingProfile.role || 'customer'
      };
      saveLocalUserByPhone(cleanTenDigits, mergedProfile);
      setCurrentUser(mergedProfile);
      localStorage.setItem('jobit_user', JSON.stringify(mergedProfile));
      return mergedProfile;
    }

    // Brand new user registration for this single mobile number
    const finalName = (name && name.trim()) ? name.trim() : 'Ferdin';
    const profile = {
      uid,
      phone: `+91 ${cleanTenDigits}`,
      name: finalName,
      email: `${finalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@example.com`,
      role: 'customer',
      city: localStorage.getItem('jobit_user_location') || 'Melattur, Kerala',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };

    saveLocalUserByPhone(cleanTenDigits, profile);

    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, profile, { merge: true });
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const loginAsWorker = async (worker = {}) => {
    const wId = worker.id || worker.workerId || 'worker_rajesh';
    const profile = {
      uid: wId,
      workerId: wId,
      email: worker.email || 'worker@jobit.com',
      name: worker.name || 'Rajesh Sharma',
      phone: worker.phone || '98765 43210',
      role: 'worker',
      skill: worker.skill || 'Plumbing Specialist',
      avatar: worker.avatar || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
      vehicle: worker.vehicle || 'Honda Activa (MH-02-CD-4321)',
      rating: worker.rating || 4.9,
      city: worker.city || localStorage.getItem('jobit_user_location') || 'Mumbai, Maharashtra'
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', wId), profile, { merge: true });
      } catch {}
    }

    setCurrentUser(profile);
    localStorage.setItem('jobit_user', JSON.stringify(profile));
    return profile;
  };

  const loginAsAdmin = async (adminPayload = {}) => {
    const profile = {
      uid: 'admin_master',
      name: adminPayload.name || 'Master Admin',
      email: adminPayload.email || 'admin@jobit.com',
      phone: '98765 00000',
      role: 'admin',
      city: 'Headquarters'
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', 'admin_master'), profile, { merge: true });
      } catch {}
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

    // Also update registered users cache if phone is present
    if (updated.phone) {
      const cleanDigits = updated.phone.replace(/\D/g, '').slice(-10);
      if (cleanDigits) {
        saveLocalUserByPhone(cleanDigits, updated);
      }
    }

    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      } catch {}
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch {}
    }
    setCurrentUser(null);
    localStorage.removeItem('jobit_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        checkPhoneRegistered,
        loginWithPhone,
        loginAsWorker,
        loginAsAdmin,
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
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
