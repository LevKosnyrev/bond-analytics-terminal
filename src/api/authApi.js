// Имитация задержки сети (500 мс)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authApi = {
  // РЕГИСТРАЦИЯ
  register: async (username, password) => {
    await delay(500); // Ждем полсекунды для реалистичности
    
    // Достаем список пользователей из памяти (или создаем пустой массив)
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    
    if (users.find(u => u.username === username)) {
      throw new Error('Пользователь с таким логином уже существует');
    }

    // Сохраняем нового пользователя
    users.push({ username, password });
    localStorage.setItem('db_users', JSON.stringify(users));
    
    return { success: true };
  },

  // ВХОД
  login: async (username, password) => {
    await delay(500);
    
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('Неверный логин или пароль');
    }

    // Генерируем "токен" (в реальности это сложный шифр, у нас просто случайная строка)
    const fakeToken = `token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    
    return { token: fakeToken, username: user.username };
  }
};