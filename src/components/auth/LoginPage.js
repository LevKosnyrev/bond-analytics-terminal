import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      return setError('Заполните все поля');
    }

    if (isLoginMode) {
      // --- ЛОГИКА ВХОДА (Ищем юзера в localStorage) ---
      const savedUser = localStorage.getItem(`user_${username}`);
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.password === password) {
          onLoginSuccess(username);
        } else {
          setError('Неверный пароль');
        }
      } else {
        setError('Пользователь не найден');
      }
    } else {
      // --- ЛОГИКА РЕГИСТРАЦИИ (Пишем юзера в localStorage) ---
      const userExists = localStorage.getItem(`user_${username}`);
      
      if (userExists) {
        setError('Пользователь с таким логином уже существует');
      } else {
        localStorage.setItem(`user_${username}`, JSON.stringify({ username, password }));
        setSuccessMsg('Регистрация успешна! Теперь вы можете войти.');
        setIsLoginMode(true);
        setPassword('');
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
        
        <h2 className="text-center mb-1" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
          Bond Screener
        </h2>
        <p className="text-center mb-4" style={{ color: 'var(--text-muted)' }}>
          {isLoginMode ? 'Авторизация в системе' : 'Создание нового аккаунта'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Логин</label>
            <input 
              type="text" 
              className="form-control shadow-none mt-1" 
              style={{ backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Пароль</label>
            <input 
              type="password" 
              className="form-control shadow-none mt-1" 
              style={{ backgroundColor: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-color)' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="mb-3 p-2 rounded text-center" style={{ backgroundColor: 'rgba(242, 54, 69, 0.1)', color: 'var(--accent-red)', fontSize: '14px' }}>{error}</div>}
          {successMsg && <div className="mb-3 p-2 rounded text-center" style={{ backgroundColor: 'rgba(8, 153, 129, 0.1)', color: 'var(--accent-green)', fontSize: '14px' }}>{successMsg}</div>}

          <button type="submit" className="btn w-100 mb-3" style={{ backgroundColor: 'var(--accent-green)', color: '#fff', fontWeight: 'bold' }}>
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <div className="text-center" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {isLoginMode ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <span 
              style={{ color: 'var(--accent-blue)', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => { setIsLoginMode(!isLoginMode); setError(''); setSuccessMsg(''); }}
            >
              {isLoginMode ? 'Создать' : 'Войти'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;