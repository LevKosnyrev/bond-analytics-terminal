const MOEX_BASE_URL = 'https://iss.moex.com/iss';

export const moexApi = {
  getBonds: async () => {
    const fetchBoard = async (board, sectorName) => {
      const response = await fetch(`${MOEX_BASE_URL}/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off&iss.only=securities,marketdata`);
      const json = await response.json();

      const secData = json.securities.data;
      const secCols = json.securities.columns;
      const mdData = json.marketdata.data;
      const mdCols = json.marketdata.columns;

      // Индексируем рыночные данные по SECID, чтобы не зависеть от порядка строк.
      // MOEX не гарантирует, что строки securities и marketdata идут в одном порядке.
      const mdSecidIdx = mdCols.indexOf('SECID');
      const mdBySecid = new Map(mdData.map(row => [row[mdSecidIdx], row]));

      return secData.map((row) => {
        const secid = row[secCols.indexOf('SECID')];
        const mdRow = mdBySecid.get(secid) || [];
        return {
          SECID:        secid,
          SHORTNAME:    row[secCols.indexOf('SHORTNAME')],
          ISIN:         row[secCols.indexOf('ISIN')],
          MATDATE:      row[secCols.indexOf('MATDATE')],
          NEXTCOUPON:   row[secCols.indexOf('NEXTCOUPON')],
          COUPONVALUE:  row[secCols.indexOf('COUPONVALUE')],
          COUPONPERCENT:row[secCols.indexOf('COUPONPERCENT')],
          FACEVALUE:    row[secCols.indexOf('FACEVALUE')],
          FACEUNIT:     row[secCols.indexOf('FACEUNIT')] || 'RUB',
          ACCRUEDINT:   row[secCols.indexOf('ACCRUEDINT')],
          LISTLEVEL:    row[secCols.indexOf('LISTLEVEL')],
          SECTOR:       sectorName,

          // PREVWAPRICE (средневзвешенная цена предыдущего дня) лежит в блоке
          // securities, а не marketdata — берём её отсюда, иначе дневное
          // изменение цены не считается.
          PREVWAPRICE:  row[secCols.indexOf('PREVWAPRICE')],

          LAST:         mdRow[mdCols.indexOf('LAST')],
          YIELD:        mdRow[mdCols.indexOf('YIELD')],
          VALTODAY:     mdRow[mdCols.indexOf('VALTODAY')],
          DURATION:     mdRow[mdCols.indexOf('DURATION')],
          BID:          mdRow[mdCols.indexOf('BID')],
          OFFER:        mdRow[mdCols.indexOf('OFFER')],
          OPEN:         mdRow[mdCols.indexOf('OPEN')],
          HIGH:         mdRow[mdCols.indexOf('HIGH')],
          LOW:          mdRow[mdCols.indexOf('LOW')],
          NUMTRADES:    mdRow[mdCols.indexOf('NUMTRADES')],
        };
      });
    };

    const [govBonds, corpBonds] = await Promise.all([
      fetchBoard('TQOB', 'Государственные'),
      fetchBoard('TQCB', 'Корпоративные'),
    ]);

    return [...govBonds, ...corpBonds];
  },

  // История дневных свечей по бумаге за последний год (для графика котировок)
  getCandles: async (secid) => {
    try {
      const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`${MOEX_BASE_URL}/engines/stock/markets/bonds/securities/${secid}/candles.json?iss.meta=off&interval=24&from=${from}`);
      const json = await response.json();

      const cols = json.candles.columns;
      const data = json.candles.data;
      const iOpen  = cols.indexOf('open');
      const iClose = cols.indexOf('close');
      const iHigh  = cols.indexOf('high');
      const iLow   = cols.indexOf('low');
      const iBegin = cols.indexOf('begin');

      return data
        .map(row => ({
          time:  row[iBegin].split(' ')[0], // 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DD'
          open:  row[iOpen],
          high:  row[iHigh],
          low:   row[iLow],
          close: row[iClose],
        }))
        .filter(c => c.open > 0 && c.close > 0);
    } catch (error) {
      console.error('Ошибка загрузки свечей:', error);
      return [];
    }
  },

  getTickers: async () => {
    try {
      const response = await fetch(`${MOEX_BASE_URL}/statistics/engines/currency/markets/index/securities.json?iss.meta=off`);
      const json = await response.json();

      const data = json.securities.data;
      const columns = json.securities.columns;

      const idxSecid = columns.indexOf('SECID');
      const idxVal   = columns.indexOf('CURRENTVALUE');
      const idxChange = columns.indexOf('CHANGE');

      return data.map(row => ({
        id:     row[idxSecid],
        name:   row[idxSecid],
        price:  row[idxVal],
        change: row[idxChange],
      }));
    } catch (error) {
      console.error('Ошибка загрузки валютных тикеров:', error);
      return [];
    }
  },
};
