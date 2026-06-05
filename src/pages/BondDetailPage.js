import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../store/AppContext';
import { moexApi } from '../api/moexApi';
import BondChart from '../components/charts/BondChart';

const fmt  = (n, d = 2) => (n != null && n !== '' ? Number(n).toFixed(d) : '—');
const fmtVol = (v) => v ? new Intl.NumberFormat('ru-RU').format(Math.round(v)) : '—';
const fmtDate = (s) => {
  if (!s || s === '0000-00-00') return '—';
  const [y, m, d] = s.split('-');
  return `${d}.${m}.${y}`;
};

const LEVEL = { 1: '1 уровень', 2: '2 уровень', 3: '3 уровень' };

const MetricBox = ({ label, value, color, large }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
  }}>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: large ? '22px' : '17px', fontWeight: 'bold', color: color || '#fff' }}>{value}</div>
  </div>
);

const InfoBlock = ({ title, rows }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0',
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '12px',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '600',
    }}>
      {title}
    </div>
    {rows.map(([label, value, color], i) => (
      <div key={i} style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '9px 16px',
        borderBottom: i < rows.length - 1 ? '1px solid var(--border-color)' : 'none',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '13px', color: color || '#fff', fontWeight: '600' }}>{value}</span>
      </div>
    ))}
  </div>
);

const BondDetailPage = ({ bond, onBack }) => {
  const { toggleFavorite, favorites } = useContext(AppContext);
  const [candles, setCandles] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    if (!bond?.SECID) return;
    let active = true;
    setChartLoading(true);
    moexApi.getCandles(bond.SECID).then(data => {
      if (active) {
        setCandles(data);
        setChartLoading(false);
      }
    });
    return () => { active = false; };
  }, [bond?.SECID]);

  if (!bond) return (
    <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
      Облигация не выбрана
    </div>
  );

  const dayChange = bond.LAST && bond.PREVWAPRICE
    ? ((bond.LAST - bond.PREVWAPRICE) / bond.PREVWAPRICE) * 100
    : null;
  const changeColor = dayChange > 0 ? 'var(--accent-green)' : dayChange < 0 ? '#ef5350' : 'var(--text-muted)';
  const isFav = favorites.includes(bond.SECID);

  const sectorColor = bond.SECTOR === 'Государственные'
    ? { bg: 'rgba(38,166,154,0.15)', text: 'var(--accent-green)' }
    : { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg-main)', padding: '24px 32px', width: '100%' }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '14px', padding: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        ← Вернуться на главную
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '24px' }}>
            {bond.SHORTNAME}
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{bond.ISIN}</span>
            <span style={{ color: 'var(--border-color)' }}>•</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{bond.SECID}</span>
            {bond.SECTOR && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: sectorColor.bg, color: sectorColor.text, fontWeight: '600' }}>
                {bond.SECTOR}
              </span>
            )}
            {bond.LISTLEVEL && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)', fontWeight: '600' }}>
                {LEVEL[bond.LISTLEVEL] || `${bond.LISTLEVEL} уровень`}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => toggleFavorite(bond.SECID)}
          style={{
            background: isFav ? 'rgba(255,200,0,0.12)' : 'transparent',
            border: `1px solid ${isFav ? '#ffc800' : 'var(--border-color)'}`,
            color: isFav ? '#ffc800' : 'var(--text-muted)',
            borderRadius: '6px',
            padding: '7px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {isFav ? '★ В избранном' : '☆ В избранное'}
        </button>
      </div>

      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <MetricBox label="Цена"         value={bond.LAST  ? `${fmt(bond.LAST)}%`          : '—'} large />
        <MetricBox label="Изм. за день" value={dayChange != null ? `${dayChange > 0 ? '+' : ''}${fmt(dayChange)}%` : '—'} color={changeColor} />
        <MetricBox label="Доходность"   value={bond.YIELD ? `${fmt(bond.YIELD)}%`          : '—'} color="var(--accent-green)" />
        <MetricBox label="Дюрация"      value={bond.DURATION ? `${Math.round(bond.DURATION)} дн.` : '—'} />
        <MetricBox label="НКД"          value={bond.ACCRUEDINT ? `${fmt(bond.ACCRUEDINT)} ₽` : '—'} />
      </div>

      {/* Detail blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        <InfoBlock title="Торговые данные" rows={[
          ['Цена покупки (BID)',    bond.BID    ? `${fmt(bond.BID)}%`    : '—'],
          ['Цена продажи (OFFER)',  bond.OFFER  ? `${fmt(bond.OFFER)}%`  : '—'],
          ['Открытие',             bond.OPEN   ? `${fmt(bond.OPEN)}%`   : '—'],
          ['Максимум',             bond.HIGH   ? `${fmt(bond.HIGH)}%`   : '—'],
          ['Минимум',              bond.LOW    ? `${fmt(bond.LOW)}%`    : '—'],
          ['Объём торгов',         bond.VALTODAY ? `${fmtVol(bond.VALTODAY)} ₽` : '—'],
          ['Кол-во сделок',        bond.NUMTRADES ? fmtVol(bond.NUMTRADES) : '—'],
        ]} />

        <InfoBlock title="Купонные данные" rows={[
          ['Ставка купона',  bond.COUPONPERCENT ? `${fmt(bond.COUPONPERCENT)}%` : '—', 'var(--accent-green)'],
          ['Размер купона',  bond.COUPONVALUE   ? `${fmt(bond.COUPONVALUE)} ₽`  : '—'],
          ['Дата выплаты',   fmtDate(bond.NEXTCOUPON)],
          ['НКД',            bond.ACCRUEDINT    ? `${fmt(bond.ACCRUEDINT)} ₽`   : '—'],
        ]} />

        <InfoBlock title="Основные параметры" rows={[
          ['Номинал',         bond.FACEVALUE ? `${new Intl.NumberFormat('ru-RU').format(bond.FACEVALUE)} ${bond.FACEUNIT || 'RUB'}` : '—'],
          ['Дата погашения',  fmtDate(bond.MATDATE)],
          ['Уровень листинга', LEVEL[bond.LISTLEVEL] || '—'],
          ['Сектор',          bond.SECTOR || '—'],
        ]} />

      </div>

      {/* График котировок */}
      <div style={{
        marginTop: '20px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600',
        }}>
          График котировок · цена в % от номинала · за последний год
        </div>
        <div style={{ height: '360px', padding: '12px' }}>
          {chartLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Загрузка графика...
            </div>
          ) : candles.length > 0 ? (
            <BondChart data={candles} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Недостаточно данных для построения графика
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BondDetailPage;
