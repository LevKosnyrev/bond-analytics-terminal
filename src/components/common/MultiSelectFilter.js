import React, { useMemo, useState } from 'react';

// Мультивыбор со скроллом и моментальным раскрытием списка при фокусе.
// Общий компонент для страниц «Поиск» и «Избранное».
const MultiSelectFilter = ({ label, placeholder, options, selected, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Фильтруем опции по введённому тексту и исключаем уже выбранные элементы
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

      {/* Список показывается сразу при фокусе, со скроллом и ограничением высоты */}
      {isOpen && filteredOptions.length > 0 && (
        <ul className="list-group position-absolute w-100" style={{
          zIndex: 1000,
          top: '60px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
          maxHeight: '180px',
          overflowY: 'auto',
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

export default MultiSelectFilter;
