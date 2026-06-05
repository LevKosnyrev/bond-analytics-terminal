import React, { createContext, useState, useEffect } from 'react';
import { moexApi } from '../api/moexApi';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favBonds')) || []);
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBond, setSelectedBond] = useState(null);

  const [sector, setSector] = useState('Все');
  const [selectedNames, setSelectedNames] = useState([]);
  const [selectedISINs, setSelectedISINs] = useState([]);
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
    setFavorites(prev =>
      prev.includes(secid) ? prev.filter(id => id !== secid) : [...prev, secid]
    );
  };

  const navigateToBond = (bond) => {
    setSelectedBond(bond);
    setActiveTab('bondDetail');
  };

  return (
    <AppContext.Provider value={{
      favorites, toggleFavorite,
      bonds, loading,
      activeTab, setActiveTab,
      selectedBond, navigateToBond,
      filters: {
        sector, setSector,
        selectedNames, setSelectedNames,
        selectedISINs, setSelectedISINs,
        yieldMin, setYieldMin,
        yieldMax, setYieldMax,
      },
    }}>
      {children}
    </AppContext.Provider>
  );
};
