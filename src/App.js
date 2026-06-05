import React, { useState, useEffect, useMemo, useContext } from 'react';
import { AppContext } from './store/AppContext';
import { AuthContext } from './store/AuthContext';
import { moexApi } from './api/moexApi';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import DashboardPage from './pages/DashboardPage';
import BondDetailPage from './pages/BondDetailPage';
import LoginPage from './components/auth/LoginPage';
import './App.css';

function AppContent({ sortedTickers }) {
  const { activeTab, setActiveTab, selectedBond } = useContext(AppContext);
  const { isAuthenticated, username, logout, authReady } = useContext(AuthContext);

  const handleLogout = () => {
    setActiveTab('dashboard');
    logout();
  };

  // Пока Firebase восстанавливает сессию — показываем заставку,
  // чтобы не мигала форма входа у уже авторизованного пользователя.
  if (!authReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>

      {isAuthenticated && (
        <header style={{
          height: '60px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <h5 style={{ color: '#fff', margin: 0, fontWeight: '800', letterSpacing: '0.3px', fontSize: '18px' }}>
              Bond<span style={{ color: 'var(--accent-green)' }}>Screener</span>
            </h5>

            <div className="btn-group" style={{ gap: '4px' }}>
              {[
                { key: 'dashboard', label: 'Главная' },
                { key: 'search',    label: 'Поиск' },
                { key: 'favorites', label: 'Избранное' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className="btn btn-sm rounded"
                  style={{
                    fontWeight: '500',
                    border: '1px solid var(--border-color)',
                    backgroundColor: activeTab === tab.key ? 'var(--accent-green)' : '',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-primary)',
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '600', alignItems: 'center' }}>
              {sortedTickers.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.name}</span>
                  <span style={{ color: '#fff' }}>
                    {t.name?.toUpperCase() === 'ЗОЛОТО' ? Math.round(t.price) : Number(t.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '700' }}>
                {username}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-sm text-white"
                style={{ backgroundColor: '#4e555b', fontWeight: 'bold', padding: '6px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#343a40'}
                onMouseLeave={e => e.target.style.backgroundColor = '#4e555b'}
              >
                Выйти
              </button>
            </div>
          </div>
        </header>
      )}

      <main style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {!isAuthenticated ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <LoginPage />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard'  && <DashboardPage />}
            {activeTab === 'search'     && <SearchPage />}
            {activeTab === 'favorites'  && <FavoritesPage />}
            {activeTab === 'bondDetail' && (
              <BondDetailPage
                bond={selectedBond}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    moexApi.getTickers().then(setTickers);
    const interval = setInterval(() => moexApi.getTickers().then(setTickers), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedTickers = useMemo(() => {
    if (!tickers.length) return [];
    const order = ['USD/RUB', 'EUR/RUB', 'CNY/RUB', 'ЗОЛОТО'];
    return [...tickers]
      .filter(t => order.includes(t.name?.toUpperCase()))
      .sort((a, b) => order.indexOf(a.name?.toUpperCase()) - order.indexOf(b.name?.toUpperCase()));
  }, [tickers]);

  return <AppContent sortedTickers={sortedTickers} />;
}

export default App;
