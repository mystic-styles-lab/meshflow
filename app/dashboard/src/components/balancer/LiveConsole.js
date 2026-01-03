import React, { useState, useEffect, useRef } from 'react';
import './LiveConsole.css';

function LiveConsole() {
  const [connectionLogs, setConnectionLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('connections');
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const consoleRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && consoleRef.current && !isPaused) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [connectionLogs, errorLogs, autoScroll, isPaused]);

  const connectSSE = () => {
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:9000';
    const eventSource = new EventSource(`${baseUrl}/api/logs/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (isPaused) return;
      
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          setConnectionLogs(data.connectionLogs || []);
          setErrorLogs(data.errorLogs || []);
        } else if (data.type === 'connection') {
          setConnectionLogs(prev => [...prev.slice(-499), data.log]);
        } else if (data.type === 'error') {
          setErrorLogs(prev => [...prev.slice(-499), data.log]);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      // Переподключение через 3 секунды
      setTimeout(connectSSE, 3000);
    };
  };

  const clearLogs = async () => {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:9000';
      await fetch(`${baseUrl}/api/logs`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setConnectionLogs([]);
      setErrorLogs([]);
    } catch (e) {
      console.error('Clear error:', e);
    }
  };

  const copyErrors = () => {
    const text = errorLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] ${log.target} через ${log.proxy}: ${log.error} (попытка ${log.attempt}/${log.maxRetries})`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Ошибки скопированы в буфер обмена!');
    });
  };

  const exportLogs = () => {
    const logs = activeTab === 'connections' ? connectionLogs : errorLogs;
    const text = logs.map(log => JSON.stringify(log)).join('\n');
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConnectionLogs = filter 
    ? connectionLogs.filter(log => 
        log.target?.toLowerCase().includes(filter.toLowerCase()) ||
        log.proxy?.toLowerCase().includes(filter.toLowerCase())
      )
    : connectionLogs;

  const filteredErrorLogs = filter
    ? errorLogs.filter(log =>
        log.target?.toLowerCase().includes(filter.toLowerCase()) ||
        log.proxy?.toLowerCase().includes(filter.toLowerCase()) ||
        log.error?.toLowerCase().includes(filter.toLowerCase())
      )
    : errorLogs;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  };

  const getStatusIcon = (type) => {
    switch(type) {
      case 'success': return '✓';
      case 'failed': return '✗';
      case 'pending': return '◐';
      case 'connect': return '→';
      default: return '•';
    }
  };

  const getStatusClass = (type) => {
    switch(type) {
      case 'success': return 'log-success';
      case 'failed': return 'log-error';
      case 'pending': return 'log-pending';
      default: return 'log-info';
    }
  };

  return (
    <div className="live-console">
      <div className="console-header">
        <div className="console-title">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Live' : 'Reconnecting...'}
          </div>
          <h3>Консоль подключений</h3>
        </div>
        
        <div className="console-tabs">
          <button 
            className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Подключения
            <span className="tab-count">{connectionLogs.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
          >
            Ошибки
            <span className="tab-count error-count">{errorLogs.length}</span>
          </button>
        </div>

        <div className="console-controls">
          <input
            type="text"
            placeholder="Фильтр по домену..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="console-filter-input"
          />
          
          <label className="console-checkbox">
            <input 
              type="checkbox" 
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Автоскролл</span>
          </label>

          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className={`btn-console ${isPaused ? 'btn-resume' : 'btn-pause'}`}
          >
            {isPaused ? '▶ Продолжить' : '⏸ Пауза'}
          </button>

          {activeTab === 'errors' && errorLogs.length > 0 && (
            <button onClick={copyErrors} className="btn-console btn-copy">
              📋 Копировать ошибки
            </button>
          )}

          <button onClick={exportLogs} className="btn-console btn-export">
            💾 Экспорт
          </button>

          <button onClick={clearLogs} className="btn-console btn-clear">
            🗑 Очистить
          </button>
        </div>
      </div>

      <div className="console-body" ref={consoleRef}>
        {activeTab === 'connections' ? (
          filteredConnectionLogs.length === 0 ? (
            <div className="console-empty">
              <p>Ожидание подключений...</p>
            </div>
          ) : (
            <div className="console-logs">
              {filteredConnectionLogs.map(log => (
                <div key={log.id} className={`console-log ${getStatusClass(log.type)}`}>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className="log-icon">{getStatusIcon(log.type)}</span>
                  <span className="log-target">{log.target}</span>
                  {log.proxy && <span className="log-proxy">via {log.proxy}</span>}
                  {log.attempt > 1 && <span className="log-retry">retry #{log.attempt}</span>}
                  {log.error && <span className="log-error-msg">{log.error}</span>}
                </div>
              ))}
            </div>
          )
        ) : (
          filteredErrorLogs.length === 0 ? (
            <div className="console-empty">
              <p>🎉 Ошибок нет!</p>
            </div>
          ) : (
            <div className="console-logs error-logs">
              {filteredErrorLogs.map(log => (
                <div key={log.id} className="console-log log-error">
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className="log-icon">✗</span>
                  <div className="log-details">
                    <div className="log-main">
                      <span className="log-target">{log.target}</span>
                      <span className="log-proxy">через {log.proxy}</span>
                      <span className="log-attempt">попытка {log.attempt}/{log.maxRetries}</span>
                    </div>
                    <div className="log-error-text">{log.error}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="console-footer">
        <span className="console-stats">
          {activeTab === 'connections' 
            ? `Показано: ${filteredConnectionLogs.length} из ${connectionLogs.length}`
            : `Ошибок: ${filteredErrorLogs.length} из ${errorLogs.length}`
          }
          {isPaused && <span className="paused-badge">ПАУЗА</span>}
        </span>
      </div>
    </div>
  );
}

export default LiveConsole;
