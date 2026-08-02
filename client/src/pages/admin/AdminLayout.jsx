import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin admin-shell">
      <nav className="admin-nav">
        <strong style={{ color: '#F5C518', marginBottom: '1rem' }}>Ecosistema FAQ Bot</strong>
        <NavLink to="/admin" end>Negocios</NavLink>
        <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem', color: '#7a8090' }}>
          {user?.nombre} ({user?.rol})
        </div>
        <button className="secondary" onClick={onLogout}>Cerrar sesión</button>
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
