const MOEX_BASE_URL = 'https://iss.moex.com/iss';

export const moexApi = {
  getBonds: async () => {
    try {
      const fetchBoard = async (board, sectorName) => {
        const response = await fetch(`${MOEX_BASE_URL}/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off&iss.only=securities,marketdata`);
        const json = await response.json();

        const secData = json.securities.data;
        const secCols = json.securities.columns;
        const mdData = json.marketdata.data;
        const mdCols = json.marketdata.columns;

        return secData.map((row, index) => {
          const mdRow = mdData[index] || [];
          return {
            SECID:        row[secCols.indexOf('SECID')],
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

            LAST:         mdRow[mdCols.indexOf('LAST')],
            PREVWAPRICE:  mdRow[mdCols.indexOf('PREVWAPRICE')],
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
    } catch (error) {
      console.error('Ошибка загрузки базы облигаций:', error);
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
