/**
 * СЕРВИС ДЛЯ РАБОТЫ С API МОСКОВСКОЙ БИРЖИ (MOEX ISS)
 * Загружает полные данные по всем доступным инструментам
 */

const MOEX_BASE_URL = '/iss';

/**
 * Универсальный парсер: склеивает массивы columns и data в понятные JS-объекты.
 * Автоматически сохраняет ВСЕ столбцы, пришедшие от биржи.
 */
function transformMoexData(moexSection) {
  if (!moexSection || !moexSection.columns || !moexSection.data) return [];
  const columns = moexSection.columns;
  return moexSection.data.map(row => {
    const obj = {};
    columns.forEach((colName, index) => {
      obj[colName] = row[index];
    });
    return obj;
  });
}

export const moexApi = {
  /**
   * Загрузка ВСЕХ облигаций со ВСЕМИ существующими столбцами
   */
  getBonds: async () => {
    try {
      // Запрашиваем данные в формате .json (вместо .xml), чтобы не усложнять парсинг
      const response = await fetch(
        `${MOEX_BASE_URL}/engines/stock/markets/bonds/boards/TQCB/securities.json`
      );

      if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
      const rawData = await response.json();

      // Трансформируем обе таблицы: паспортную (securities) и рыночную (marketdata)
      const formattedSecurities = transformMoexData(rawData.securities);
      const formattedMarketData = transformMoexData(rawData.marketdata);

      // Склеиваем их по SECID, сохраняя вообще все столбцы
      const combinedBonds = formattedSecurities.map(sec => {
        const market = formattedMarketData.find(m => m.SECID === sec.SECID) || {};
        
        return {
          ...sec,    // Разворачиваем ВСЕ столбцы из паспорта (SHORTNAME, MATDATE, LISTLEVEL и т.д.)
          ...market  // Добавляем ВСЕ столбцы из торгов (LAST, YIELD, VOLUME, BID, OFFER и т.д.)
        };
      });

      return combinedBonds;
    } catch (error) {
      console.error('Не удалось загрузить полный список облигаций с MOEX:', error);
      return [];
    }
  },

  /**
   * Загрузка исторических свечей для графика (оставляем без изменений)
   */
  getBondHistory: async (secid) => {
    try {
      const response = await fetch(
        `${MOEX_BASE_URL}/engines/stock/markets/bonds/boards/TQCB/securities/${secid}/candles.json?iss.meta=off&interval=24`
      );
      if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
      const rawData = await response.json();
      
      const formattedCandles = transformMoexData(rawData.candles);

      return formattedCandles.map(candle => ({
        time: candle.begin.split(' ')[0],
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })).filter(c => c.close !== null);
    } catch (error) {
      console.error(`Ошибка загрузки истории для ${secid}:`, error);
      return [];
    }
  }
};