"""
Tariffs Database Module
"""
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import threading


class TariffsDatabase:
    def __init__(self, db_path: str = "./data/tariffs.db"):
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
        
        # Tariffs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                duration_days INTEGER NOT NULL,
                traffic_limit INTEGER NOT NULL,
                unlimited_traffic INTEGER DEFAULT 0,
                max_connections INTEGER DEFAULT 3,
                speed_limit INTEGER DEFAULT 0,
                enabled INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
    
    def add_tariff(self, name: str, price: float, duration_days: int, 
                   traffic_limit: int, description: str = "", 
                   max_connections: int = 3, speed_limit: int = 0,
                   unlimited_traffic: bool = False) -> int:
        """Add new tariff"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tariffs (name, description, price, duration_days, 
                               traffic_limit, unlimited_traffic, max_connections, speed_limit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, description, price, duration_days, traffic_limit, 
              1 if unlimited_traffic else 0, max_connections, speed_limit))
        
        conn.commit()
        return cursor.lastrowid
    
    def get_tariff(self, tariff_id: int) -> Optional[Dict]:
        """Get tariff by ID"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tariffs WHERE id = ?', (tariff_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def get_all_tariffs(self) -> List[Dict]:
        """Get all tariffs"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tariffs ORDER BY price ASC')
        return [dict(row) for row in cursor.fetchall()]
    
    def get_enabled_tariffs(self) -> List[Dict]:
        """Get enabled tariffs only"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tariffs WHERE enabled = 1 ORDER BY price ASC')
        return [dict(row) for row in cursor.fetchall()]
    
    def update_tariff(self, tariff_id: int, **kwargs) -> bool:
        """Update tariff"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        allowed_fields = ['name', 'description', 'price', 'duration_days', 
                         'traffic_limit', 'unlimited_traffic', 'max_connections', 'speed_limit', 'enabled']
        
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
        values.append(tariff_id)
        
        cursor.execute(f'''
            UPDATE tariffs
            SET {', '.join(updates)}
            WHERE id = ?
        ''', values)
        
        conn.commit()
        return cursor.rowcount > 0
    
    def delete_tariff(self, tariff_id: int) -> bool:
        """Delete tariff"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM tariffs WHERE id = ?', (tariff_id,))
        conn.commit()
        
        return cursor.rowcount > 0
