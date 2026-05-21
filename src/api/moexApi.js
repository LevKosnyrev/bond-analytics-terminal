const MOEX_BASE_URL = 'https://iss.moex.com/iss';

export const moexApi = {
  // 1. Сбор данных по облигациям (Государственные + Корпоративные)
  getBonds: async () => {
    try {
      // Вспомогательная функция, чтобы не дублировать код для каждой доски
      const fetchBoard = async (board, sectorName) => {
        // Запрашиваем статические данные (securities) и рыночные цены (marketdata)
        const response = await fetch(`${MOEX_BASE_URL}/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off&iss.only=securities,marketdata`);
        const json = await response.json();
        
        const secData = json.securities.data;
        const secCols = json.securities.columns;
        const mdData = json.marketdata.data;
        const mdCols = json.marketdata.columns;

        // Собираем массив объектов, динамически находя индексы колонок
        return secData.map((row, index) => {
          const mdRow = mdData[index] || [];
          return {
            SECID: row[secCols.indexOf('SECID')],
            SHORTNAME: row[secCols.indexOf('SHORTNAME')],
            ISIN: row[secCols.indexOf('ISIN')],
            MATDATE: row[secCols.indexOf('MATDATE')],
            NEXTCOUPON: row[secCols.indexOf('NEXTCOUPON')],
            COUPONVALUE: row[secCols.indexOf('COUPONVALUE')],
            LISTLEVEL: row[secCols.indexOf('LISTLEVEL')],
            SECTOR: sectorName, // Присваиваем сектор ('Государственные' или 'Корпоративные')
            
            // Рыночные данные из второго блока ответа
            LAST: mdRow[mdCols.indexOf('LAST')],
            PREVWAPRICE: mdRow[mdCols.indexOf('PREVWAPRICE')],
            YIELD: mdRow[mdCols.indexOf('YIELD')],
            VALTODAY: mdRow[mdCols.indexOf('VALTODAY')]
          };
        });
      };

      // Выполняем оба запроса параллельно для скорости
      const [govBonds, corpBonds] = await Promise.all([
        fetchBoard('TQOB', 'Государственные'),
        fetchBoard('TQCB', 'Корпоративные')
      ]);

      // Склеиваем оба массива в один большой список бумаг и возвращаем
      return [...govBonds, ...corpBonds];

    } catch (error) {
      console.error('Ошибка загрузки базы облигаций:', error);
      return [];
    }
  },

  // 2. Сбор данных для макро-индикаторов (Валюты и Золото в навбаре)
  getTickers: async () => {
    try {
      const response = await fetch(`${MOEX_BASE_URL}/statistics/engines/currency/markets/index/securities.json?iss.meta=off`);
      const json = await response.json();
      
      const data = json.securities.data;
      const columns = json.securities.columns;
      
      const idxSecid = columns.indexOf('SECID');
      const idxVal = columns.indexOf('CURRENTVALUE');
      const idxChange = columns.indexOf('CHANGE');

      // Возвращаем все макро-индикаторы (фильтрацию оставим на стороне интерфейса)
      return data.map(row => ({
        id: row[idxSecid],
        name: row[idxSecid],
        price: row[idxVal],
        change: row[idxChange]
      }));

    } catch (error) {
      console.error('Ошибка загрузки валютных тикеров:', error);
      return [];
    }
  }
};