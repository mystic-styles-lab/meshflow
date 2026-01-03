"""
База данных для балансировщика прокси
"""
import sqlite3
import threading
from typing import List, Optional
from pathlib import Path
from .models import ProxyConfig


class ProxyDatabase:
    """Управление базой данных прокси"""
    
    def __init__(self, db_path: str = "data/balancer.db"):
        self.db_path = db_path
        self._local = threading.local()
        
        # Создаем директорию если не существует
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Инициализируем таблицы
        self._init_db()
    
    def _get_conn(self):
        """Получить connection для текущего потока"""
        if not hasattr(self._local, 'conn'):
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn
    
    def _init_db(self):
        """Инициализировать таблицы"""
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS proxies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                protocol TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT,
                password TEXT,
                enabled INTEGER DEFAULT 1,
                priority INTEGER DEFAULT 1,
                max_connections INTEGER DEFAULT 100,
                active_connections INTEGER DEFAULT 0,
                total_connections INTEGER DEFAULT 0,
                successful_connections INTEGER DEFAULT 0,
                failed_connections INTEGER DEFAULT 0,
                total_bytes_sent INTEGER DEFAULT 0,
                total_bytes_received INTEGER DEFAULT 0,
                avg_response_time REAL,
                healthy INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    
    def get_all_proxies(self) -> List[ProxyConfig]:
        """Получить все прокси"""
        conn = self._get_conn()
        rows = conn.execute("SELECT * FROM proxies ORDER BY priority DESC, id ASC").fetchall()
        
        proxies = []
        for row in rows:
            proxies.append(ProxyConfig(
                id=row['id'],
                name=row['name'],
                protocol=row['protocol'],
                host=row['host'],
                port=row['port'],
                username=row['username'],
                password=row['password'],
                enabled=bool(row['enabled']),
                priority=row['priority'],
                max_connections=row['max_connections'],
                active_connections=row['active_connections'],
                total_connections=row['total_connections'],
                successful_connections=row['successful_connections'],
                failed_connections=row['failed_connections'],
                total_bytes_sent=row['total_bytes_sent'],
                total_bytes_received=row['total_bytes_received'],
                avg_response_time=row['avg_response_time'],
                healthy=bool(row['healthy'])
            ))
        
        return proxies
    
    def get_proxy_by_id(self, proxy_id: int) -> Optional[ProxyConfig]:
        """Получить прокси по ID"""
        conn = self._get_conn()
        row = conn.execute("SELECT * FROM proxies WHERE id = ?", (proxy_id,)).fetchone()
        
        if not row:
            return None
        
        return ProxyConfig(
            id=row['id'],
            name=row['name'],
            protocol=row['protocol'],
            host=row['host'],
            port=row['port'],
            username=row['username'],
            password=row['password'],
            enabled=bool(row['enabled']),
            priority=row['priority'],
            max_connections=row['max_connections'],
            active_connections=row['active_connections'],
            total_connections=row['total_connections'],
            successful_connections=row['successful_connections'],
            failed_connections=row['failed_connections'],
            total_bytes_sent=row['total_bytes_sent'],
            total_bytes_received=row['total_bytes_received'],
            avg_response_time=row['avg_response_time'],
            healthy=bool(row['healthy'])
        )
    
    def add_proxy(self, proxy: ProxyConfig) -> int:
        """Добавить прокси"""
        conn = self._get_conn()
        cursor = conn.execute("""
            INSERT INTO proxies (name, protocol, host, port, username, password, enabled, priority, max_connections)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (proxy.name, proxy.protocol, proxy.host, proxy.port, proxy.username, proxy.password,
              int(proxy.enabled), proxy.priority, proxy.max_connections))
        conn.commit()
        return cursor.lastrowid
    
    def update_proxy(self, proxy: ProxyConfig):
        """Обновить прокси"""
        conn = self._get_conn()
        conn.execute("""
            UPDATE proxies 
            SET name=?, protocol=?, host=?, port=?, username=?, password=?, 
                enabled=?, priority=?, max_connections=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """, (proxy.name, proxy.protocol, proxy.host, proxy.port, proxy.username, proxy.password,
              int(proxy.enabled), proxy.priority, proxy.max_connections, proxy.id))
        conn.commit()
    
    def delete_proxy(self, proxy_id: int):
        """Удалить прокси"""
        conn = self._get_conn()
        conn.execute("DELETE FROM proxies WHERE id=?", (proxy_id,))
        conn.commit()
    
    def update_stats(self, proxy_id: int, **stats):
        """Обновить статистику прокси"""
        conn = self._get_conn()
        fields = ", ".join([f"{k}=?" for k in stats.keys()])
        values = list(stats.values()) + [proxy_id]
        conn.execute(f"UPDATE proxies SET {fields}, updated_at=CURRENT_TIMESTAMP WHERE id=?", values)
        conn.commit()
