"""
Migration: Add unlimited_traffic column to tariffs table
Date: 2026-01-01
"""
import sqlite3
import os

def migrate():
    """Add unlimited_traffic column to tariffs table"""
    
    # Path to tariffs database
    db_path = "./data/tariffs.db"
    
    # Create data directory if it doesn't exist
    os.makedirs("./data", exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(tariffs)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'unlimited_traffic' not in columns:
            # Add unlimited_traffic column
            cursor.execute("""
                ALTER TABLE tariffs 
                ADD COLUMN unlimited_traffic INTEGER DEFAULT 0
            """)
            conn.commit()
            print("✅ Successfully added unlimited_traffic column to tariffs table")
        else:
            print("ℹ️  Column unlimited_traffic already exists")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
