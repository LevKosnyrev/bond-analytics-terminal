import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../store/AuthContext';

const Navbar = () => {
  const { logout } = useContext(AuthContext);
  const userName = localStorage.getItem('app_username') || 'Трейдер';

  return (
    <nav className="navbar px-4" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', height: '60px' }}>
      <div className="d-flex align-items-center">
        <Link to="/" className="navbar-brand mb-0 h1 me-4" style={{ color: 'var(--accent-green)', fontWeight: 'bold', textDecoration: 'none' }}>
          Bond Terminal
        </Link>
        
        {/* Меню навигации */}
        <Link to="/search" className="btn btn-sm me-2" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          Поиск облигаций
        </Link>
        <Link to="/favorites" className="btn btn-sm" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          Избранное
        </Link>
      </div>

      <div className="d-flex align-items-center">
        <span style={{ color: 'var(--text-muted)', marginRight: '15px', fontSize: '14px' }}>
          👤 {userName}
        </span>
        <button className="btn btn-sm" style={{ border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }} onClick={logout}>
          Выход
        </button>
      </div>
    </nav>
  );
};

export default Navbar;