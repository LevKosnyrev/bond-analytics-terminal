// Оценка надёжности облигации + новости по эмитенту — БЕЗ внешних ИИ-ключей.
//
//  • Надёжность считается прозрачной формулой на JS (объяснимо в дипломе).
//  • Новости берём из Google News RSS (поиск по эмитенту) через бесплатный
//    CORS-прокси: его сервер сам скачивает ленту, поэтому регион пользователя
//    и блокировки роли не играют. Ключи и регистрация не нужны.
//  • Результат кэшируется в localStorage на 24 часа.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
const MAX_NEWS = 6;

// Поиск новостей по эмитенту в Google News (русскоязычная выдача).
const googleNewsUrl = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ru&gl=RU&ceid=RU:ru`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Прозрачная числовая оценка надёжности (0..100).
// ─────────────────────────────────────────────────────────────────────────────
function reliability(bond) {
  let score = 0;
  const reasons = [];

  // Уровень листинга MOEX: 1-й — самые надёжные, 3-й — повышенный риск.
  const level = Number(bond.LISTLEVEL);
  if (level === 1)      { score += 40; reasons.push('1-й уровень листинга (+40)'); }
  else if (level === 2) { score += 26; reasons.push('2-й уровень листинга (+26)'); }
  else if (level === 3) { score += 14; reasons.push('3-й уровень листинга (+14)'); }
  else                  { score += 20; reasons.push('уровень листинга неизвестен (+20)'); }

  // Сектор: гособлигации (ОФЗ) надёжнее корпоративных.
  if (bond.SECTOR === 'Государственные') { score += 32; reasons.push('государственный сектор (+32)'); }
  else                                   { score += 14; reasons.push('корпоративный сектор (+14)'); }

  // Доходность как индикатор риска: аномально высокая = рынок закладывает риск
  // дефолта. Базовый «безрисковый» ориентир ~16% (ОФЗ).
  const y = Number(bond.YIELD);
  if (!isNaN(y) && y > 0) {
    if (y >= 35)      { score -= 24; reasons.push(`доходность ${y.toFixed(1)}% — очень высокий риск (−24)`); }
    else if (y >= 28) { score -= 16; reasons.push(`доходность ${y.toFixed(1)}% — высокий риск (−16)`); }
    else if (y >= 22) { score -= 8;  reasons.push(`доходность ${y.toFixed(1)}% — повышенный риск (−8)`); }
    else if (y <= 17) { score += 8;  reasons.push(`доходность ${y.toFixed(1)}% — близко к безрисковой (+8)`); }
  }

  // Срок до погашения: чем дальше, тем больше неопределённости.
  if (bond.MATDATE && bond.MATDATE !== '0000-00-00') {
    const years = (new Date(bond.MATDATE) - Date.now()) / (365 * 24 * 3600 * 1000);
    if (years > 7)      { score -= 6; reasons.push('погашение более чем через 7 лет (−6)'); }
    else if (years > 4) { score -= 3; reasons.push('погашение через 4–7 лет (−3)'); }
  }

  // Ликвидность: совсем без сделок — труднее выйти из бумаги.
  const trades = Number(bond.NUMTRADES);
  if (!isNaN(trades) && trades < 5) { score -= 5; reasons.push('низкая ликвидность сегодня (−5)'); }

  score = Math.max(5, Math.min(95, Math.round(score)));
  const label = score >= 70 ? 'Высокая' : score >= 45 ? 'Умеренная' : 'Низкая';

  // Текстовый вывод собираем из данных (без ИИ).
  const sector = bond.SECTOR === 'Государственные' ? 'государственная' : 'корпоративная';
  const yieldText = !isNaN(y) && y > 0 ? `Доходность к погашению ${y.toFixed(1)}%. ` : '';
  const summary =
    `Это ${sector} облигация. ${yieldText}` +
    `По биржевым метрикам (уровень листинга, сектор, доходность, срок, ликвидность) ` +
    `надёжность оценивается как «${label}» — ${score} из 100.`;

  // Факторы риска — отрицательные слагаемые оценки.
  const riskFactors = reasons.filter((r) => r.includes('−'));

  return { score, label, summary, reasons, riskFactors };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Новости по эмитенту из Google News RSS.
//    Браузер не может напрямую читать чужой RSS (CORS), поэтому:
//      • основной путь — rss2json.com (сервер сам качает ленту, отдаёт JSON+CORS);
//      • запасной — CORS-прокси allorigins.win + разбор XML.
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(pubDate) {
  if (!pubDate) return '';
  const d = new Date(pubDate);
  if (isNaN(d)) return pubDate;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function fetchNewsViaRss2Json(rssUrl) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=${MAX_NEWS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('rss2json HTTP ' + res.status);
  const json = await res.json();
  if (json.status !== 'ok' || !Array.isArray(json.items)) {
    throw new Error('rss2json: ' + (json.message || 'нет данных'));
  }
  return json.items.slice(0, MAX_NEWS).map((it) => ({
    title: it.title,
    url: it.link,
    date: fmtDate(it.pubDate),
    summary: '',
  }));
}

async function fetchNewsViaProxy(rssUrl) {
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
  if (!res.ok) throw new Error('proxy HTTP ' + res.status);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(doc.querySelectorAll('item')).slice(0, MAX_NEWS).map((item) => {
    const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
    return { title: get('title'), url: get('link'), date: fmtDate(get('pubDate')), summary: '' };
  });
}

async function fetchNews(bond) {
  const issuer = bond.SHORTNAME || bond.SECID;
  const rssUrl = googleNewsUrl(`${issuer} облигации`);

  let items;
  try {
    items = await fetchNewsViaRss2Json(rssUrl);
  } catch (e) {
    console.warn('rss2json не сработал, пробуем прокси:', e?.message);
    items = await fetchNewsViaProxy(rssUrl);
  }
  return items.filter((n) => n.title && n.url);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Публичный метод: кэш → формула (всегда) → новости (не критично, если упали).
// ─────────────────────────────────────────────────────────────────────────────
export const aiApi = {
  analyzeBond: async (bond) => {
    const cacheKey = `aiAnalysis:${bond.SECID}`;

    // 3.1. Кэш из localStorage (24 ч).
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { result, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL_MS) return { ...result, cached: true };
      }
    } catch (_) { /* битый кэш — игнорируем */ }

    // 3.2. Надёжность считается всегда и не может «упасть».
    const r = reliability(bond);

    // 3.3. Новости — best effort: если прокси/лента недоступны, просто пусто.
    let news = [];
    try {
      news = await fetchNews(bond);
    } catch (e) {
      console.warn('Новости не загрузились:', e?.message);
    }

    const result = {
      reliabilityScore: r.score,
      reliabilityLabel: r.label,
      summary: r.summary,
      riskFactors: r.riskFactors,
      reasons: r.reasons,
      news,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ result, ts: Date.now() }));
    } catch (_) { /* localStorage переполнен — не критично */ }

    return { ...result, cached: false };
  },
};
