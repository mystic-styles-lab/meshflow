import sqlite3

conn = sqlite3.connect(r'D:\Desktop\Marzban-master\data\proxy-balancer.db')
cursor = conn.cursor()

cursor.execute('''
    SELECT p.id, p.name, p.host, p.port, s.avg_response_time, s.is_healthy 
    FROM proxies p 
    LEFT JOIN proxy_stats s ON p.id = s.proxy_id
''')

rows = cursor.fetchall()

print('\nProxy data from DB:')
print('-' * 80)
for row in rows:
    print(f'ID: {row[0]}, Name: {row[1]}, Host: {row[2]}:{row[3]}, Ping: {row[4]}ms, Healthy: {row[5]}')

conn.close()
