import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { AppProvider } from './store/AppContext'; // <-- Добавили импорт

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Обернули App в AppProvider */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);