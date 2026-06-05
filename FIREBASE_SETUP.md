# Настройка Firebase

Приложение использует **Firebase Authentication** (аккаунты пользователей) и
**Cloud Firestore** (избранные облигации каждого пользователя). Ниже — шаги,
чтобы подключить ваш проект Firebase.

## 1. Создать проект

1. Откройте [console.firebase.google.com](https://console.firebase.google.com) и нажмите **Add project**.
2. Введите название (например, `bond-platform`), отключите Google Analytics (необязательно), создайте проект.

## 2. Добавить веб-приложение и получить конфиг

1. На главной странице проекта нажмите иконку **`</>`** (Web).
2. Зарегистрируйте приложение (Hosting можно не включать).
3. Скопируйте значения из объекта `firebaseConfig` в файл **`.env`** в корне проекта:

```
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=ваш-проект.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ваш-проект
REACT_APP_FIREBASE_STORAGE_BUCKET=ваш-проект.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

> После изменения `.env` обязательно перезапустите `npm start` — Create React App
> читает переменные окружения только при старте.

## 3. Включить вход по логину и паролю

1. В консоли: **Build → Authentication → Get started**.
2. Вкладка **Sign-in method** → включите провайдер **Email/Password** → Save.

> В интерфейсе пользователь вводит **логин**, а не email. Внутри логин
> превращается в технический адрес вида `логин@bond.local` — это позволяет
> использовать штатную авторизацию Firebase, сохранив привычное поле «Логин».
> Пароль должен быть не короче **6 символов** (требование Firebase).

## 4. Создать базу данных Firestore

1. В консоли: **Build → Firestore Database → Create database**.
2. Выберите регион, запустите в **Production mode**.

## 5. Настроить правила доступа

В Firestore → вкладка **Rules** вставьте правила: каждый пользователь читает и
пишет только свой документ избранного.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Избранные облигации: документ на пользователя, ключ = uid
    match /favorites/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Нажмите **Publish**.

## 6. Проверка

```
npm start
```

- Зарегистрируйте пользователя — он сразу войдёт в систему.
- Добавьте облигацию в избранное (★) — в Firestore появится коллекция
  `favorites` с документом по вашему `uid` и массивом `bonds`.
- Перезагрузите страницу — сессия и избранное восстановятся из облака.

## Структура данных

| Где | Что |
|-----|-----|
| Firebase Authentication | Учётные записи (логин → `login@bond.local`, пароль хранит Firebase) |
| Firestore `favorites/{uid}` | `{ bonds: ["SU26238RMFS4", ...] }` — избранное пользователя |

> Примечание: ключи `REACT_APP_FIREBASE_*` для веб-приложения не являются
> секретными (они видны в собранном бандле). Безопасность обеспечивается
> правилами Firestore и настройками Authentication, а не сокрытием этих ключей.
