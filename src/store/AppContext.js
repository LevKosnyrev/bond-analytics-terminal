import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { moexApi } from '../api/moexApi';
import { db } from '../firebase';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { uid } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBond, setSelectedBond] = useState(null);

  const [sector, setSector] = useState('Все');
  const [selectedNames, setSelectedNames] = useState([]);
  const [selectedISINs, setSelectedISINs] = useState([]);
  const [yieldMin, setYieldMin] = useState('');
  const [yieldMax, setYieldMax] = useState('');

  // Загружаем избранное пользователя из Firestore при входе.
  // При выходе (uid === null) список очищается.
  useEffect(() => {
    if (!uid) {
      setFavorites([]);
      return;
    }
    let active = true;
    getDoc(doc(db, 'favorites', uid))
      .then(snap => {
        if (active) setFavorites(snap.exists() ? (snap.data().bonds || []) : []);
      })
      .catch(e => console.error('Ошибка загрузки избранного:', e));
    return () => { active = false; };
  }, [uid]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await moexApi.getBonds();
        setBonds(data);
      } catch (e) {
        console.error('Ошибка загрузки базы облигаций:', e);
        setError('Не удалось загрузить данные облигаций. Проверьте подключение к интернету.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleFavorite = (secid) => {
    if (!uid) return; // без авторизации избранное недоступно
    setFavorites(prev => {
      const next = prev.includes(secid)
        ? prev.filter(id => id !== secid)
        : [...prev, secid];
      // Сохраняем обновлённый список в Firestore (документ на пользователя)
      setDoc(doc(db, 'favorites', uid), { bonds: next })
        .catch(e => console.error('Ошибка сохранения избранного:', e));
      return next;
    });
  };

  const navigateToBond = (bond) => {
    setSelectedBond(bond);
    setActiveTab('bondDetail');
  };

  return (
    <AppContext.Provider value={{
      favorites, toggleFavorite,
      bonds, loading, error,
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
