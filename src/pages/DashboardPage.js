import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../store/AppContext';

const fmt    = (n, d = 2) => (n != null ? Number(n).toFixed(d) : '—');
const fmtVol = (v) => v ? new Intl.NumberFormat('ru-RU').format(Math.round(v)) : '—';

// ── Карточка облигации на карте рынка ──────────────────────────────────────
const BondCard = ({ bond, onClick }) => {
  const hasChange = bond.change !== null;
  const isPos     = hasChange && bond.change >= 0;
  const opacity   = hasChange ? Math.min(Math.max(Math.abs(bond.change) * 2, 0.25), 0.85) : 0.2;
  const bg        = isPos
    ? `rgba(38,166,154,${opacity})`
    : `rgba(239,83,80,${opacity})`;

  return (
    <button
      onClick={() => onClick(bond)}
      style={{
        width: '100%',
        height: '72px',
        backgroundColor: bg,
        border: 'none',
        borderRadius: '6px',
        padding: '9px 10px',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'left',
        transition: 'filter 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px', overflow: 'hidden' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {bond.SHORTNAME}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {bond.ISIN || bond.SECID}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
          {fmt(bond.LAST)}%
        </div>
        <div style={{ fontSize: '11px' }}>
          {hasChange ? `${bond.change > 0 ? '+' : ''}${fmt(bond.change)}%` : '—'}
        </div>
      </div>
    </button>
  );
};

// ── Карта рынка ────────────────────────────────────────────────────────────
const MarketMap = ({ bonds, onBondClick }) => {
  const allBonds = useMemo(() => {
    const withChange = (arr) =>
      arr.map(b => ({
        ...b,
        change: b.LAST && b.PREVWAPRICE
          ? ((b.LAST - b.PREVWAPRICE) / b.PREVWAPRICE) * 100
          : null,
      }));

    const ofz = withChange(
      [...bonds]
        .filter(b => b.SECTOR === 'Государственные' && b.LAST > 0 && b.VALTODAY > 0)
        .sort((a, b) => b.VALTODAY - a.VALTODAY)
        .slice(0, 5)
    );
    const corp = withChange(
      [...bonds]
        .filter(b => b.SECTOR === 'Корпоративные' && b.LAST > 0 && b.VALTODAY > 0 && (b.LISTLEVEL === 1 || b.LISTLEVEL === 2))
        .sort((a, b) => b.VALTODAY - a.VALTODAY)
        .slice(0, 10)
    );
    return [...ofz, ...corp];
  }, [bonds]);

  return (
    <div className="p-3 rounded h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h5 style={{ color: '#fff', marginBottom: '12px', fontWeight: 'bold' }}>Карта рынка</h5>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
        {allBonds.map(b => (
          <BondCard key={b.SECID} bond={b} onClick={onBondClick} />
        ))}
      </div>
    </div>
  );
};

// ── Календарь событий ──────────────────────────────────────────────────────
const TradingCalendar = ({ bonds }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { redemptions, coupons } = useMemo(() => ({
    redemptions: bonds.filter(b => b.MATDATE    === selectedDate),
    coupons:     bonds.filter(b => b.NEXTCOUPON === selectedDate),
  }), [bonds, selectedDate]);

  return (
    <div className="p-3 rounded h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>Календарь событий</h5>
        <input
          type="date"
          className="form-control form-control-sm w-auto shadow-none"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ cursor: 'pointer', backgroundColor: 'var(--bg-main)', color: '#fff', borderColor: 'var(--border-color)' }}
        />
      </div>

      <div className="row text-light">
        <div className="col-md-6 mb-3 mb-md-0">
          <h6 style={{ color: '#ef5350', borderBottom: '2px solid #ef5350', paddingBottom: '8px' }}>
            Погашения ({redemptions.length})
          </h6>
          <ul style={{ fontSize: '13px', paddingLeft: '20px', maxHeight: '200px', overflowY: 'auto' }}>
            {redemptions.length > 0
              ? redemptions.map(b => (
                <li key={b.SECID} className="mb-1">
                  {b.SHORTNAME} <span style={{ color: 'var(--text-muted)' }}>({b.SECID})</span>
                </li>
              ))
              : <li className="list-unstyled" style={{ color: 'var(--text-muted)' }}>Нет событий</li>
            }
          </ul>
        </div>
        <div className="col-md-6">
          <h6 style={{ color: 'var(--accent-green)', borderBottom: '2px solid var(--accent-green)', paddingBottom: '8px' }}>
            Выплата купонов ({coupons.length})
          </h6>
          <ul style={{ fontSize: '13px', paddingLeft: '20px', maxHeight: '200px', overflowY: 'auto' }}>
            {coupons.length > 0
              ? coupons.map(b => (
                <li key={b.SECID} className="mb-1">
                  {b.SHORTNAME} <span style={{ color: 'var(--text-muted)' }}>({fmt(b.COUPONVALUE)} ₽)</span>
                </li>
              ))
              : <li className="list-unstyled" style={{ color: 'var(--text-muted)' }}>Нет событий</li>
            }
          </ul>
        </div>
      </div>
    </div>
  );
};

