import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../store/AppContext';

const formatNum = (num, dec = 2) => (num != null ? Number(num).toFixed(dec) : '-');
const formatVol = (val) => val ? new Intl.NumberFormat('ru-RU').format(Math.round(val)) : '-';

// --- КОМПОНЕНТ: Тепловая карта (Темная тема) ---
const MarketMap = ({ bonds }) => {
  const mapData = useMemo(() => {
    return [...bonds]
      .filter(b => b.LAST > 0 && b.PREVWAPRICE > 0 && b.VALTODAY > 1000000 && (b.LISTLEVEL === 1 || b.LISTLEVEL === 2))
      .sort((a, b) => b.VALTODAY - a.VALTODAY)
      .slice(0, 15)
      .map(b => {
        const change = ((b.LAST - b.PREVWAPRICE) / b.PREVWAPRICE) * 100;
        return { ...b, change };
      });
  }, [bonds]);

  return (
    <div className="p-3 rounded h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h5 style={{ color: '#fff', marginBottom: '15px', fontWeight: 'bold' }}>Карта рынка (Облигации)</h5>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {mapData.map(b => {
          const isPos = b.change > 0;
          const opacity = Math.min(Math.max(Math.abs(b.change) * 1.5, 0.4), 0.9);
          const bgColor = isPos ? `rgba(38, 166, 154, ${opacity})` : `rgba(239, 83, 80, ${opacity})`;
          
          return (
            <div key={b.SECID} style={{
              flex: '1 1 calc(20% - 4px)', minWidth: '120px', height: '90px', 
              backgroundColor: bgColor || '#e0e0e0', color: '#fff',
              padding: '8px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              overflow: 'hidden' 
            }}>
              <div style={{ width: '100%' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  width: '100%'
                }}>
                  {b.SHORTNAME}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                  {b.SECID}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{formatNum(b.LAST)}</div>
                <div style={{ fontSize: '12px' }}>{b.change > 0 ? '+' : ''}{formatNum(b.change)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ: Календарь (Темная тема) ---
const TradingCalendar = ({ bonds }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { redemptions, coupons } = useMemo(() => {
    const reds = bonds.filter(b => b.MATDATE === selectedDate);
    const coups = bonds.filter(b => b.NEXTCOUPON === selectedDate);
    return { redemptions: reds, coupons: coups };
  }, [bonds, selectedDate]);

  return (
    <div className="p-3 rounded h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>Календарь событий</h5>
        <input 
          type="date" 
          className="form-control form-control-sm w-auto shadow-none" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
          style={{ 
            cursor: 'pointer',
            backgroundColor: 'var(--bg-main)',
            color: '#fff',
            borderColor: 'var(--border-color)'
          }}
        />
      </div>
      
      <div className="row text-light">
        <div className="col-md-6 mb-3 mb-md-0">
          <h6 style={{ color: '#e74c3c', borderBottom: '2px solid #e74c3c', paddingBottom: '8px' }}>
            🔴 Погашаются ({redemptions.length})
          </h6>
          <ul style={{ fontSize: '13px', paddingLeft: '20px', maxHeight: '180px', overflowY: 'auto' }}>
            {redemptions.length > 0 ? redemptions.map(b => (
              <li key={b.SECID} className="mb-1">{b.SHORTNAME} <span style={{ color: 'var(--text-muted)' }}>({b.SECID})</span></li>
            )) : <li style={{color: 'var(--text-muted)'}} className="list-unstyled">Нет событий</li>}
          </ul>
        </div>
        <div className="col-md-6">
          <h6 style={{ color: 'var(--accent-green)', borderBottom: '2px solid var(--accent-green)', paddingBottom: '8px' }}>
            🟢 Выплата купонов ({coupons.length})
          </h6>
          <ul style={{ fontSize: '13px', paddingLeft: '20px', maxHeight: '180px', overflowY: 'auto' }}>
            {coupons.length > 0 ? coupons.map(b => (
              <li key={b.SECID} className="mb-1">{b.SHORTNAME} <span style={{color: 'var(--text-muted)'}}>({b.COUPONVALUE} ₽)</span></li>
            )) : <li style={{color: 'var(--text-muted)'}} className="list-unstyled">Нет событий</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ: MiniTable (Автоматические радары) ---
const MiniTable = ({ title, data, valueLabel, getValue }) => (
  <div className="card h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', color: '#fff', fontWeight: '500' }}>
      {title}
    </div>
    <div className="card-body p-0">
      <table className="table table-sm table-hover table-dark m-0" style={{ fontSize: '13px', backgroundColor: 'transparent', tableLayout: 'fixed' }}>
        <thead style={{ backgroundColor: 'var(--bg-main)' }}>
          <tr>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', paddingLeft: '15px', borderBottom: '1px solid var(--border-color)', width: '50%' }}>Бумага</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', textAlign: 'right', borderBottom: '1px solid var(--border-color)', width: '25%' }}>Цена</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', textAlign: 'right', paddingRight: '15px', borderBottom: '1px solid var(--border-color)', width: '25%' }}>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map(b => (
            <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ paddingLeft: '15px', overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.SHORTNAME}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {b.SECID}
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'middle', color: '#fff' }}>{formatNum(b.LAST || b.PREVWAPRICE)}%</td>
              <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '15px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                {getValue(b)}
              </td>
            </tr>
          )) : <tr><td colSpan="3" className="text-center text-muted p-3">Нет данных</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

// === ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ ===
const DashboardPage = () => {
  const { bonds, favorites, loading } = useContext(AppContext);

  const dataBlocks = useMemo(() => {
    if (!bonds.length) return { topLiquid: [], topSafeYield: [], cashParking: [], favBondsList: [] };

    const liquid = [...bonds].sort((a, b) => (b.VALTODAY || 0) - (a.VALTODAY || 0)).slice(0, 5);
    const safeYield = [...bonds].filter(b => (b.LISTLEVEL === 1 || b.LISTLEVEL === 2) && b.YIELD > 0 && b.LAST > 0).sort((a, b) => b.YIELD - a.YIELD).slice(0, 5);
    const parking = [...bonds].filter(b => {
      if (!b.MATDATE || !b.YIELD) return false;
      const daysToMat = (new Date(b.MATDATE) - new Date()) / (1000 * 60 * 60 * 24);
      return daysToMat > 0 && daysToMat <= 180;
    }).sort((a, b) => b.YIELD - a.YIELD).slice(0, 5);
    const favs = bonds.filter(b => favorites.includes(b.SECID));

    return {
      topLiquid: liquid,
      topSafeYield: safeYield,
      cashParking: parking,
      favBondsList: favs
    };
  }, [bonds, favorites]);

  if (loading) return <div className="p-5 text-center text-white">Загрузка глобальной аналитики...</div>;

  return (
    <div className="p-4" style={{ height: 'calc(100vh - 60px)', overflowY: 'auto', width: '100%', paddingBottom: '80px', backgroundColor: 'var(--bg-main)' }}>
      <h3 className="mb-4 text-white">Обзор рынка облигаций</h3>

      {/* Карта и Календарь */}
      <div className="row mb-4 g-4">
        <div className="col-lg-7">
          <MarketMap bonds={bonds} />
        </div>
        <div className="col-lg-5">
          <TradingCalendar bonds={bonds} />
        </div>
      </div>

      {/* Избранное (С обновленным форматированием) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', color: '#fff', fontWeight: 'bold' }}>
              ⭐ Быстрый доступ: Избранное
            </div>
            <div className="card-body p-0">
              <table className="table table-sm table-hover table-dark m-0" style={{ fontSize: '13px', backgroundColor: 'transparent', tableLayout: 'fixed' }}>
                <thead style={{ backgroundColor: 'var(--bg-main)' }}>
                  <tr>
                    <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', paddingLeft: '15px', borderBottom: '1px solid var(--border-color)', width: '50%' }}>Бумага</th>
                    <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', width: '25%' }}>Цена (%)</th>
                    <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid var(--border-color)', width: '25%' }}>Изм. дня</th>
                  </tr>
                </thead>
                <tbody>
                  {dataBlocks.favBondsList.length > 0 ? dataBlocks.favBondsList.map(b => {
                    const dayChange = b.LAST && b.PREVWAPRICE ? (((b.LAST - b.PREVWAPRICE) / b.PREVWAPRICE) * 100) : 0;
                    const changeColor = dayChange > 0 ? 'var(--accent-green)' : dayChange < 0 ? '#e74c3c' : 'var(--text-muted)';
                    return (
                      <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ paddingLeft: '15px', paddingTop: '8px', paddingBottom: '8px', overflow: 'hidden' }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 'bold', 
                            color: '#fff',
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {b.SHORTNAME}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {b.SECID}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', color: '#fff' }}>{formatNum(b.LAST || b.PREVWAPRICE)}%</td>
                        <td style={{ verticalAlign: 'middle', fontWeight: 'bold', color: changeColor }}>
                          {dayChange !== 0 ? `${dayChange > 0 ? '+' : ''}${formatNum(dayChange)}%` : '0.00%'}
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="3" className="text-center text-muted p-4">Нет добавленных бумаг</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Радары */}
      <h5 className="text-white mb-3" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>📊 Автоматические радары рынка</h5>
      <div className="row g-4">
        <div className="col-md-4"><MiniTable title="🔥 Топ Ликвидности" data={dataBlocks.topLiquid} valueLabel="Объем" getValue={(b) => `${formatVol(b.VALTODAY)} ₽`} /></div>
        <div className="col-md-4"><MiniTable title="🛡️ Макс. доходность (1-2 Ур.)" data={dataBlocks.topSafeYield} valueLabel="Доходность" getValue={(b) => `${formatNum(b.YIELD)}%`} /></div>
        <div className="col-md-4"><MiniTable title="🅿️ Парковка кэша (< 6 мес)" data={dataBlocks.cashParking} valueLabel="Доходность" getValue={(b) => `${formatNum(b.YIELD)}%`} /></div>
      </div>
    </div>
  );
};

export default DashboardPage;