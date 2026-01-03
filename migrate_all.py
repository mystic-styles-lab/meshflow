"""
Complete Database Migration Script
Adds all missing columns to Marzban database
"""
import sqlite3
import os

def migrate_users_table():
    """Add telegram_id and tariff_id to users table"""
    print("\n=== Migrating users table ===")
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    try:
        cursor.execute('PRAGMA table_info(users)')
        cols = [r[1] for r in cursor.fetchall()]
        print(f"Current columns: {len(cols)}")
        
        migrations_applied = []
        
        # Add telegram_id
        if 'telegram_id' not in cols:
            cursor.execute('ALTER TABLE users ADD COLUMN telegram_id BIGINT DEFAULT NULL')
            cursor.execute('''
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_id 
                ON users(telegram_id) 
                WHERE telegram_id IS NOT NULL
            ''')
            migrations_applied.append('telegram_id')
            print("✅ Added telegram_id column and unique index")
        else:
            print("⚠️  telegram_id already exists")
        
        # Add tariff_id
        if 'tariff_id' not in cols:
            cursor.execute('ALTER TABLE users ADD COLUMN tariff_id INTEGER DEFAULT NULL')
            migrations_applied.append('tariff_id')
            print("✅ Added tariff_id column")
        else:
            print("⚠️  tariff_id already exists")
        
        if migrations_applied:
            conn.commit()
            print(f"\n✅ Applied migrations: {', '.join(migrations_applied)}")
        else:
            print("\n✅ All users table columns already exist")
            
        # Verify
        cursor.execute('PRAGMA table_info(users)')
        cols_after = [r[1] for r in cursor.fetchall()]
        print(f"Total columns after migration: {len(cols_after)}")
        
    except Exception as e:
        print(f'❌ Error migrating users table: {e}')
        conn.rollback()
        raise
    finally:
        conn.close()


def migrate_tariffs_table():
    """Add unlimited_traffic to tariffs table"""
    print("\n=== Migrating tariffs table ===")
    
    os.makedirs('./data', exist_ok=True)
    conn = sqlite3.connect('./data/tariffs.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('PRAGMA table_info(tariffs)')
        cols = [r[1] for r in cursor.fetchall()]
        
        if not cols:
            print("⚠️  Tariffs table doesn't exist yet")
            return
        
        print(f"Current columns: {len(cols)}")
        
        if 'unlimited_traffic' not in cols:
            cursor.execute('ALTER TABLE tariffs ADD COLUMN unlimited_traffic INTEGER DEFAULT 0')
            conn.commit()
            print("✅ Added unlimited_traffic column")
        else:
            print("⚠️  unlimited_traffic already exists")
        
        # Verify
        cursor.execute('PRAGMA table_info(tariffs)')
        cols_after = [r[1] for r in cursor.fetchall()]
        print(f"Total columns after migration: {len(cols_after)}")
        
    except Exception as e:
        print(f'❌ Error migrating tariffs table: {e}')
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    print("=" * 60)
    print("  Marzban Database Migration")
    print("=" * 60)
    
    try:
        migrate_users_table()
        migrate_tariffs_table()
        
        print("\n" + "=" * 60)
        print("  ✅ All migrations completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"  ❌ Migration failed: {e}")
        print("=" * 60)
        raise


if __name__ == '__main__':
    main()
