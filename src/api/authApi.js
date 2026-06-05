import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

// Firebase Auth работает с email, а в интерфейсе пользователь вводит логин.
// Поэтому логин превращаем в синтетический email вида login@bond.local —
// так сохраняем привычный UX (поле «Логин»), но используем штатную авторизацию Firebase.
const toEmail = (login) => `${login.trim().toLowerCase()}@bond.local`;

// Преобразуем технические коды ошибок Firebase в понятные пользователю сообщения
const friendlyError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Пользователь с таким логином уже существует';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Неверный логин или пароль';
    case 'auth/weak-password':
      return 'Пароль слишком короткий (минимум 6 символов)';
    case 'auth/invalid-email':
      return 'Недопустимый логин (используйте латиницу и цифры)';
    case 'auth/network-request-failed':
      return 'Нет связи с сервером. Проверьте интернет';
    default:
      return 'Ошибка сервиса авторизации. Попробуйте позже';
  }
};

export const authApi = {
  // РЕГИСТРАЦИЯ — после создания пользователь автоматически входит в систему
  register: async (login, password) => {
    try {
      await createUserWithEmailAndPassword(auth, toEmail(login), password);
      return { success: true };
    } catch (error) {
      throw new Error(friendlyError(error.code));
    }
  },

  // ВХОД
  login: async (login, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, toEmail(login), password);
      return { uid: cred.user.uid, username: login };
    } catch (error) {
      throw new Error(friendlyError(error.code));
    }
  },

  // ВЫХОД
  logout: () => signOut(auth),
};
