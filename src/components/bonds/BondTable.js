import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../store/AppContext';

const BondTable = ({ bonds, onSelectBond }) => {
  const { favorites, toggleFavorite } = useContext(AppContext);
  const [visibleCount, setVisibleCount] = useState(100);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    setVisibleCount(100);
  }, [bonds]);

  const handleScroll = () => {
    if (!tableContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
    
    if (scrollHeight - scrollTop - clientHeight < 300) {
      if (visibleCount < bonds.length) {
        setVisibleCount(prev => prev + 100);
      }
    }
  };

  const formatNum = (num, decimals = 2) => (num != null ? Number(num).toFixed(decimals) : '-');
  
  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatVolume = (val) => {
    if (!val && val !== 0) return '-';
    return new Intl.NumberFormat('ru-RU').format(Math.round(val));
  };

  const formatCurrency = (currencyCode) => {
    switch (currencyCode) {
      case 'SUR': 
      case 'RUB': return '₽';
      case 'USD': return '$';
      case 'CNY': return '¥';
      case 'EUR': return '€';
      default: return currencyCode || '';
    }
  };

  const formatCouponPeriod = (days) => {
    if (!days) return '-';
    if (days >= 350) return '1 раз в год';
    if (days >= 170 && days <= 190) return '2 раза в год';
    if (days >= 80 && days <= 100) return '4 раза в год';
    if (days >= 25 && days <= 35) return '12 раз в год';
    return `${days} дн.`; 
  };

  const getBondType = (bond) => {
    const name = bond.SHORTNAME ? bond.SHORTNAME.toUpperCase() : '';
    if (name.includes('ОФЗ')) {
      if (name.includes('ПК')) return 'Флоатер (ПК)';
      if (name.includes('ИН')) return 'Линкер (ИН)';
      return 'Фикс (ОФЗ)';
    }
    if (bond.LAST > 0 && (!bond.YIELD || bond.YIELD === 0) && (!bond.DURATION || bond.DURATION === 0)) {
      return 'Флоатер (Переменный)';
    }
    return 'Фикс (Постоянный)';
  };

  if (!bonds || bonds.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-muted)', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        Облигации, подходящие под фильтры, не найдены.
      </div>
    );
  }

  const visibleBonds = bonds.slice(0, visibleCount);

  return (
    <div 
      ref={tableContainerRef}
      onScroll={handleScroll}
      className="table-responsive" 
      style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}
    >
      <table className="table table-hover mb-0" style={{ color: '#000', fontSize: '13px', whiteSpace: 'nowrap' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <tr>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>⭐</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>Тикер</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>ISIN</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>Название</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>Уровень</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>Тип купона</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Номинал</th>
            
            {/* НОВЫЕ КОЛОНКИ: Bid / Ask и Спред */}
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Bid / Ask (%)</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Bid / Ask Спред</th>
            
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Цена (%)</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Доходность</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Дюрация (дни)</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>НКД</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Ставка купона</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Купон</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Период</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>След. купон</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Погашение</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'right' }}>Объем торгов</th>
          </tr>
        </thead>
        
        <tbody>
          {visibleBonds.map((bond) => {
            const isFav = favorites.includes(bond.SECID);
            const currencySym = formatCurrency(bond.CURRENCYID);
            const currentPrice = bond.LAST || bond.PREVWAPRICE || '-';
            
            // Логика расчета спреда
            const hasBidAsk = bond.BID > 0 && bond.OFFER > 0;
            const spreadValue = hasBidAsk ? (bond.OFFER - bond.BID) : null;
            
            // Если спред больше 1%, подсвечиваем его красным (опасно, низкая ликвидность)
            const spreadColor = spreadValue > 1 ? '#e74c3c' : '#666';

            return (
              <tr 
                key={bond.SECID} 
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => onSelectBond(bond.SECID)}
              >
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }} onClick={(e) => { e.stopPropagation(); toggleFavorite(bond.SECID); }}>
                  <span style={{ cursor: 'pointer', opacity: isFav ? 1 : 0.2, color: isFav ? '#f1c40f' : '#000', fontSize: '16px' }}>★</span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-blue)', fontWeight: 'bold' }}>{bond.SECID}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: '#666', fontSize: '12px' }}>{bond.ISIN}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: '#000' }}>{bond.SHORTNAME}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: '#000', textAlign: 'center' }}>{bond.LISTLEVEL || '-'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', color: '#666', fontSize: '12px', fontWeight: '500' }}>{getBondType(bond)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{formatNum(bond.FACEVALUE, 0)} {currencySym}</td>
                
                {/* ВЫВОД Bid / Ask */}
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000', fontSize: '12px' }}>
                  {hasBidAsk ? (
                    <span>
                      <span style={{ color: 'var(--accent-green)' }}>{formatNum(bond.BID)}</span>
                      <span style={{ color: '#ccc', margin: '0 4px' }}>/</span>
                      <span style={{ color: '#e74c3c' }}>{formatNum(bond.OFFER)}</span>
                    </span>
                  ) : '-'}
                </td>
                
                {/* ВЫВОД Спреда с цветовой индикацией */}
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: spreadColor, fontWeight: spreadValue > 1 ? 'bold' : 'normal' }}>
                  {spreadValue != null ? formatNum(spreadValue) : '-'}
                </td>
                
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000', fontWeight: 'bold' }}>{currentPrice}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: bond.YIELD > 15 ? 'var(--accent-green)' : '#000', fontWeight: bond.YIELD > 15 ? 'bold' : 'normal' }}>{bond.YIELD ? `${formatNum(bond.YIELD)}%` : '-'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{bond.DURATION || '-'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{formatNum(bond.ACCRUEDINT)} {currencySym}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{bond.COUPONPERCENT ? `${formatNum(bond.COUPONPERCENT)}%` : '-'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{formatNum(bond.COUPONVALUE)} {currencySym}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#666' }}>{formatCouponPeriod(bond.COUPONPERIOD)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{formatDate(bond.NEXTCOUPON)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#000' }}>{formatDate(bond.MATDATE)}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', color: '#666' }}>{formatVolume(bond.VALTODAY)} {currencySym}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BondTable;