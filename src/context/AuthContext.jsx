import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, googleProvider } from '../firebase/config';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const WELCOME_KEY = 'costapp_welcomed_v1';

const showWelcomeToast = (user) => {
  const key = `${WELCOME_KEY}_${user.uid}`;
  // Only show once per session (sessionStorage resets on tab close)
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  const name = user.displayName?.split(' ')[0] || 'Usuario';
  const hour = new Date().getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'opacity-0'}
          flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800
          rounded-2xl px-4 py-3 shadow-xl shadow-black/10 max-w-xs`}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg">{name[0]}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-800 dark:text-white">{greeting}, {name}</p>
          <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
        </div>
        <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-400" title="Conectado" />
      </div>
    ),
    { duration: 4000, position: 'top-right' }
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        showWelcomeToast(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const loadingToast = toast.loading('Iniciando comunicación con Google...');
    console.log('[Auth] Inicio loginWithGoogle - Plataforma:', Capacitor.getPlatform());
    
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('[Auth] Paso 1: Llamando a FirebaseAuthentication.signInWithGoogle()...');
        
        const result = await FirebaseAuthentication.signInWithGoogle({
          webClientId: '1082316027619-f2rjigcscd1afau0nh14k3s9sn6tr6hg.apps.googleusercontent.com'
        });
        
        console.log('[Auth] Paso 2: Resultado nativo recibido:', JSON.stringify(result));

        if (!result.credential || !result.credential.idToken) {
          throw new Error('No se recibió idToken. Resultado: ' + JSON.stringify(result));
        }

        console.log('[Auth] Paso 3: Creando credencial de Firebase con idToken...');
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        
        console.log('[Auth] Paso 4: Ejecutando signInWithCredential en Firebase...');
        const userCredential = await signInWithCredential(auth, credential);
        console.log('[Auth] ¡Éxito! Usuario logueado:', userCredential.user.email);
        
        toast.success('Sesión iniciada correctamente', { id: loadingToast });
      } else {
        console.log('[Auth] Flujo Web detectado');
        await signInWithPopup(auth, googleProvider);
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error('[Auth] ERROR DETALLADO:', error);
      
      const errorMsg = error.message || 'Error desconocido';
      const errorCode = error.code || 'N/A';
      
      toast.error(
        (t) => (
          <div className="flex flex-col gap-1 min-w-[250px]">
            <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500">Error de Autenticación Nativa</p>
            <div className="text-[9px] font-mono bg-slate-900 text-slate-200 p-2 rounded border border-slate-700 max-h-[150px] overflow-auto">
              <p className="font-bold text-emerald-400">Code:</p> {errorCode}
              <p className="font-bold text-emerald-400 mt-1">Message:</p> {errorMsg}
              <p className="font-bold text-emerald-400 mt-1">Details:</p> {JSON.stringify(error)}
            </div>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 text-[10px] font-black underline text-slate-400 hover:text-white"
            >
              CERRAR MENSAJE
            </button>
          </div>
        ),
        { id: loadingToast, duration: 15000 }
      );
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
