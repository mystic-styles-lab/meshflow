"""
Migration: Add tariff_id column to users table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    try:
        # Check current columns
        cursor.execute('PRAGMA table_info(users)')
        cols = [r[1] for r in cursor.fetchall()]
        print('Columns before:', cols)
        
        if 'tariff_id' not in cols:
            # Add column
            cursor.execute('ALTER TABLE users ADD COLUMN tariff_id INTEGER DEFAULT NULL')
            
            conn.commit()
            print('✅ Added tariff_id column')
            
            # Verify
            cursor.execute('PRAGMA table_info(users)')
            cols_after = [r[1] for r in cursor.fetchall()]
            print('Columns after:', cols_after)
        else:
            print('⚠️  tariff_id already exists')
            
    except Exception as e:
        print(f'❌ Error: {e}')
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
