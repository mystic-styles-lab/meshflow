import React, { useState, useEffect, useRef } from 'react';
import './ProxyConsole.css';

function ProxyConsole({ proxies }) {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef(null);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (type, message, proxyId = null) => {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      type, // 'info', 'success', 'error', 'warning'
      message,
      proxyId
    };
    setLogs(prev => [...prev, newLog]);
  };

  const testSingleProxy = async (proxy) => {
    addLog('info', `Тестирование ${proxy.name} (${proxy.protocol.toUpperCase()})...`, proxy.id);
    
    try {
      const response = await fetch(`http://localhost:9000/api/proxies/${proxy.id}/test`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const results = await response.json();
      
      if (results.summary.isHealthy) {
        addLog('success', `✓ ${proxy.name}: ${results.summary.successCount}/${results.summary.totalTests} тестов пройдено (${results.summary.avgResponseTime}ms)`, proxy.id);
      } else {
        addLog('error', `✗ ${proxy.name}: ${results.summary.failCount}/${results.summary.totalTests} тестов провалено`, proxy.id);
      }

      // Детали по каждому тесту
      results.tests.forEach(test => {
        if (test.success) {
          addLog('success', `  → ${test.target}: ${test.responseTime}ms`, proxy.id);
        } else {
          addLog('error', `  → ${test.target}: ${test.error}`, proxy.id);
        }
      });
      
    } catch (error) {
      addLog('error', `✗ ${proxy.name}: ${error.message}`, proxy.id);
    }
  };

  const runTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    
    addLog('info', '═══════════════════════════════════════════════════════');
    addLog('info', `Запуск тестирования ${proxies.length} прокси...`);
    addLog('info', '═══════════════════════════════════════════════════════');
    
    for (const proxy of proxies) {
      if (!proxy.enabled) {
        addLog('warning', `⊘ ${proxy.name}: Пропущен (отключен)`, proxy.id);
        continue;
      }
      
      await testSingleProxy(proxy);
      
      // Небольшая задержка между тестами
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addLog('info', '═══════════════════════════════════════════════════════');
    addLog('success', 'Тестирование завершено!');
    addLog('info', '═══════════════════════════════════════════════════════');
    
    setIsRunning(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxy-test-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = selectedProxy === 'all' 
    ? logs 
    : logs.filter(log => !log.proxyId || log.proxyId === parseInt(selectedProxy));

  return (
    <div className="proxy-console">
      <div className="console-header">
        <div className="console-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
          <h3>Консоль тестирования</h3>
        </div>
        
        <div className="console-controls">
          <select 
            value={selectedProxy} 
            onChange={(e) => setSelectedProxy(e.target.value)}
            className="console-filter"
            disabled={isRunning}
          >
            <option value="all">Все прокси</option>
            {proxies.map(proxy => (
              <option key={proxy.id} value={proxy.id}>{proxy.name}</option>
            ))}
          </select>

          <label className="console-checkbox">
            <input 
              type="checkbox" 
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Автоскролл</span>
          </label>

          <button 
            onClick={runTests} 
            className="btn-console btn-run"
            disabled={isRunning || proxies.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {isRunning ? 'Тестирование...' : 'Запустить тесты'}
          </button>

          <button 
            onClick={exportLogs} 
            className="btn-console btn-export"
            disabled={logs.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Экспорт
          </button>

          <button 
            onClick={clearLogs} 
            className="btn-console btn-clear"
            disabled={logs.length === 0 || isRunning}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Очистить
          </button>
        </div>
      </div>

      <div className="console-body" ref={consoleRef}>
        {filteredLogs.length === 0 ? (
          <div className="console-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <p>Нажмите "Запустить тесты" для начала тестирования прокси</p>
          </div>
        ) : (
          <div className="console-logs">
            {filteredLogs.map(log => (
              <div key={log.id} className={`console-log console-log-${log.type}`}>
                <span className="log-timestamp">[{log.timestamp}]</span>
                <span className="log-type">{log.type.toUpperCase()}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="console-footer">
        <span className="console-stats">
          {logs.length > 0 && (
            <>
              Всего логов: {filteredLogs.length} 
              {isRunning && <span className="console-loading">●</span>}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export default ProxyConsole;
