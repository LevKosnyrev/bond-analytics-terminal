import React, { useContext, useMemo } from 'react';
import { AppContext } from '../store/AppContext';

const FavoritesPage = () => {
  const { bonds, favorites, toggleFavorite, loading } = useContext(AppContext);

  const favBondsList = useMemo(() => {
    return bonds.filter(b => favorites.includes(b.SECID));
  }, [bonds, favorites]);

  if (loading) return <div className="p-5 text-center text-white">Синхронизация портфеля...</div>;

  return (
    <div className="p-4" style={{ height: 'calc(100vh - 60px)', overflowY: 'auto', width: '100%', backgroundColor: 'var(--bg-main)', color: '#fff' }}>
      <h3 className="mb-4">Ваш инвестиционный портфель (Избранное)</h3>

      <div className="card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="card-body p-0">
          <table className="table table-hover table-dark m-0" style={{ fontSize: '13.5px' }}>
            <thead style={{ backgroundColor: 'var(--bg-main)' }}>
              <tr>
                <th style={{ paddingLeft: '15px', width: '80px', color: 'var(--text-muted)' }}>Удалить</th>
                <th style={{ color: 'var(--text-muted)' }}>Наименование бумаги / ISIN</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Текущая цена</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Доходность к пог.</th>
                <th style={{ color: 'var(--text-muted)', textAlign: 'right', paddingRight: '15px' }}>Ближ. Купон</th>
              </tr>
            </thead>
            <tbody>
              {favBondsList.length > 0 ? favBondsList.map(b => (
                <tr key={b.SECID} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ paddingLeft: '15px', verticalAlign: 'middle' }}>
                    <span onClick={() => toggleFavorite(b.SECID)} style={{ cursor: 'pointer', color: '#e74c3c', fontSize: '18px', fontWeight: 'bold' }}>✕</span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{b.SHORTNAME}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.SECID}</div>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>{b.LAST ? `${Number(b.LAST).toFixed(2)}%` : '-'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                    {b.YIELD ? `${Number(b.YIELD).toFixed(2)}%` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '15px', color: '#fff' }}>
                    {b.NEXTCOUPON ? b.NEXTCOUPON : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center p-5 text-muted">
                    В избранном пусто. Перейдите в Скринер, чтобы добавить свои первые бумаги.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;