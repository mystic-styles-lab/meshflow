"""
Migration: Add telegram_id column to users table
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
        
        if 'telegram_id' not in cols:
            # Add column
            cursor.execute('ALTER TABLE users ADD COLUMN telegram_id BIGINT DEFAULT NULL')
            
            # Create partial unique index (only for non-NULL values)
            cursor.execute('''
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_id 
                ON users(telegram_id) 
                WHERE telegram_id IS NOT NULL
            ''')
            
            conn.commit()
            print('✅ Added telegram_id column and unique index')
            
            # Verify
            cursor.execute('PRAGMA table_info(users)')
            cols_after = [r[1] for r in cursor.fetchall()]
            print('Columns after:', cols_after)
            
            cursor.execute('PRAGMA index_list(users)')
            indexes = cursor.fetchall()
            print('Indexes:', indexes)
        else:
            print('⚠️  telegram_id already exists')
            
    except Exception as e:
        print(f'❌ Error: {e}')
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
