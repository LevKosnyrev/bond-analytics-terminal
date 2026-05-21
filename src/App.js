import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider } from './store/AppContext';
import { moexApi } from './api/moexApi';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './components/auth/LoginPage'; 
import './App.css'; 

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickers, setTickers] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    moexApi.getTickers().then(setTickers);
    const tickerInterval = setInterval(() => {
      moexApi.getTickers().then(setTickers);
    }, 5 * 60 * 1000);

    return () => clearInterval(tickerInterval);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'short' };
      const dateStr = now.toLocaleDateString('ru-RU', options);
      const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      
      const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      setCurrentTime(`${formattedDate} ${timeStr}`);
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 60000);

    return () => clearInterval(clockInterval);
  }, []);

  const sortedTickers = useMemo(() => {
    if (!tickers.length) return [];
    const order = ['USD/RUB', 'EUR/RUB', 'CNY/RUB', 'ЗОЛОТО'];
    
    return [...tickers]
      .filter(t => order.includes(t.name?.toUpperCase()))
      .sort((a, b) => order.indexOf(a.name?.toUpperCase()) - order.indexOf(b.name?.toUpperCase()));
  }, [tickers]);

  const handleLoginSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsLoggedIn(false);
  };

  return (
    <AppProvider>
      <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
        
        <header style={{ 
          height: '60px', 
          backgroundColor: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px', 
          flexShrink: 0
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <h5 style={{ color: '#fff', margin: 0, fontWeight: '800', letterSpacing: '0.3px', fontSize: '18px' }}>
              Bond<span style={{ color: 'var(--accent-blue)' }}>Screener</span>
            </h5>
            
            {isLoggedIn && (
              <div className="btn-group" style={{ gap: '4px' }}>
                <button 
                  className={`btn btn-sm rounded ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-dark text-light'}`} 
                  style={{ fontWeight: '500', border: '1px solid var(--border-color)' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Дашборд
                </button>
                <button 
                  className={`btn btn-sm rounded ${activeTab === 'search' ? 'btn-primary' : 'btn-dark text-light'}`} 
                  style={{ fontWeight: '500', border: '1px solid var(--border-color)' }}
                  onClick={() => setActiveTab('search')}
                >
                  Скринер
                </button>
                <button 
                  className={`btn btn-sm rounded ${activeTab === 'favorites' ? 'btn-primary' : 'btn-dark text-light'}`} 
                  style={{ fontWeight: '500', border: '1px solid var(--border-color)' }}
                  onClick={() => setActiveTab('favorites')}
                >
                  Избранное
                </button>
              </div>
            )}
          </div>

          {isLoggedIn && (
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

              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{currentTime}</div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="btn btn-sm text-white" 
                  style={{ 
                    backgroundColor: '#4e555b', 
                    fontWeight: 'bold', 
                    padding: '6px 16px', 
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#343a40'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4e555b'}
                >
                  Выйти
                </button>
              </div>

            </div>
          )}
        </header>

        <main style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {!isLoggedIn ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardPage />}
              {activeTab === 'search' && <SearchPage />}
              {activeTab === 'favorites' && <FavoritesPage />}
            </>
          )}
        </main>
        
      </div>
    </AppProvider>
  );
}

export default App;