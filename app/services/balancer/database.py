"""
Database module for Proxy Balancer
"""
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import threading


class BalancerDatabase:
    def __init__(self, db_path: str = "./data/proxy-balancer.db"):
        self.db_path = db_path
        self._local = threading.local()
        self.init_db()
    
    def get_conn(self):
        """Get thread-local connection"""
        if not hasattr(self._local, 'conn'):
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn
    
    def init_db(self):
        """Initialize database tables"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        # Proxies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS proxies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                protocol TEXT DEFAULT 'socks5',
                username TEXT,
                password TEXT,
                enabled INTEGER DEFAULT 1,
                priority INTEGER DEFAULT 0,
                max_connections INTEGER DEFAULT 100,
                supports_udp INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Proxy stats table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS proxy_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proxy_id INTEGER NOT NULL,
                total_connections INTEGER DEFAULT 0,
                active_connections INTEGER DEFAULT 0,
                successful_connections INTEGER DEFAULT 0,
                failed_connections INTEGER DEFAULT 0,
                total_bytes_sent INTEGER DEFAULT 0,
                total_bytes_received INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                last_check DATETIME,
                is_healthy INTEGER DEFAULT 1,
                consecutive_failures INTEGER DEFAULT 0,
                in_slow_check_mode INTEGER DEFAULT 0,
                FOREIGN KEY (proxy_id) REFERENCES proxies (id) ON DELETE CASCADE
            )
        ''')
        
        # Add new columns if they don't exist (for migration)
        try:
            cursor.execute('ALTER TABLE proxy_stats ADD COLUMN consecutive_failures INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass
        try:
            cursor.execute('ALTER TABLE proxy_stats ADD COLUMN in_slow_check_mode INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            pass
        
        conn.commit()
    
    def add_proxy(self, name: str, host: str, port: int, protocol: str = 'socks5',
                  username: Optional[str] = None, password: Optional[str] = None,
                  priority: int = 0, max_connections: int = 100) -> int:
        """Add new proxy"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO proxies (name, host, port, protocol, username, password, priority, max_connections)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, host, port, protocol, username, password, priority, max_connections))
        
        proxy_id = cursor.lastrowid
        
        # Initialize stats
        cursor.execute('''
            INSERT INTO proxy_stats (proxy_id) VALUES (?)
        ''', (proxy_id,))
        
        conn.commit()
        return proxy_id
    
    def get_proxy(self, proxy_id: int) -> Optional[Dict]:
        """Get proxy by ID"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, s.total_connections, s.active_connections, s.successful_connections,
                   s.failed_connections, s.avg_response_time, s.is_healthy,
                   s.consecutive_failures, s.in_slow_check_mode, s.last_check
            FROM proxies p
            LEFT JOIN proxy_stats s ON p.id = s.proxy_id
            WHERE p.id = ?
        ''', (proxy_id,))
        
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def get_all_proxies(self) -> List[Dict]:
        """Get all proxies"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, s.total_connections, s.active_connections, s.successful_connections,
                   s.failed_connections, s.avg_response_time, s.is_healthy,
                   s.consecutive_failures, s.in_slow_check_mode, s.last_check
            FROM proxies p
            LEFT JOIN proxy_stats s ON p.id = s.proxy_id
            ORDER BY p.priority DESC, p.id
        ''')
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_enabled_proxies(self) -> List[Dict]:
        """Get enabled proxies only"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, s.total_connections, s.active_connections, s.successful_connections,
                   s.failed_connections, s.avg_response_time, s.is_healthy
            FROM proxies p
            LEFT JOIN proxy_stats s ON p.id = s.proxy_id
            WHERE p.enabled = 1
            ORDER BY p.priority DESC, p.id
        ''')
        
        return [dict(row) for row in cursor.fetchall()]
    
    def update_proxy(self, proxy_id: int, **kwargs) -> bool:
        """Update proxy"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        allowed_fields = ['name', 'host', 'port', 'protocol', 'username', 'password', 
                         'enabled', 'priority', 'max_connections']
        
        updates = []
        values = []
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        updates.append("updated_at = ?")
        values.append(datetime.now())
        values.append(proxy_id)
        
        cursor.execute(f'''
            UPDATE proxies
            SET {', '.join(updates)}
            WHERE id = ?
        ''', values)
        
        conn.commit()
        return cursor.rowcount > 0
    
    def delete_proxy(self, proxy_id: int) -> bool:
        """Delete proxy"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM proxies WHERE id = ?', (proxy_id,))
        conn.commit()
        
        return cursor.rowcount > 0
    
    def update_stats(self, proxy_id: int, **kwargs) -> bool:
        """Update proxy statistics"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        allowed_fields = ['total_connections', 'active_connections', 'successful_connections',
                         'failed_connections', 'total_bytes_sent', 'total_bytes_received',
                         'avg_response_time', 'is_healthy']
        
        updates = []
        values = []
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        updates.append("last_check = ?")
        values.append(datetime.now())
        values.append(proxy_id)
        
        cursor.execute(f'''
            UPDATE proxy_stats
            SET {', '.join(updates)}
            WHERE proxy_id = ?
        ''', values)
        
        conn.commit()
        return cursor.rowcount > 0
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COUNT(DISTINCT p.id) as total_proxies,
                COUNT(CASE WHEN p.enabled = 1 AND COALESCE(s.is_healthy, 0) = 1 THEN 1 END) as active_proxies,
                COALESCE(SUM(s.total_connections), 0) as total_connections,
                COALESCE(SUM(s.active_connections), 0) as active_connections,
                CASE 
                    WHEN COALESCE(SUM(s.total_connections), 0) > 0 
                    THEN ROUND(CAST(COALESCE(SUM(s.successful_connections), 0) AS FLOAT) / SUM(s.total_connections) * 100, 1)
                    ELSE 0.0
                END as success_rate
            FROM proxies p
            LEFT JOIN proxy_stats s ON p.id = s.proxy_id
        ''')
        
        row = cursor.fetchone()
        if not row:
            return {
                'total_proxies': 0,
                'active_proxies': 0,
                'total_connections': 0,
                'active_connections': 0,
                'success_rate': 0.0
            }
        
        return {
            'total_proxies': row['total_proxies'] or 0,
            'active_proxies': row['active_proxies'] or 0,
            'total_connections': row['total_connections'] or 0,
            'active_connections': row['active_connections'] or 0,
            'success_rate': round(row['success_rate'] or 0.0, 1)
        }
