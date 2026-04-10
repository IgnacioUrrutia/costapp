import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Chrome, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

const ERROR_MESSAGES = {
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/invalid-credential': 'Credenciales incorrectas. Verifica tu email y contraseña.',
};

const Login = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { email, password, name } = formData;

    try {
      if (isLogin) {
        await toast.promise(
          login(email, password),
          {
            loading: 'Autenticando...',
            success: null,
            error: 'Credenciales incorrectas',
          }
        );
      } else {
        await toast.promise(
          register(email, password, name),
          {
            loading: 'Creando cuenta...',
            success: null,
            error: 'Error al crear la cuenta',
          }
        );
      }
    } catch (error) {
      setAuthError(ERROR_MESSAGES[error.code] || 'Ocurrió un error. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-600/20 blur-[100px] rounded-full"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "outQuart" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 border-b-4 border-indigo-700/50"
          >
            <span className="text-white text-4xl font-black italic">$</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-white tracking-tighter mb-2"
          >
            {isLogin ? '¡Bienvenido!' : 'Crea tu Cuenta'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 font-medium"
          >
            {isLogin ? 'Tu gestión financiera, elevada.' : 'Empieza tu viaje hacia la libertad financiera.'}
          </motion.p>
        </div>

        <motion.div 
          layout
          className="bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="Juan Pérez"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="hola@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Contraseña</label>
                {isLogin && <button type="button" className="text-[10px] uppercase font-black text-indigo-500 hover:text-indigo-400">¿Olvidaste tu contraseña?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <span>⚠️</span> {authError}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles size={20} />
              {isLogin ? 'Entrar al Dashboard' : 'Crear Cuenta Ahora'}
            </motion.button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-[1px] bg-white/5 flex-1" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">O continúa con</span>
            <div className="h-[1px] bg-white/5 flex-1" />
          </div>

          <div className="mt-8">
            <motion.button
              whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => loginWithGoogle()}
              className="w-full py-3.5 bg-transparent border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-white font-bold transition-all"
            >
              <Chrome size={20} className="text-rose-500" />
              Continuar con Google
            </motion.button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10 text-slate-500 font-bold"
        >
          {isLogin ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
          <button
            onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
            className="text-indigo-500 hover:text-indigo-400 ml-2 group inline-flex items-center gap-1 transition-all"
          >
            {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
