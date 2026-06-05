import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { authApi } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // объект пользователя Firebase
  const [authReady, setAuthReady] = useState(false); // первичная проверка сессии завершена
  const [loading, setLoading] = useState(false);     // выполняется вход/регистрация

  // Подписка на состояние авторизации Firebase: сессия восстанавливается
  // автоматически при перезагрузке страницы (токен хранит сам Firebase).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const login = async (login, password) => {
    setLoading(true);
    try {
      await authApi.login(login, password);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (login, password) => {
    setLoading(true);
    try {
      await authApi.register(login, password);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => authApi.logout();

  const isAuthenticated = !!user;
  // Восстанавливаем логин из email вида login@bond.local
  const username = user ? (user.email ? user.email.split('@')[0] : '') : '';
  const uid = user ? user.uid : null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, uid, loading, authReady, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
