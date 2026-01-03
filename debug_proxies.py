import sqlite3

conn = sqlite3.connect('./data/proxy-balancer.db')
cursor = conn.cursor()

cursor.execute('SELECT id, name, host, port, protocol, username, password, priority FROM proxies')
proxies = cursor.fetchall()

print("📋 Прокси в базе:")
for p in proxies:
    print(f"\nID: {p[0]}")
    print(f"  Name: {p[1]}")
    print(f"  Address: {p[2]}:{p[3]}")
    print(f"  Protocol: {p[4]}")
    print(f"  Username: {p[5] if p[5] else 'None'}")
    print(f"  Password: {'***' if p[6] else 'None'}")
    print(f"  Priority: {p[7]}")

cursor.execute('SELECT proxy_id, is_healthy, avg_response_time FROM proxy_stats')
stats = cursor.fetchall()

print("\n\n📊 Статистика:")
for s in stats:
    print(f"Proxy ID {s[0]}: Healthy={s[1]}, Ping={s[2]}ms")

conn.close()
