import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar px-4" style={{ 
      backgroundColor: 'var(--bg-card)', 
      borderBottom: '1px solid var(--border-color)',
      height: '60px'
    }}>
      <span className="navbar-brand mb-0 h1" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
        Bond Terminal
      </span>
      <div className="d-flex">
        <input 
          className="form-control form-control-sm" 
          type="search" 
          placeholder="Поиск по ISIN / Названию" 
          style={{ 
            backgroundColor: 'var(--bg-main)', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border-color)',
            width: '250px'
          }}
        />
      </div>
    </nav>
  );
};

export default Navbar;