// ── Таблица радара ─────────────────────────────────────────────────────────
const RadarTable = ({ title, data, valueLabel, getValue, onRowClick }) => (
  <div className="card h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
      {title}
    </div>
    <div className="card-body p-0">
      <table className="table table-sm table-hover table-dark m-0" style={{ fontSize: '12px', backgroundColor: 'transparent' }}>
        <thead style={{ backgroundColor: 'var(--bg-main)' }}>
          <tr>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', paddingLeft: '12px', borderBottom: '1px solid var(--border-color)', width: '40%' }}>Бумага</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', textAlign: 'right', borderBottom: '1px solid var(--border-color)', width: '18%' }}>Цена</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', textAlign: 'right', borderBottom: '1px solid var(--border-color)', width: '18%' }}>Изм.</th>
            <th style={{ color: 'var(--text-muted)', fontWeight: 'normal', textAlign: 'right', paddingRight: '12px', borderBottom: '1px solid var(--border-color)', width: '24%' }}>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map(b => {
            const chg = b.LAST && b.PREVWAPRICE
              ? ((b.LAST - b.PREVWAPRICE) / b.PREVWAPRICE) * 100
              : null;
            const chgColor = chg > 0 ? 'var(--accent-green)' : chg < 0 ? '#ef5350' : 'var(--text-muted)';
            return (
              <tr key={b.SECID} onClick={() => onRowClick(b)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <td style={{ paddingLeft: '12px', overflow: 'hidden', maxWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.SHORTNAME}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {b.ISIN || b.SECID}
                  </div>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', color: '#fff' }}>
                  {fmt(b.LAST || b.PREVWAPRICE)}%
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', color: chgColor, fontWeight: '600' }}>
                  {chg != null ? `${chg > 0 ? '+' : ''}${fmt(chg)}%` : '—'}
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '12px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                  {getValue(b)}
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan="4" className="text-center text-muted p-3">Нет данных</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Главный компонент ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const { bonds, loading, error, navigateToBond } = useContext(AppContext);

  const radars = useMemo(() => {
    if (!bonds.length) return { topLiquid: [], topYield: [], cashParking: [] };

    const topLiquid = [...bonds]
      .filter(b => b.VALTODAY > 0 && b.LAST > 0)
      .sort((a, b) => b.VALTODAY - a.VALTODAY)
      .slice(0, 5);

    const topYield = [...bonds]
      .filter(b => (b.LISTLEVEL === 1 || b.LISTLEVEL === 2) && b.YIELD > 0 && b.LAST > 0)
      .sort((a, b) => b.YIELD - a.YIELD)
      .slice(0, 5);

    // Краткосрочные вложения: цена < 100, есть доходность, надёжные (уровень 1-2)
    const cashParking = [...bonds]
      .filter(b => b.LAST > 0 && b.LAST < 100 && b.YIELD > 0 && (b.LISTLEVEL === 1 || b.LISTLEVEL === 2))
      .sort((a, b) => b.YIELD - a.YIELD)
      .slice(0, 5);

    return { topLiquid, topYield, cashParking };
  }, [bonds]);

  if (loading) return (
    <div className="p-5 text-center text-white" style={{ width: '100%' }}>
      Загрузка аналитики рынка...
    </div>
  );

  if (error) return (
    <div className="p-5 text-center" style={{ width: '100%', color: 'var(--accent-red)' }}>
      {error}
    </div>
  );

  return (
    <div className="p-4" style={{ height: 'calc(100vh - 60px)', overflowY: 'auto', width: '100%', paddingBottom: '80px', backgroundColor: 'var(--bg-main)' }}>
      <h3 className="mb-4 text-white">Обзор рынка облигаций</h3>

      {/* Карта + Календарь */}
      <div className="row mb-4 g-4">
        <div className="col-lg-7">
          <MarketMap bonds={bonds} onBondClick={navigateToBond} />
        </div>
        <div className="col-lg-5">
          <TradingCalendar bonds={bonds} />
        </div>
      </div>

      {/* Радары */}
      <h5 className="text-white mb-3" style={{ fontSize: '15px', letterSpacing: '0.3px' }}>
        Автоматические радары рынка
      </h5>
      <div className="row g-4">
        <div className="col-md-4">
          <RadarTable
            title="Топ ликвидности"
            data={radars.topLiquid}
            valueLabel="Объём"
            getValue={b => `${fmtVol(b.VALTODAY)} ₽`}
            onRowClick={navigateToBond}
          />
        </div>
        <div className="col-md-4">
          <RadarTable
            title="Макс. доходность"
            data={radars.topYield}
            valueLabel="Доходность"
            getValue={b => `${fmt(b.YIELD)}%`}
            onRowClick={navigateToBond}
          />
        </div>
        <div className="col-md-4">
          <RadarTable
            title="Краткосрочные вложения"
            data={radars.cashParking}
            valueLabel="Доходность"
            getValue={b => `${fmt(b.YIELD)}%`}
            onRowClick={navigateToBond}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
