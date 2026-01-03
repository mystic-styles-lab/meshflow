# Telegram Mini App Integration для Marzban VPN

## Что реализовано

### ✅ Backend
1. **Модель данных**: Добавлено поле `telegram_id` в таблицу `users`
2. **Telegram Bot** (`app/telegram/bot.py`):
   - Команды: `/start`, `/help`, `/status`, `/myid`
   - Уведомления о трафике и подписке
   - Открытие Mini App через кнопку
3. **API endpoints** (`app/routers/telegram.py`):
   - `POST /api/telegram/auth` - Авторизация через Telegram
   - `POST /api/telegram/link-user` - Привязка пользователя к Telegram ID
   - `GET /api/telegram/user-info/{telegram_id}` - Информация о пользователе
   - `POST /api/telegram/unlink-user/{username}` - Отвязка от Telegram

### ✅ Frontend
1. **Личный кабинет** (`UserCabinet.tsx`):
   - Темный glassmorphism дизайн с эффектом выпуклости
   - Отображение тарифа, трафика, статистики
   - Без списка прокси и логов подключений
   
2. **Управление тарифами** (`TariffManagement.tsx`):
   - CRUD операции с тарифами
   - Отдельная вкладка в Dashboard (вкладка #6)
   
3. **Telegram Mini App** (`TelegramMiniApp.tsx`):
   - Авторизация через Telegram Web App API
   - Отображение тарифов
   - Покупка тарифов (заготовка под платежную систему)

## Настройка

### 1. Конфигурация (.env)
Добавьте в `.env` файл:
```env
# Telegram Bot Token (получить у @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# URL вашего Mini App
WEBAPP_URL=https://your-domain.com/dashboard/#/miniapp/
```

### 2. Миграция базы данных
```bash
# Применить миграцию для добавления telegram_id
python -m alembic upgrade head

# Или вручную выполнить SQL:
ALTER TABLE users ADD COLUMN telegram_id BIGINT UNIQUE;
CREATE INDEX ix_users_telegram_id ON users(telegram_id);
```

### 3. Установка зависимостей
```bash
pip install -r telegram-bot-requirements.txt
```

### 4. Запуск Telegram Bot
В `main.py` добавьте:
```python
from app.telegram.bot import get_bot
import threading

# После запуска FastAPI
bot = get_bot()
bot_thread = threading.Thread(target=bot.run, daemon=True)
bot_thread.start()
```

## Использование

### Для администратора

#### 1. Привязка пользователя к Telegram
```bash
curl -X POST "http://localhost:8000/api/telegram/link-user" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "vpn_user",
    "telegram_id": 123456789
  }'
```

#### 2. Создание тарифа
Через Dashboard → Тарифы (#6 вкладка):
- Название: Premium
- Цена: 999 ₽
- Срок: 30 дней
- Трафик: 100 ГБ
- Подключений: 5
- Скорость: 0 (безлимит)

### Для пользователя

#### 1. Получение Telegram ID
Написать боту: `/myid`

#### 2. Отправить ID администратору
Администратор привязывает ID к аккаунту

#### 3. Открыть Mini App
`/start` → Кнопка "🚀 Открыть личный кабинет"

## Структура файлов

```
app/
├── telegram/
│   └── bot.py              # Telegram Bot
├── routers/
│   ├── telegram.py         # API endpoints для Telegram
│   ├── tariffs.py          # API для управления тарифами
│   └── user_cabinet.py     # API личного кабинета
├── services/
│   └── tariffs/
│       ├── database.py     # БД тарифов
│       └── manager.py      # Менеджер тарифов
├── db/
│   ├── models.py           # User.telegram_id
│   ├── crud.py             # get_user_by_telegram_id()
│   └── migrations/
│       └── add_telegram_id_to_user.py
└── dashboard/
    └── src/
        ├── components/
        │   ├── UserCabinet.tsx          # Личный кабинет (glassmorphism)
        │   ├── TariffManagement.tsx     # Управление тарифами
        │   └── TelegramMiniApp.tsx      # Mini App
        ├── styles/
        │   └── glassmorphism.ts         # Темная тема
        ├── pages/
        │   ├── Dashboard.tsx            # Вкладки переработаны
        │   └── Router.tsx               # Роутинг
        └── miniapp-entry.tsx            # Entry point для Mini App
```

## Темная тема Glassmorphism

### Особенности
- **Эффект матового стекла**: `backdrop-filter: blur(20px)`
- **Выпуклость**: Псевдоэлементы `::before` и `::after` с градиентами
- **Цвета**: 
  - Фон: `#0f0c29` → `#302b63` → `#24243e`
  - Акцент: `#667eea` → `#764ba2`
- **Анимации**: Shimmer эффект, hover трансформации

### Применение
```tsx
import { applyGlassStyle, applyConvexEffect } from "../styles/glassmorphism";

<Box
  {...applyGlassStyle('card')}
  sx={applyConvexEffect()}
  borderRadius="20px"
>
  Контент
</Box>
```

## Порядок вкладок Dashboard

0. Пользователи
1. Балансер
2. Логи
3. Хосты
4. Узлы
5. **Конфигурация** ← исправлено
6. **Тарифы** ← новая вкладка

## API Endpoints

### Telegram Auth
```
POST /api/telegram/auth
Body: {
  id: 123456789,
  first_name: "John",
  username: "john_doe",
  auth_date: 1234567890,
  hash: "..."
}
```

### Link User
```
POST /api/telegram/link-user
Body: {
  username: "vpn_user",
  telegram_id: 123456789
}
```

### Tariffs
```
GET  /api/tariffs/              # Все тарифы
GET  /api/tariffs/?enabled_only=true  # Только активные
POST /api/tariffs/              # Создать
PUT  /api/tariffs/{id}          # Обновить
DELETE /api/tariffs/{id}        # Удалить
POST /api/tariffs/{id}/toggle   # Включить/выключить
```

### User Cabinet
```
GET /api/user-cabinet/info      # Информация пользователя + тариф
GET /api/user-cabinet/stats/daily # Дневная статистика
```

## Следующие шаги

### Платежная система
Интегрировать Telegram Payments или внешний провайдер (ЮКасса, Stripe):
```python
# В TelegramMiniApp.tsx
const handleBuyTariff = async (tariff) => {
  // 1. Создать invoice
  const invoice = await fetch('/api/payments/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ tariff_id: tariff.id })
  });
  
  // 2. Открыть платежное окно Telegram
  window.Telegram.WebApp.openInvoice(invoice.url, (status) => {
    if (status === 'paid') {
      // 3. Активировать подписку
      await fetch('/api/payments/activate-subscription');
    }
  });
};
```

### Уведомления
```python
from app.telegram.bot import notify_user

# Предупреждение о трафике
if traffic_percent > 80:
    await notify_user(
        user.telegram_id,
        f"⚠️ Вы использовали {traffic_percent}% трафика"
    )

# Истечение подписки
if days_left <= 3:
    await notify_user(
        user.telegram_id,
        f"⏰ Подписка истекает через {days_left} дней"
    )
```

## Troubleshooting

### Bot не отвечает
- Проверьте токен в `.env`
- Убедитесь, что bot.run() вызывается

### Mini App не открывается
- Проверьте WEBAPP_URL в конфиге
- В настройках бота (@BotFather) укажите URL Mini App
- Используйте HTTPS для production

### Авторизация не работает
- Проверьте verify_telegram_auth() - хэш должен совпадать
- auth_date не должен быть старше 1 часа

## Безопасность

- ✅ Проверка подлинности данных через HMAC-SHA256
- ✅ Валидация времени auth_date
- ✅ Уникальность telegram_id в БД
- ⚠️ Добавьте rate limiting для API
- ⚠️ Используйте HTTPS для production
- ⚠️ Храните TELEGRAM_BOT_TOKEN в секрете
