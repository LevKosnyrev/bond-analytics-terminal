import React, { createContext, useState, useEffect } from 'react';

// Создаем сам контекст
export const AppContext = createContext();

// Провайдер — это "обертка", которая даст доступ к данным всему сайту
export const AppProvider = ({ children }) => {
  // Инициализируем Избранное. Пытаемся достать из LocalStorage, если там пусто - берем пустой массив
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('bondFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Инициализируем Сравнение (максимум 3-4 бумаги)
  const [compareList, setCompareList] = useState(() => {
    const saved = localStorage.getItem('bondCompare');
    return saved ? JSON.parse(saved) : [];
  });

  // Если favorites изменился, сохраняем в память браузера
  useEffect(() => {
    localStorage.setItem('bondFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Если compareList изменился, сохраняем в память
  useEffect(() => {
    localStorage.setItem('bondCompare', JSON.stringify(compareList));
  }, [compareList]);

  // Функция добавления/удаления из избранного
  const toggleFavorite = (secid) => {
    setFavorites(prev => 
      prev.includes(secid) ? prev.filter(id => id !== secid) : [...prev, secid]
    );
  };

  // Функция добавления/удаления из сравнения
  const toggleCompare = (bond) => {
    setCompareList(prev => {
      const exists = prev.find(b => b.SECID === bond.SECID);
      if (exists) {
        return prev.filter(b => b.SECID !== bond.SECID);
      }
      // Ограничим сравнение 4 бумагами
      if (prev.length >= 4) return prev; 
      return [...prev, bond];
    });
  };

  return (
    <AppContext.Provider value={{ 
      favorites, 
      toggleFavorite, 
      compareList, 
      toggleCompare 
    }}>
      {children}
    </AppContext.Provider>
  );
};