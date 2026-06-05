import { render, screen } from '@testing-library/react';
import App from './App';
import { AppProvider } from './store/AppContext';
import { AuthProvider } from './store/AuthContext';

// Не ходим в реальную сеть в тестах — подменяем MOEX API заглушками.
// Обычные функции (а не jest.fn) устойчивы к resetMocks: true в конфиге CRA.
jest.mock('./api/moexApi', () => ({
  moexApi: {
    getBonds: () => Promise.resolve([]),
    getTickers: () => Promise.resolve([]),
    getCandles: () => Promise.resolve([]),
  },
}));

// Подменяем Firebase, чтобы тест не подключался к облаку
jest.mock('./firebase', () => ({ auth: {}, db: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => { cb(null); return () => {}; },
  signInWithEmailAndPassword: () => Promise.resolve(),
  createUserWithEmailAndPassword: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
}));
jest.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
  setDoc: () => Promise.resolve(),
}));

// lightweight-charts поставляется как ESM (.mjs) и не трансформируется Jest в CRA — мокаем
jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({ setData: () => {} }),
    timeScale: () => ({ fitContent: () => {} }),
    applyOptions: () => {},
    remove: () => {},
  }),
  CandlestickSeries: {},
}));

test('неавторизованному пользователю показывается форма входа', () => {
  render(
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  );

  expect(screen.getByText('Bond Screener')).toBeInTheDocument();
  expect(screen.getByText('Войти')).toBeInTheDocument();
});
