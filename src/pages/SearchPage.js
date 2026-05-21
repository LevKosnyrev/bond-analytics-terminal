import React, { useContext, useMemo } from 'react';
import { AppContext } from '../store/AppContext';

const SearchPage = () => {
  const { bonds, loading, favorites, toggleFavorite, filters } = useContext(AppContext);

  // Полное восстановление твоей оригинальной кастомной фильтрации
  const filteredBonds = useMemo(() => {
    return bonds.filter(b => {
      // 1. Фильтр по секторам
      const matchSector = filters.sector === 'Все' || b.SECTOR === filters.sector;
      
      // 2. Фильтр по массиву выбранных названий компаний
      const matchNames = filters.selectedNames.length === 0 || filters.selectedNames.includes(b.SHORTNAME);
      
      // 3. Фильтр по массиву ISIN / SECID
      const matchISIN = filters.selectedISINs.length === 0 || filters.selectedISINs.includes(b.SECID) || filters.selectedISINs.includes(b.ISIN);
      
      // 4. Мин/Макс доходность
      const matchYieldMin = filters.yieldMin === '' || (b.YIELD && b.YIELD >= parseFloat(filters.yieldMin));
      const matchYieldMax = filters.yieldMax === '' || (b.YIELD && b.YIELD <= parseFloat(filters.yieldMax));

      return matchSector && matchNames && matchISIN && matchYieldMin && matchYieldMax;
    });
  }, [bonds, filters]);

  if (loading) return <div className="p-5 text-center text-white">Загрузка базы данных Скринера...</div>;

  return (
    <div className="p-4" style={{ height: 'calc(100vh - 60px)', overflowY: 'auto', width: '100%', backgroundColor: 'var(--bg-main)', color: '#fff' }}>
      <h3 className="mb-4">Многофакторный скринер облигаций</h3>

      {/* Инструменты управления фильтрами твоего AppContext */}
      <div className="p-3 rounded mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h6 className="mb-3 text-white" style={{ fontWeight: 'bold' }}>🎛️ Фильтрация выпусков</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Сектор рынка</label>
            <select className="form-select form-select-sm bg-dark text-white shadow-none mt-1" style={{ borderColor: 'var(--border-color)' }} value={filters.sector} onChange={(e) => filters.setSector(e.target.value)}>
              <option value="Все">Все секторы</option>
              <option value="Государственные">ОФЗ / Гос</option>
              <option value="Корпоративные">Корпоративные</option>
            </select>
          </div>
          <div className="col-md-3">
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Доходность от, %</label>
            <input type="number" className="form-control form-control-sm bg-dark text-white shadow-none mt-1" style={{ borderColor: 'var(--border-color)' }} value={filters.yieldMin} onChange={(e) => filters.setYieldMin(e.target.value)} placeholder="0.00" />
          </div>
          <div className="col-md-3">
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Доходность до, %</label>
            <input type="number" className="form-control form-control-sm bg-dark text-white shadow-none mt-1" style={{ borderColor: 'var(--border-color)' }} value={filters.yieldMax} onChange={(e) => filters.setYieldMax(e.target.value)} placeholder="30.00" />
          </div>
        </div>
      </div>

      {/* Полная таблица со всеми твоими столбцами данных */}
      <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="card-body p-0">
          <table className="table table-hover table-dark m-0" style={{ fontSize: '13.5px' }}>
            <thead style={{ backgroundColor: 'var(--bg-main)' }}>
              <tr>
                <th style={{ paddingLeft: '15px', width: '60px', color: 'var(--text-muted)' }}>Fav</th>
                <th style={{ color: 'var(--text-muted)' }}>Наименование / Код инструмента</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Цена</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Доходность</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Купон (₽)</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right', paddingRight: '15px' }}>Объем торгов</th>
              </tr>
            </thead>
            <tbody>
              {filteredBonds.map(b => {
                const isFav = favorites.includes(b.SECID);
                return (
                  <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ paddingLeft: '15px', verticalAlign: 'middle' }}>
                      <span onClick={() => toggleFavorite(b.SECID)} style={{ cursor: 'pointer', color: isFav ? '#f1c40f' : '#555', fontSize: '16px' }}>
                        {isFav ? '★' : '☆'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{b.SHORTNAME}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.SECID}</div>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{b.LAST ? `${Number(b.LAST).toFixed(2)}%` : '-'}</td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: 'var(--accent-green)' }}>{b.YIELD ? `${Number(b.YIELD).toFixed(2)}%` : '-'}</td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle', color: '#fff' }}>{b.COUPONVALUE ? `${Number(b.COUPONVALUE).toFixed(2)} ₽` : '-'}</td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '15px', color: 'var(--text-muted)' }}>
                      {b.VALTODAY ? new Intl.NumberFormat('ru-RU').format(Math.round(b.VALTODAY)) : '0'} ₽
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;