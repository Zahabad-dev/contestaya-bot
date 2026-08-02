import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/site/Home';
import MenuInteractivo from './pages/site/MenuInteractivo';
import AgendaInteractiva from './pages/site/AgendaInteractiva';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import NegociosList from './pages/admin/NegociosList';
import NegocioEditor from './pages/admin/NegocioEditor';
import FaqManager from './pages/admin/FaqManager';
import Solicitudes from './pages/admin/Solicitudes';
import './styles/site.css';
import './styles/admin.css';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu/:slug" element={<MenuInteractivo />} />
          <Route path="/agenda/:slug" element={<AgendaInteractiva />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<NegociosList />} />
            <Route path="negocios/:negocioId" element={<NegocioEditor />} />
            <Route path="negocios/:negocioId/faq" element={<FaqManager />} />
            <Route path="negocios/:negocioId/solicitudes" element={<Solicitudes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
