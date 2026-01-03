import React from 'react';
import './ProxyList.css';

function ProxyList({ proxies, onEdit, onDelete, onToggle, onTest }) {
  if (proxies.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        </div>
        <h3>Нет прокси серверов</h3>
        <p>Добавьте первый прокси сервер для начала работы</p>
      </div>
    );
  }

  return (
    <div className="proxy-list">
      {proxies.map((proxy) => (
        <div key={proxy.id} className={`proxy-card ${!proxy.enabled ? 'disabled' : ''}`}>
          <div className="proxy-header">
            <div className="proxy-title">
              <span className={`status-indicator ${proxy.isHealthy ? 'healthy' : 'unhealthy'}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <circle cx="6" cy="6" r="6"/>
                </svg>
              </span>
              <h3>{proxy.name}</h3>
              {proxy.priority > 0 && (
                <span className="priority-badge">Приоритет: {proxy.priority}</span>
              )}
            </div>
            
            <div className="proxy-actions">
              <button 
                onClick={() => onToggle(proxy.id, !proxy.enabled)}
                className={`btn-toggle ${proxy.enabled ? 'active' : ''}`}
                title={proxy.enabled ? 'Отключить' : 'Включить'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {proxy.enabled ? (
                    <polyline points="20 6 9 17 4 12"/>
                  ) : (
                    <circle cx="12" cy="12" r="10"/>
                  )}
                </svg>
              </button>
              <button onClick={() => onTest(proxy.id)} className="btn-test" title="Тестировать">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </button>
              <button onClick={() => onEdit(proxy)} className="btn-edit" title="Редактировать">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => onDelete(proxy.id)} className="btn-delete" title="Удалить">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="proxy-info">
            <div className="info-item">
              <span className="info-label">Адрес:</span>
              <span className="info-value">{proxy.host}:{proxy.port}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Протокол:</span>
              <span className={`info-value protocol-badge ${proxy.protocol || 'socks5'}`}>
                {(proxy.protocol || 'socks5').toUpperCase()}
              </span>
            </div>
            {proxy.username && (
              <div className="info-item">
                <span className="info-label">Пользователь:</span>
                <span className="info-value">{proxy.username}</span>
              </div>
            )}
          </div>

          <div className="proxy-stats">
            <div className="stat-item">
              <span className="stat-label">Активных</span>
              <span className="stat-number">{proxy.activeConnections || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Всего</span>
              <span className="stat-number">{proxy.totalConnections || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Ошибки</span>
              <span className="stat-number error">{proxy.failedConnections || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Успешность</span>
              <span className="stat-number success">{proxy.successRate || 'N/A'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Отклик</span>
              <span className="stat-number">{proxy.avgResponseTime || 0}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Нагрузка</span>
              <span className="stat-number">{proxy.load || '0%'}</span>
            </div>
          </div>

          {!proxy.enabled && (
            <div className="disabled-overlay">
              <span>Отключен</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProxyList;
