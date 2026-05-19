import React from 'react';

const Sidebar = () => {
  return (
    <div className="p-3" style={{ 
      height: '100%', 
      backgroundColor: 'var(--bg-card)', 
      borderRight: '1px solid var(--border-color)' 
    }}>
      <h6 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }} className="mb-4">
        Фильтры
      </h6>
      
      <div className="mb-3">
        <label className="form-label" style={{ fontSize: '14px' }}>Сектор</label>
        <select className="form-select form-select-sm shadow-none" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          <option>Все сектора</option>
          <option>Государственные (ОФЗ)</option>
          <option>Корпоративные</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label" style={{ fontSize: '14px' }}>Мин. доходность (%)</label>
        <input type="number" className="form-control form-control-sm shadow-none" placeholder="Например: 15" 
          style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}/>
      </div>

      <button className="btn btn-sm w-100" style={{ backgroundColor: 'var(--accent-green)', color: '#fff', fontWeight: '500' }}>
        Применить фильтры
      </button>
    </div>
  );
};

export default Sidebar;