const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

class ProxyDatabase {
  constructor(dbPath = './data/proxy-balancer.db') {
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    // Таблица пользователей
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица прокси
    this.db.exec(`
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
        health_check_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Добавляем колонку protocol если её нет (для существующих БД)
    try {
      this.db.exec(`ALTER TABLE proxies ADD COLUMN protocol TEXT DEFAULT 'socks5'`);
    } catch (e) {
      // Колонка уже существует
    }

    // Таблица статистики
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proxy_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proxy_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_connections INTEGER DEFAULT 0,
        failed_connections INTEGER DEFAULT 0,
        avg_response_time INTEGER DEFAULT 0,
        is_healthy INTEGER DEFAULT 1,
        FOREIGN KEY (proxy_id) REFERENCES proxies (id) ON DELETE CASCADE
      )
    `);

    // Создаем дефолтного админа если его нет
    this.createDefaultAdmin();
  }

  createDefaultAdmin() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    
    if (result.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin', 10);
      const insert = this.db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      insert.run('admin', hashedPassword);
      console.log('✓ Создан администратор по умолчанию (admin/admin)');
    }
  }

  // Методы для пользователей
  getUserByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  verifyUser(username, password) {
    const user = this.getUserByUsername(username);
    if (!user) return false;
    return bcrypt.compareSync(password, user.password);
  }

  updatePassword(username, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const stmt = this.db.prepare('UPDATE users SET password = ? WHERE username = ?');
    return stmt.run(hashedPassword, username);
  }

  // Методы для прокси
  getAllProxies() {
    const stmt = this.db.prepare('SELECT * FROM proxies ORDER BY priority DESC, name ASC');
    return stmt.all();
  }

  getEnabledProxies() {
    const stmt = this.db.prepare('SELECT * FROM proxies WHERE enabled = 1 ORDER BY priority DESC');
    return stmt.all();
  }

  getProxyById(id) {
    const stmt = this.db.prepare('SELECT * FROM proxies WHERE id = ?');
    return stmt.get(id);
  }

  addProxy(data) {
    const stmt = this.db.prepare(`
      INSERT INTO proxies (name, host, port, protocol, username, password, enabled, priority, max_connections)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.name,
      data.host,
      data.port,
      data.protocol || 'socks5',
      data.username || null,
      data.password || null,
      data.enabled !== false ? 1 : 0,
      data.priority || 0,
      data.max_connections || 100
    );
  }

  updateProxy(id, data) {
    const stmt = this.db.prepare(`
      UPDATE proxies 
      SET name = ?, host = ?, port = ?, protocol = ?, username = ?, password = ?, 
          enabled = ?, priority = ?, max_connections = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.name,
      data.host,
      data.port,
      data.protocol || 'socks5',
      data.username || null,
      data.password || null,
      data.enabled ? 1 : 0,
      data.priority || 0,
      data.max_connections || 100,
      id
    );
  }

  deleteProxy(id) {
    const stmt = this.db.prepare('DELETE FROM proxies WHERE id = ?');
    return stmt.run(id);
  }

  toggleProxy(id, enabled) {
    const stmt = this.db.prepare('UPDATE proxies SET enabled = ? WHERE id = ?');
    return stmt.run(enabled ? 1 : 0, id);
  }

  // Методы для статистики
  saveProxyStats(proxyId, stats) {
    const stmt = this.db.prepare(`
      INSERT INTO proxy_stats (proxy_id, total_connections, failed_connections, avg_response_time, is_healthy)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      proxyId,
      stats.totalConnections || 0,
      stats.failedConnections || 0,
      stats.avgResponseTime || 0,
      stats.isHealthy ? 1 : 0
    );
  }

  getProxyStats(proxyId, hours = 24) {
    const stmt = this.db.prepare(`
      SELECT * FROM proxy_stats 
      WHERE proxy_id = ? AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `);
    return stmt.all(proxyId);
  }

  cleanOldStats(days = 7) {
    const stmt = this.db.prepare(`
      DELETE FROM proxy_stats WHERE timestamp < datetime('now', '-${days} days')
    `);
    return stmt.run();
  }

  close() {
    this.db.close();
  }
}

module.exports = ProxyDatabase;
