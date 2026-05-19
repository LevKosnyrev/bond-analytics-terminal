import React, { useEffect, useState } from 'react';
import { moexApi } from './api/moexApi';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BondTable from './components/bonds/BondTable';
import BondChart from './components/charts/BondChart'; // Импортируем наш компонент графика

function App() {
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Новые состояния для управления графиком котировок
  const [selectedSecid, setSelectedSecid] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await moexApi.getBonds();
      setBonds(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Обработчик выбора облигации в таблице
  const handleSelectBond = async (secid) => {
    setSelectedSecid(secid);
    setLoadingChart(true);
    
    // Загружаем исторические свечи через наш API-курьер
    const history = await moexApi.getBondHistory(secid);
    setChartData(history);
    setLoadingChart(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div className="d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
        <div style={{ width: '250px', flexShrink: 0 }}>
          <Sidebar />
        </div>

        <div className="p-4 flex-grow-1" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h4 className="mb-4">Рынок облигаций (T+)</h4>

          {/* Блок отображения графика: рендерится только если бумага выбрана */}
          {selectedSecid && (
            <div className="mb-4">
              {loadingChart ? (
                <div className="p-4 text-center" style={{ background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span>Получение исторических свечей для {selectedSecid}...</span>
                </div>
              ) : (
                chartData.length > 0 ? (
                  <BondChart data={chartData} secid={selectedSecid} />
                ) : (
                  <div className="p-4 text-center" style={{ background: 'var(--bg-card)', borderRadius: '8px', color: 'var(--accent-red)' }}>
                    Исторические свечи для {selectedSecid} временно недоступны на данном борде.
                  </div>
                )
              )}
            </div>
          )}

          {loading ? (
            <div className="d-flex align-items-center" style={{ color: 'var(--text-muted)' }}>
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <span>Загрузка данных с MOEX ISS...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Доступно бумаг: <strong style={{ color: '#fff' }}>{bonds.length}</strong>. Кликните на строку для вывода интерактивного графика котировок:
              </p>
              
              {/* Передаем функцию клика внутрь таблицы */}
              <BondTable bonds={bonds.slice(0, 200)} onSelectBond={handleSelectBond} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;