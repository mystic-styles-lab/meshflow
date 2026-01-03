import React from 'react';
import './TestResultModal.css';

function TestResultModal({ isOpen, onClose, results }) {
  if (!isOpen) return null;

  if (!results) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Тестирование прокси</h3>
            <button className="btn-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Ошибка тестирования</h3>
            <button className="btn-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="error-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p>{results.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { proxyName, host, port, summary, tests } = results;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content test-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Результаты тестирования</h3>
          <button className="btn-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="test-header">
            <div className="test-proxy-info">
              <h4>{proxyName}</h4>
              <span className="test-proxy-address">{host}:{port}</span>
            </div>
            <div className={`test-status ${summary.isHealthy ? 'healthy' : 'unhealthy'}`}>
              {summary.isHealthy ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Здоров</span>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>Проблемы</span>
                </>
              )}
            </div>
          </div>

          <div className="test-summary">
            <div className="summary-card">
              <div className="summary-label">Успешность</div>
              <div className="summary-value">{summary.successRate}</div>
              <div className="summary-detail">{summary.successCount}/{summary.totalTests} тестов</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Среднее время</div>
              <div className="summary-value">{summary.avgResponseTime}ms</div>
              <div className="summary-detail">отклика</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Общее время</div>
              <div className="summary-value">{summary.totalTime}ms</div>
              <div className="summary-detail">тестирования</div>
            </div>
          </div>

          <div className="test-details">
            <h4>Детали тестов</h4>
            <div className="test-list">
              {tests.map((test, index) => (
                <div key={index} className={`test-item ${test.success ? 'success' : 'failed'}`}>
                  <div className="test-item-header">
                    <div className="test-item-icon">
                      {test.success ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </div>
                    <div className="test-item-info">
                      <div className="test-target">{test.target}</div>
                      {test.success ? (
                        <div className="test-time">{test.responseTime}ms</div>
                      ) : (
                        <div className="test-error">{test.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

export default TestResultModal;
