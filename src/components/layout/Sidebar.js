import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../store/AppContext';

// Оптимизированный выпадающий список (остается без изменений)
const DropdownFilter = ({ label, placeholder, options, selected, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const MAX_ITEMS = 50;
  const displayedOptions = filteredOptions.slice(0, MAX_ITEMS);
  const hasMore = filteredOptions.length > MAX_ITEMS;

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="mb-4" ref={wrapperRef} style={{ position: 'relative' }}>
      <label style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
        {label}
        {selected.length > 0 && <span style={{ color: 'var(--accent-green)', marginLeft: '8px' }}>({selected.length})</span>}
      </label>
      
      <input
        type="text"
        className="form-control form-control-sm shadow-none"
        placeholder={placeholder}
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onClick={() => setIsOpen(true)}
        style={{ backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)', cursor: 'text' }}
      />

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '0 0 4px 4px', maxHeight: '250px', overflowY: 'auto',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)', borderTop: 'none'
        }}>
          {displayedOptions.length === 0 ? (
            <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>Ничего не найдено</div>
          ) : (
            displayedOptions.map(opt => (
              <div 
                key={opt}
                onClick={() => toggleOption(opt)}
                style={{
                  padding: '6px 12px', fontSize: '13px', color: '#fff', cursor: 'pointer',
                  backgroundColor: selected.includes(opt) ? 'rgba(8, 153, 129, 0.15)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center'
                }}
              >
                <input type="checkbox" checked={selected.includes(opt)} readOnly style={{ marginRight: '10px', cursor: 'pointer' }} />
                {opt}
              </div>
            ))
          )}
          
          {hasMore && (
            <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', backgroundColor: 'var(--bg-main)' }}>
              Показано {MAX_ITEMS} из {filteredOptions.length}. Введите текст для уточнения.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { filters, bonds } = useContext(AppContext);

  // 1. ДИНАМИЧЕСКИЙ СПИСОК НАЗВАНИЙ (Зависит от Сектора, Доходности и выбранных ISIN)
  const dynamicNames = useMemo(() => {
    return Array.from(new Set(
      bonds.filter(b => {
        const isGov = b.SHORTNAME && b.SHORTNAME.toUpperCase().includes('ОФЗ');
        if (filters.sector === 'Государственные' && !isGov) return false;
        if (filters.sector === 'Корпоративные' && isGov) return false;

        if (filters.yieldMin && b.YIELD < Number(filters.yieldMin)) return false;
        if (filters.yieldMax && b.YIELD > Number(filters.yieldMax)) return false;

        if (filters.selectedISINs.length > 0 && !filters.selectedISINs.includes(b.SECID)) return false;

        return true;
      }).map(b => b.SHORTNAME).filter(Boolean)
    )).sort();
  }, [bonds, filters.sector, filters.yieldMin, filters.yieldMax, filters.selectedISINs]);

  // 2. ДИНАМИЧЕСКИЙ СПИСОК ISIN (Зависит от Сектора, Доходности и выбранных Названий)
  const dynamicISINs = useMemo(() => {
    return Array.from(new Set(
      bonds.filter(b => {
        const isGov = b.SHORTNAME && b.SHORTNAME.toUpperCase().includes('ОФЗ');
        if (filters.sector === 'Государственные' && !isGov) return false;
        if (filters.sector === 'Корпоративные' && isGov) return false;

        if (filters.yieldMin && b.YIELD < Number(filters.yieldMin)) return false;
        if (filters.yieldMax && b.YIELD > Number(filters.yieldMax)) return false;

        if (filters.selectedNames.length > 0 && !filters.selectedNames.includes(b.SHORTNAME)) return false;

        return true;
      }).map(b => b.SECID).filter(Boolean)
    )).sort();
  }, [bonds, filters.sector, filters.yieldMin, filters.yieldMax, filters.selectedNames]);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', padding: '20px', overflowY: 'auto', paddingBottom: '100px' }}>
      <h6 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>Фильтры</h6>

      {/* ФИЛЬТР: СЕКТОР */}
      <div className="mb-4">
        <label style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Сектор</label>
        <select 
          className="form-select form-select-sm shadow-none" 
          value={filters.sector}
          onChange={(e) => {
            filters.setSector(e.target.value);
            // УМНЫЙ СБРОС: Если сменили сектор, очищаем зависимые поля
            filters.setSelectedNames([]);
            filters.setSelectedISINs([]);
          }}
          style={{ backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          <option value="Все">Все</option>
          <option value="Государственные">Государственные (ОФЗ)</option>
          <option value="Корпоративные">Корпоративные</option>
        </select>
      </div>

      {/* ФИЛЬТР: НАЗВАНИЕ */}
      <DropdownFilter 
        label="Название бумаги"
        placeholder="Поиск по названию..."
        options={dynamicNames}
        selected={filters.selectedNames}
        onChange={filters.setSelectedNames}
      />

      {/* ФИЛЬТР: ISIN */}
      <DropdownFilter 
        label="ISIN / Тикер"
        placeholder="Поиск по ISIN..."
        options={dynamicISINs}
        selected={filters.selectedISINs}
        onChange={filters.setSelectedISINs}
      />

      {/* ФИЛЬТР: ДОХОДНОСТЬ */}
      <div className="mb-4">
        <label style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Доходность (%)</label>
        <div className="d-flex justify-content-between align-items-center">
          <input 
            type="number" min="0" step="0.1"
            className="form-control form-control-sm shadow-none text-center" 
            placeholder="От 0"
            value={filters.yieldMin}
            onChange={(e) => { if (Number(e.target.value) >= 0 || e.target.value === '') filters.setYieldMin(e.target.value); }}
            style={{ width: '45%', backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            type="number" min="0" step="0.1"
            className="form-control form-control-sm shadow-none text-center" 
            placeholder="До"
            value={filters.yieldMax}
            onChange={(e) => { if (Number(e.target.value) >= 0 || e.target.value === '') filters.setYieldMax(e.target.value); }}
            style={{ width: '45%', backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>
      
      {/* КНОПКА СБРОСА */}
      <button 
        className="btn btn-sm w-100 mt-2" 
        style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
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
    </div>
  );
};

export default Sidebar;