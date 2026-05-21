import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../store/AppContext';

// --- ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: Кастомный мультивыбор для Сайдбара ---
const MultiSelectFilter = ({ label, placeholder, options, selected, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(opt)
  ).slice(0, 8);

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
      
      {isOpen && searchTerm && filteredOptions.length > 0 && (
        <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, top: '60px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
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

// === ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ ИЗБРАННОГО ===
const FavoritesPage = () => {
  const { bonds, favorites, toggleFavorite, loading, filters } = useContext(AppContext);

  // 1. Получаем список только избранных бумаг для генерации точечных подсказок в поиске
  const favBondsRaw = useMemo(() => {
    return bonds.filter(b => favorites.includes(b.SECID));
  }, [bonds, favorites]);

  // Генерируем уникальные списки подсказок исключительно по портфелю
  const filterOptions = useMemo(() => {
    const names = new Set();
    const isins = new Set();
    favBondsRaw.forEach(b => {
      if (b.SHORTNAME) names.add(b.SHORTNAME);
      if (b.SECID) isins.add(b.SECID);
    });
    return { names: Array.from(names), isins: Array.from(isins) };
  }, [favBondsRaw]);

  // 2. Многофакторная фильтрация внутри портфеля
  const filteredFavBonds = useMemo(() => {
    return favBondsRaw.filter(b => {
      const matchSector = filters.sector === 'Все' || b.SECTOR === filters.sector;
      const matchNames = filters.selectedNames.length === 0 || filters.selectedNames.includes(b.SHORTNAME);
      const matchISIN = filters.selectedISINs.length === 0 || filters.selectedISINs.includes(b.SECID) || (b.ISIN && filters.selectedISINs.includes(b.ISIN));
      const matchYieldMin = filters.yieldMin === '' || (b.YIELD && b.YIELD >= parseFloat(filters.yieldMin));
      const matchYieldMax = filters.yieldMax === '' || (b.YIELD && b.YIELD <= parseFloat(filters.yieldMax));
      
      return matchSector && matchNames && matchISIN && matchYieldMin && matchYieldMax;
    });
  }, [favBondsRaw, filters]);

  if (loading) return <div className="p-5 text-center text-white">Загрузка портфеля...</div>;

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 60px)', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
      
      {/* ЛЕВАЯ ПАНЕЛЬ: САЙДБАР С ФИЛЬТРАМИ ПОРТФЕЛЯ */}
      <aside style={{ 
        width: '320px', 
        minWidth: '320px', 
        borderRight: '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-card)', 
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h6 className="mb-4 text-white d-flex align-items-center" style={{ fontWeight: 'bold' }}>
          <span className="me-2">📁</span> Фильтры портфеля
        </h6>

        {/* Сектор */}
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

        {/* Доходность */}
        <div className="mb-4">
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Доходность к пог., %</label>
          <div className="d-flex gap-2 mt-1">
            <input 
              type="number" className="form-control form-control-sm bg-dark text-white shadow-none border-secondary" 
              value={filters.yieldMin} onChange={(e) => filters.setYieldMin(e.target.value)} placeholder="От" 
            />
            <input 
              type="number" className="form-control form-control-sm bg-dark text-white shadow-none border-secondary" 
              value={filters.yieldMax} onChange={(e) => filters.setYieldMax(e.target.value)} placeholder="До" 
            />
          </div>
        </div>

        {/* Мультивыбор: Названия */}
        <MultiSelectFilter 
          label="Название эмитента" 
          placeholder="Поиск в портфеле..."
          options={filterOptions.names}
          selected={filters.selectedNames}
          onChange={filters.setSelectedNames}
        />

        {/* Мультивыбор: ISIN */}
        <MultiSelectFilter 
          label="Код бумаги (SECID)" 
          placeholder="Поиск по коду..."
          options={filterOptions.isins}
          selected={filters.selectedISINs}
          onChange={filters.setSelectedISINs}
        />

        <button 
          className="btn btn-outline-secondary btn-sm mt-auto w-100" 
          style={{ fontSize: '12px' }}
          onClick={() => {
            filters.setSector('Все');
            filters.setSelectedNames([]);
            filters.setSelectedISINs([]);
            filters.setYieldMin('');
            filters.setYieldMax('');
          }}
        >
          Сбросить фильтры
        </button>
      </aside>

      {/* ПРАВАЯ ПАНЕЛЬ: ТАБЛИЦА С ВЫБРАННЫМИ БУМАГАМИ */}
      <section style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 text-white" style={{ fontWeight: 'bold' }}>Ваш инвестиционный портфель</h4>
          <span className="badge bg-dark text-muted" style={{ border: '1px solid var(--border-color)' }}>
            Отображено: {filteredFavBonds.length} из {favorites.length}
          </span>
        </div>

        <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <table className="table table-hover table-dark m-0" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: 'var(--bg-main)' }}>
              <tr>
                <th style={{ width: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Удалить</th>
                <th style={{ color: 'var(--text-muted)' }}>Наименование бумаги / Код</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Текущая цена</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)' }}>Доходность к пог.</th>
                <th style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '20px' }}>Ближ. Купон</th>
              </tr>
            </thead>
            <tbody>
              {filteredFavBonds.map(b => (
                <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <span 
                      onClick={() => toggleFavorite(b.SECID)} 
                      style={{ cursor: 'pointer', color: '#e74c3c', fontSize: '16px', fontWeight: 'bold' }}
                    >
                      ✕
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{b.SHORTNAME}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.SECID}</div>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{b.LAST ? `${Number(b.LAST).toFixed(2)}%` : '-'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                    {b.YIELD ? `${Number(b.YIELD).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '20px', color: '#fff' }}>
                    {b.NEXTCOUPON ? b.NEXTCOUPON : '-'}
                  </td>
                </tr>
              ))}
              {filteredFavBonds.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-5 text-muted">
                    {favorites.length === 0 
                      ? 'В избранном пусто. Добавьте бумаги на странице Скринера.' 
                      : 'Нет бумаг, соответствующих выбранным фильтрам портфеля.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default FavoritesPage;