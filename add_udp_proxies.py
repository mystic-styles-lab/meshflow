"""
Добавление UDP прокси в балансер
"""
import sqlite3

conn = sqlite3.connect(r'D:\Desktop\Marzban-master\data\proxy-balancer.db')
cursor = conn.cursor()

# Добавляем VLESS Reality для UDP
try:
    cursor.execute('''
        INSERT INTO proxies (name, host, port, protocol, username, password, priority, max_connections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('VLESS-Reality-UDP', '145.249.115.86', 443, 'vless', '66ec925d-9939-4351-a2e1-a7a096c46e19', '', 5, 100))
    
    proxy_id = cursor.lastrowid
    cursor.execute('INSERT INTO proxy_stats (proxy_id) VALUES (?)', (proxy_id,))
    print(f"✅ Добавлен VLESS Reality: 145.249.115.86:443")
except Exception as e:
    print(f"❌ Ошибка при добавлении VLESS: {e}")

# Добавляем Shadowsocks для UDP
try:
    cursor.execute('''
        INSERT INTO proxies (name, host, port, protocol, username, password, priority, max_connections)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('Shadowsocks-UDP', '127.0.0.1', 2060, 'shadowsocks', '', 'chacha20-ietf-poly1305', 5, 100))
    
    proxy_id = cursor.lastrowid
    cursor.execute('INSERT INTO proxy_stats (proxy_id) VALUES (?)', (proxy_id,))
    print(f"✅ Добавлен Shadowsocks: 127.0.0.1:2060")
except Exception as e:
    print(f"❌ Ошибка при добавлении Shadowsocks: {e}")

conn.commit()

# Показываем все прокси
cursor.execute('SELECT id, name, protocol, host, port, priority FROM proxies ORDER BY id')
proxies = cursor.fetchall()

print("\n📋 Все прокси в балансере:")
print("-" * 80)
for proxy in proxies:
    print(f"ID: {proxy[0]}, Name: {proxy[1]}, Protocol: {proxy[2]}, Host: {proxy[3]}:{proxy[4]}, Priority: {proxy[5]}")

conn.close()
