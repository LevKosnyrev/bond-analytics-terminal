import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../store/AppContext';
import MultiSelectFilter from '../components/common/MultiSelectFilter';

const SearchPage = () => {
  const { bonds, loading, error, favorites, toggleFavorite, filters, navigateToBond } = useContext(AppContext);
  const [query, setQuery] = useState('');

  const filterOptions = useMemo(() => {
    const names = new Set();
    const isins = new Set();
    bonds.forEach(b => {
      if (b.SHORTNAME) names.add(b.SHORTNAME);
      if (b.SECID) isins.add(b.SECID);
    });
    return { names: Array.from(names), isins: Array.from(isins) };
  }, [bonds]);

  const filteredBonds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bonds.filter(b => {
      const matchQuery = q === '' ||
        (b.SHORTNAME && b.SHORTNAME.toLowerCase().includes(q)) ||
        (b.SECID && b.SECID.toLowerCase().includes(q)) ||
        (b.ISIN && b.ISIN.toLowerCase().includes(q));
      const matchSector = filters.sector === 'Все' || b.SECTOR === filters.sector;
      const matchNames = filters.selectedNames.length === 0 || filters.selectedNames.includes(b.SHORTNAME);
      const matchISIN = filters.selectedISINs.length === 0 || filters.selectedISINs.includes(b.SECID) || (b.ISIN && filters.selectedISINs.includes(b.ISIN));
      const matchYieldMin = filters.yieldMin === '' || (b.YIELD && b.YIELD >= parseFloat(filters.yieldMin));
      const matchYieldMax = filters.yieldMax === '' || (b.YIELD && b.YIELD <= parseFloat(filters.yieldMax));
      return matchQuery && matchSector && matchNames && matchISIN && matchYieldMin && matchYieldMax;
    });
  }, [bonds, filters, query]);

  if (loading) return <div className="p-5 text-center text-white">Загрузка терминала...</div>;
  if (error) return <div className="p-5 text-center" style={{ color: 'var(--accent-red)', width: '100%' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 60px)', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
      
      <aside style={{ 
        width: '320px', minWidth: '320px', borderRight: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-card)', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        <h6 className="mb-4 text-white d-flex align-items-center" style={{ fontWeight: 'bold' }}>
          Фильтры Скринера
        </h6>

        <div className="mb-4">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Поиск</label>
          <input
            type="text"
            className="form-control form-control-sm shadow-none mt-1"
            style={{ backgroundColor: 'var(--bg-main)', color: '#fff', borderColor: 'var(--border-color)', fontSize: '13px' }}
            placeholder="Название, ISIN или SECID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Сектор рынка</label>
          <select 
            className="form-select form-select-sm shadow-none mt-1" 
            style={{ backgroundColor: 'var(--bg-main)', color: '#fff', borderColor: 'var(--border-color)', fontSize: '13px' }} 
            value={filters.sector} 
            onChange={(e) => filters.setSector(e.target.value)}
          >
            <option value="Все">Все секторы</option>
            <option value="Государственные">Государственные</option>
            <option value="Корпоративные">Корпоративные</option>
          </select>
        </div>

        <div className="mb-4">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Доходность, %</label>
          <div className="d-flex gap-2 mt-1">
            <input type="number" className="form-control form-control-sm bg-dark text-white shadow-none border-secondary" value={filters.yieldMin} onChange={(e) => filters.setYieldMin(e.target.value)} placeholder="От" />
            <input type="number" className="form-control form-control-sm bg-dark text-white shadow-none border-secondary" value={filters.yieldMax} onChange={(e) => filters.setYieldMax(e.target.value)} placeholder="До" />
          </div>
        </div>

        <MultiSelectFilter label="Название бумаги" placeholder="Выберите или введите..." options={filterOptions.names} selected={filters.selectedNames} onChange={filters.setSelectedNames} />
        <MultiSelectFilter label="Код ISIN / SECID" placeholder="Выберите или введите..." options={filterOptions.isins} selected={filters.selectedISINs} onChange={filters.setSelectedISINs} />

        <button className="btn btn-outline-secondary btn-sm mt-auto w-100" style={{ fontSize: '12px' }} onClick={() => { setQuery(''); filters.setSector('Все'); filters.setSelectedNames([]); filters.setSelectedISINs([]); filters.setYieldMin(''); filters.setYieldMax(''); }}>Сбросить фильтры</button>
      </aside>

      <section style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 text-white" style={{ fontWeight: 'bold' }}>Результаты поиска</h4>
          <span className="badge bg-dark text-white" style={{ border: '1px solid var(--border-color)' }}>Найдено: {filteredBonds.length}</span>
        </div>

        <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <table className="table table-hover table-dark m-0" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: 'var(--bg-main)' }}>
              <tr>
                <th style={{ width: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>★</th>
                <th style={{ color: 'var(--text-muted)' }}>Инструмент</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Цена (%)</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Доходность</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Купон</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '20px' }}>Объем (₽)</th>
              </tr>
            </thead>
            <tbody>
              {filteredBonds.map(b => (
                <tr key={b.SECID} onClick={() => navigateToBond(b)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <span onClick={e => { e.stopPropagation(); toggleFavorite(b.SECID); }} style={{ cursor: 'pointer', color: favorites.includes(b.SECID) ? 'var(--accent-blue)' : '#444' }}>
                      {favorites.includes(b.SECID) ? '★' : '☆'}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold' }}>{b.SHORTNAME}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.SECID}</div>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{b.LAST ? `${Number(b.LAST).toFixed(2)}%` : '-'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: 'var(--accent-green)' }}>{b.YIELD ? `${Number(b.YIELD).toFixed(2)}%` : '-'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{b.COUPONVALUE ? `${Number(b.COUPONVALUE).toFixed(2)}` : '-'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '20px', color: 'var(--text-muted)' }}>{b.VALTODAY ? new Intl.NumberFormat('ru-RU').format(Math.round(b.VALTODAY)) : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SearchPage;