import React, { useState, useEffect } from 'react';
import { aiApi } from '../api/aiApi';

// Цвет по баллу надёжности: красный → жёлтый → зелёный.
const scoreColor = (s) =>
  s >= 70 ? 'var(--accent-green)' : s >= 45 ? '#f0b429' : '#ef5350';

const sentimentStyle = (s) => {
  if (s === 'позитив') return { bg: 'rgba(38,166,154,0.15)', text: 'var(--accent-green)' };
  if (s === 'негатив') return { bg: 'rgba(239,83,80,0.15)', text: '#ef5350' };
  return { bg: 'rgba(255,255,255,0.07)', text: 'var(--text-muted)' };
};

const Panel = ({ title, children }) => (
  <div style={{
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
      {title}
    </div>
    <div style={{ padding: '16px' }}>{children}</div>
  </div>
);

const BondAIInsights = ({ bond }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bond?.SECID) return;
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);

    aiApi.analyzeBond(bond)
      .then((res) => { if (active) setData(res); })
      .catch((err) => {
        if (active) setError(err?.message || 'Не удалось рассчитать оценку.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [bond?.SECID]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Panel title="Надёжность и новости по эмитенту">
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
          Считаем надёжность и загружаем новости…
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Надёжность и новости по эмитенту">
        <div style={{ color: '#ef5350', fontSize: '13px' }}>{error}</div>
      </Panel>
    );
  }

  if (!data) return null;

  const color = scoreColor(data.reliabilityScore);

  return (
    <Panel title="Надёжность и новости по эмитенту">
      {/* Шкала надёжности */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '90px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', fontWeight: 'bold', color, lineHeight: 1 }}>
            {data.reliabilityScore}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>из 100</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color, marginBottom: '6px' }}>
            Надёжность: {data.reliabilityLabel}
          </div>
          <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${data.reliabilityScore}%`, height: '100%', backgroundColor: color, transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Текстовый вывод */}
      {data.summary && (
        <div style={{ fontSize: '13px', color: 'var(--text-light, #ddd)', lineHeight: 1.6, marginTop: '16px' }}>
          {data.summary}
        </div>
      )}

      {/* Разбор расчёта — для прозрачности оценки */}
      {data.reasons?.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ fontSize: '12px', color: 'var(--accent-green)', cursor: 'pointer' }}>
            Как считалась оценка
          </summary>
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {data.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </details>
      )}

      {/* Факторы риска */}
      {data.riskFactors?.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
            Факторы риска
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-light, #ddd)', lineHeight: 1.7 }}>
            {data.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* Новости */}
      <div style={{ marginTop: '18px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>
          Актуальные новости по эмитенту
        </div>
        {data.news?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.news.map((n, i) => {
              const st = sentimentStyle(n.sentiment);
              return (
                <div key={i} style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '14px', fontWeight: '600', color: '#fff', textDecoration: 'none', flex: 1 }}
                    >
                      {n.title}
                    </a>
                    {n.sentiment && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', backgroundColor: st.bg, color: st.text, fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {n.sentiment}
                      </span>
                    )}
                  </div>
                  {n.summary && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                      {n.summary}
                    </div>
                  )}
                  {n.date && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{n.date}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Свежих новостей по эмитенту не найдено.
          </div>
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
        Оценка рассчитана по биржевым метрикам и не является инвестиционной рекомендацией.
      </div>
    </Panel>
  );
};

export default BondAIInsights;
