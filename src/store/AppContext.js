import React, { createContext, useState, useEffect } from 'react';
import { moexApi } from '../api/moexApi';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favBonds')) || []);
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);

  // НОВЫЕ СОСТОЯНИЯ ФИЛЬТРОВ
  const [sector, setSector] = useState('Все');
  const [selectedNames, setSelectedNames] = useState([]); // Массив для названий
  const [selectedISINs, setSelectedISINs] = useState([]); // Массив для ISIN/SECID
  const [yieldMin, setYieldMin] = useState('');
  const [yieldMax, setYieldMax] = useState('');

  useEffect(() => {
    localStorage.setItem('favBonds', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await moexApi.getBonds();
      setBonds(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleFavorite = (secid) => {
    setFavorites(prev => prev.includes(secid) ? prev.filter(id => id !== secid) : [...prev, secid]);
  };

  return (
    <AppContext.Provider value={{ 
      favorites, toggleFavorite, 
      bonds, loading,
      // Передаем новые фильтры
      filters: { 
        sector, setSector, 
        selectedNames, setSelectedNames, 
        selectedISINs, setSelectedISINs, 
        yieldMin, setYieldMin, 
        yieldMax, setYieldMax 
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};