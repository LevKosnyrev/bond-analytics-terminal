import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../store/AppContext';

// --- ОБНОВЛЕННЫЙ КОМПОНЕНТ: Мультивыбор со скроллом и моментальным раскрытием ---
const MultiSelectFilter = ({ label, placeholder, options, selected, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Фильтруем опции по введенному тексту и исключаем уже выбранные элементы
  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(opt)
    );
  }, [options, searchTerm, selected]);

  const handleSelect = (option) => {
    onChange([...selected, option]);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="mb-4" style={{ position: 'relative' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input 
        type="text" 
        className="form-control form-control-sm shadow-none mt-1" 
        style={{ backgroundColor: 'var(--bg-main)', color: '#fff', borderColor: 'var(--border-color)', fontSize: '13px' }} 
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
      />
      
      {/* ИЗМЕНЕНИЕ: Список показывается сразу при фокусе, добавлен скроллбар и ограничение высоты */}
      {isOpen && filteredOptions.length > 0 && (
        <ul className="list-group position-absolute w-100" style={{ 
          zIndex: 1000, 
          top: '60px', 
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
          maxHeight: '180px',       // Ограничение по высоте
          overflowY: 'auto'         // Включение вертикального скролла
        }}>
          {filteredOptions.map(opt => (
            <li 
              key={opt} 
              className="list-group-item list-group-item-action py-2" 
              style={{ backgroundColor: 'var(--bg-card)', color: '#fff', borderColor: 'var(--border-color)', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 d-flex flex-wrap gap-1">
        {selected.map(item => (
          <span key={item} className="badge d-flex align-items-center" style={{ backgroundColor: 'var(--accent-blue)', fontSize: '10px', padding: '4px 8px' }}>
            {item}
            <span style={{ marginLeft: '6px', cursor: 'pointer' }} onClick={() => onChange(selected.filter(i => i !== item))}>×</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const SearchPage = () => {
  const { bonds, loading, favorites, toggleFavorite, filters } = useContext(AppContext);

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
    return bonds.filter(b => {
      const matchSector = filters.sector === 'Все' || b.SECTOR === filters.sector;
      const matchNames = filters.selectedNames.length === 0 || filters.selectedNames.includes(b.SHORTNAME);
      const matchISIN = filters.selectedISINs.length === 0 || filters.selectedISINs.includes(b.SECID) || (b.ISIN && filters.selectedISINs.includes(b.ISIN));
      const matchYieldMin = filters.yieldMin === '' || (b.YIELD && b.YIELD >= parseFloat(filters.yieldMin));
      const matchYieldMax = filters.yieldMax === '' || (b.YIELD && b.YIELD <= parseFloat(filters.yieldMax));
      return matchSector && matchNames && matchISIN && matchYieldMin && matchYieldMax;
    });
  }, [bonds, filters]);

  if (loading) return <div className="p-5 text-center text-white">Загрузка терминала...</div>;

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 60px)', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
      
      <aside style={{ 
        width: '320px', minWidth: '320px', borderRight: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-card)', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        <h6 className="mb-4 text-white d-flex align-items-center" style={{ fontWeight: 'bold' }}>
          <span className="me-2">🎛️</span> Фильтры Скринера
        </h6>

        <div className="mb-4">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Сектор рынка</label>
          <select 
            className="form-select form-select-sm shadow-none mt-1" 
            style={{ backgroundColor: 'var(--bg-main)', color: '#fff', borderColor: 'var(--border-color)', fontSize: '13px' }} 
            value={filters.sector} 
            onChange={(e) => filters.setSector(e.target.value)}
          >
            <option value="Все">Все секторы</option>
            <option value="Государственные">ОФЗ / Гос</option>
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

        <button className="btn btn-outline-secondary btn-sm mt-auto w-100" style={{ fontSize: '12px' }} onClick={() => { filters.setSector('Все'); filters.setSelectedNames([]); filters.setSelectedISINs([]); filters.setYieldMin(''); filters.setYieldMax(''); }}>Сбросить фильтры</button>
      </aside>

      <section style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 text-white" style={{ fontWeight: 'bold' }}>Результаты поиска</h4>
          <span className="badge bg-dark text-muted" style={{ border: '1px solid var(--border-color)' }}>Найдено: {filteredBonds.length}</span>
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
                <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <span onClick={() => toggleFavorite(b.SECID)} style={{ cursor: 'pointer', color: favorites.includes(b.SECID) ? 'var(--accent-blue)' : '#444' }}>
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