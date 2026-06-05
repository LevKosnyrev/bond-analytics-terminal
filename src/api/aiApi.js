// Оценка надёжности облигации + новости по эмитенту — БЕЗ внешних ИИ-ключей.
//
//  • Надёжность считается прозрачной формулой на JS (объяснимо в дипломе).
//  • Новости берём из Google News RSS (поиск по эмитенту) через бесплатный
//    CORS-прокси: его сервер сам скачивает ленту, поэтому регион пользователя
//    и блокировки роли не играют. Ключи и регистрация не нужны.
//  • Результат кэшируется в localStorage на 24 часа.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
const MAX_NEWS = 6;
const FETCH_TIMEOUT_MS = 7000; // тайм-аут на каждый сетевой запрос — чтобы не висеть на упавшем прокси

// Поиск новостей по эмитенту в Google News (русскоязычная выдача).
const googleNewsUrl = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ru&gl=RU&ceid=RU:ru`;

// fetch с тайм-аутом: если посредник не ответил за FETCH_TIMEOUT_MS — обрываем запрос.
// Без этого зависший прокси заставлял интерфейс ждать ~20 секунд.
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Имя бумаги (SHORTNAME) содержит серийные коды («РЖД 1Р-28R»), которые засоряют
// поиск новостей. Оставляем читаемое имя эмитента: берём ведущие слова до первого
// токена с цифрами/кодом выпуска.
function issuerName(bond) {
  const raw = (bond.SHORTNAME || bond.SECID || '').trim();
  const words = raw.split(/\s+/);
  const clean = [];
  for (const w of words) {
    // токен с цифрами или дефисом в середине — это уже код выпуска, дальше не идём
    if (/\d/.test(w) || /\w-\w/.test(w)) break;
    clean.push(w);
  }
  return (clean.join(' ') || raw).trim();
}

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

// Разбор RSS-XML в наш формат новостей (общий для прокси, отдающих сырой XML).
function parseRssXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(doc.querySelectorAll('item')).slice(0, MAX_NEWS).map((item) => {
    const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
    return { title: get('title'), url: get('link'), date: fmtDate(get('pubDate')), summary: '' };
  });
}

// Путь 1: rss2json отдаёт готовый JSON. Параметр count убран — на бесплатном
// тарифе он требует API-ключ и роняет запрос (HTTP 422); обрезаем сами через slice.
async function fetchNewsViaRss2Json(rssUrl) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetchWithTimeout(url);
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

// Путь 2: allorigins — CORS-прокси, отдаёт сырой XML ленты.
async function fetchNewsViaAllOrigins(rssUrl) {
  const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
  if (!res.ok) throw new Error('allorigins HTTP ' + res.status);
  return parseRssXml(await res.text());
}

// Путь 3: corsproxy.io — ещё один CORS-прокси с сырым XML (резерв на случай сбоя двух выше).
async function fetchNewsViaCorsProxy(rssUrl) {
  const res = await fetchWithTimeout(`https://corsproxy.io/?url=${encodeURIComponent(rssUrl)}`);
  if (!res.ok) throw new Error('corsproxy HTTP ' + res.status);
  return parseRssXml(await res.text());
}

async function fetchNews(bond) {
  const rssUrl = googleNewsUrl(`${issuerName(bond)} облигации`);

  // Пробуем всех посредников параллельно и берём первого, кто вернул непустой
  // список. Так быстрее (не ждём по очереди) и устойчивее к падению любого из них.
  const sources = [
    fetchNewsViaRss2Json(rssUrl),
    fetchNewsViaAllOrigins(rssUrl),
    fetchNewsViaCorsProxy(rssUrl),
  ];

  try {
    const items = await Promise.any(
      sources.map(async (p) => {
        const list = (await p).filter((n) => n.title && n.url);
        if (list.length === 0) throw new Error('пустая лента');
        return list;
      })
    );
    return items;
  } catch (e) {
    // AggregateError: все источники упали или вернули пусто.
    console.warn('Новости не загрузились ни через один источник.');
    return [];
  }
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
