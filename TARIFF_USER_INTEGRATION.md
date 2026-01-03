# Обязательный выбор тарифа при создании пользователя

## Что изменилось

### 1. Добавлено поле `tariff_id` в модели
- **Backend**: `app/models/user.py` - добавлено поле `tariff_id: Optional[int]`
- **Frontend**: `app/dashboard/src/types/User.ts` - добавлено поле `tariff_id: number | null`

### 2. UserDialog обновлен
- При создании нового пользователя **обязательно** выбрать тариф
- Автоматическая загрузка активных тарифов из `/api/tariffs/?enabled_only=true`
- Select dropdown с информацией: `Название - Цена ₽ (срок дн., трафик)`
- Валидация через Zod schema: тариф обязателен при создании

### 3. Отображение тарифа
В выпадающем списке показывается:
```
Premium - 500 ₽ (30 дн., 100 GB)
Unlimited - 990 ₽ (30 дн., ∞)
```

## Как работает

### Создание пользователя
1. Открыть "Добавить пользователя"
2. Заполнить Username
3. **Выбрать тариф** (обязательно!)
4. Настроить протоколы
5. Сохранить

Если тариф не выбран - появится ошибка: **"Выберите тариф"**

### API запрос
```json
POST /api/user
{
  "username": "testuser",
  "tariff_id": 1,
  "proxies": {...},
  "inbounds": {...},
  "data_limit": 107374182400,
  "expire": 0,
  "status": "active"
}
```

### При редактировании
- Поле тарифа **НЕ отображается** (можно изменить отдельно через API)
- Сохраняется текущий tariff_id пользователя

## Макс. подключений (max_connections)

### Текущее состояние
Поле `max_connections` в тарифе **НЕ применяется автоматически** к пользователям.

### Требуется реализовать:

1. **При создании пользователя с тарифом**: 
   - Получить `max_connections` из выбранного тарифа
   - Установить ограничение для всех inbounds пользователя

2. **В Xray конфигурации**:
   ```json
   {
     "email": "user@example.com",
     "limitIp": 3  // <- max_connections из тарифа
   }
   ```

3. **Обновить app/routers/user.py**:
   ```python
   @router.post("/user")
   async def add_user(new_user: UserCreate):
       # Получить тариф
       tariff = get_tariff(new_user.tariff_id)
       
       # Применить max_connections
       # TODO: Добавить в proxies настройку limitIp
   ```

### Где искать
- Генерация конфигурации Xray: `app/xray/config.py`
- Создание пользователя: `app/routers/user.py`
- Модели прокси: `app/models/proxy.py`

## Файлы изменены

1. `app/models/user.py` - добавлено `tariff_id` в User
2. `app/dashboard/src/types/User.ts` - TypeScript типы
3. `app/dashboard/src/components/UserDialog.tsx`:
   - Импорт `fetch` из service/http
   - Состояние `tariffs` и `tariffsLoading`
   - useEffect для загрузки тарифов
   - Controller с Select для выбора тарифа
   - Валидация в baseSchema

## Пример валидации

```typescript
const baseSchema = {
  username: z.string().min(1, { message: "Required" }),
  tariff_id: z.number({ required_error: "Тариф обязателен" })
    .min(1, { message: "Выберите тариф" }),
  // ...
};
```

## TODO

- [ ] Применять `max_connections` из тарифа к пользователю
- [ ] Применять `data_limit` из тарифа автоматически
- [ ] Применять `expire` (duration_days) из тарифа
- [ ] Автоматически продлевать подписку по тарифу
- [ ] Отображать текущий тариф пользователя в таблице
- [ ] Возможность сменить тариф пользователя через UI

## Рекомендации

1. **Создайте несколько тестовых тарифов** перед созданием пользователей
2. **Включите тарифы** (enabled = true) чтобы они отображались
3. **Тестируйте** с разными параметрами (безлимит, ограничение и т.д.)
