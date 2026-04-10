import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/Layout/MainLayout';

// Eager — críticos para la primera carga
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Lazy — se cargan al navegar
const Movimientos    = lazy(() => import('./pages/Movimientos'));
const NuevoGasto     = lazy(() => import('./pages/NuevoGasto'));
const Configuracion  = lazy(() => import('./pages/Configuracion'));
const Ingresos       = lazy(() => import('./pages/Ingresos'));
const Recurrentes    = lazy(() => import('./pages/Recurrentes'));
const Deudas         = lazy(() => import('./pages/Deudas'));
const Tarjetas       = lazy(() => import('./pages/Tarjetas'));
const Metas          = lazy(() => import('./pages/Metas'));
const Calendario     = lazy(() => import('./pages/Calendario'));
const ResumenAnual   = lazy(() => import('./pages/ResumenAnual'));
const ImportarDatos  = lazy(() => import('./pages/ImportarDatos'));
const ImportarArchivo = lazy(() => import('./pages/ImportarArchivo'));
const PublicReport   = lazy(() => import('./pages/PublicReport'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl animate-pulse" />
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-black text-2xl italic">$</span>
          </div>
          <p className="text-slate-400 font-bold text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="nuevo"            element={<NuevoGasto />} />
          <Route path="movimientos"      element={<Movimientos />} />
          <Route path="ingresos"         element={<Ingresos />} />
          <Route path="recurrentes"      element={<Recurrentes />} />
          <Route path="deudas"           element={<Deudas />} />
          <Route path="tarjetas"         element={<Tarjetas />} />
          <Route path="metas"            element={<Metas />} />
          <Route path="calendario"       element={<Calendario />} />
          <Route path="anual"            element={<ResumenAnual />} />
          <Route path="config"           element={<Configuracion />} />
          <Route path="importar"         element={<ImportarDatos />} />
          <Route path="importar-archivo" element={<ImportarArchivo />} />
        </Route>

        <Route path="/share/:id" element={<PublicReport />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ExpenseProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '16px',
                fontWeight: 700,
              },
            }}
          />
          <Router>
            <AppRoutes />
          </Router>
        </ExpenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
