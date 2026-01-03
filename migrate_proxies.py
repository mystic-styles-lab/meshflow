"""
Скрипт миграции прокси из Node.js балансера в Python балансер
"""
import sqlite3
import os

# Пути к базам данных
old_db_path = r"D:\Desktop\proxy-balancer\data\proxy-balancer.db"
new_db_path = r"D:\Desktop\Marzban-master\data\proxy-balancer.db"

# Подключение к старой базе
old_conn = sqlite3.connect(old_db_path)
old_cursor = old_conn.cursor()

# Подключение к новой базе
new_conn = sqlite3.connect(new_db_path)
new_cursor = new_conn.cursor()

# Получение всех прокси из старой базы
old_cursor.execute("SELECT * FROM proxies")
proxies = old_cursor.fetchall()

# Получение структуры таблицы
old_cursor.execute("PRAGMA table_info(proxies)")
columns = [col[1] for col in old_cursor.fetchall()]

print(f"Найдено прокси в старой базе: {len(proxies)}")
print(f"Колонки: {columns}\n")

# Миграция каждого прокси
migrated = 0
for proxy in proxies:
    proxy_dict = dict(zip(columns, proxy))
    print(f"Мигрирую: {proxy_dict['name']} ({proxy_dict['protocol']}://{proxy_dict['host']}:{proxy_dict['port']})")
    
    try:
        # Вставка в новую базу
        new_cursor.execute('''
            INSERT INTO proxies (name, host, port, protocol, username, password, enabled, priority, max_connections)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            proxy_dict.get('name'),
            proxy_dict.get('host'),
            proxy_dict.get('port'),
            proxy_dict.get('protocol'),
            proxy_dict.get('username'),
            proxy_dict.get('password'),
            proxy_dict.get('enabled', 1),
            proxy_dict.get('priority', 1),
            proxy_dict.get('max_connections', 100)
        ))
        migrated += 1
    except Exception as e:
        print(f"  ❌ Ошибка: {e}")

# Сохранение изменений
new_conn.commit()

print(f"\n✅ Успешно мигрировано: {migrated} из {len(proxies)}")

# Закрытие соединений
old_conn.close()
new_conn.close()
