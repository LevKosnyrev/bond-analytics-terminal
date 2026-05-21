import React from 'react';

const HomePage = () => {
  return (
    <div className="p-5 flex-grow-1" style={{ overflowY: 'auto' }}>
      <h2 style={{ color: 'var(--accent-green)' }}>Добро пожаловать в Bond Terminal</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginTop: '20px' }}>
        Здесь будет располагаться основная аналитическая информация, сводка по рынку и ваш портфель.
      </p>
      <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <h5 style={{ color: '#fff' }}>Индекс RGBI</h5>
          <p style={{ color: 'var(--accent-red)', fontSize: '24px', fontWeight: 'bold' }}>115.42</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <h5 style={{ color: '#fff' }}>Ставка ЦБ</h5>
          <p style={{ color: 'var(--accent-green)', fontSize: '24px', fontWeight: 'bold' }}>16.00%</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;