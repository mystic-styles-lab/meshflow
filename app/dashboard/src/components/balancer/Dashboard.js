import React, { useState, useEffect } from 'react';
import ProxyList from './ProxyList';
import ProxyModal from './ProxyModal';
import Statistics from './Statistics';
import TestResultModal from './TestResultModal';
import ProxyConsole from './ProxyConsole';
import LiveConsole from './LiveConsole';
import { proxies, stats } from '../api';
import './Dashboard.css';

function Dashboard({ username, onLogout, view = 'proxies' }) {
  const [proxyList, setProxyList] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    loadData();
    
    // Автообновление каждые 5 секунд
    const interval = setInterval(() => loadData(true), 5000);
    
    // Обновление при возврате на страницу
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const [proxiesRes, statsRes] = await Promise.all([
        proxies.getAll(),
        stats.get()
      ]);
      
      setProxyList(proxiesRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddProxy = () => {
    setEditingProxy(null);
    setShowModal(true);
  };

  const handleEditProxy = (proxy) => {
    setEditingProxy(proxy);
    setShowModal(true);
  };

  const handleDeleteProxy = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот прокси?')) {
      return;
    }
    
    try {
      await proxies.delete(id);
      loadData();
    } catch (error) {
      alert('Ошибка удаления прокси');
    }
  };

  const handleToggleProxy = async (id, enabled) => {
    try {
      await proxies.toggle(id, enabled);
      loadData();
    } catch (error) {
      alert('Ошибка изменения статуса прокси');
    }
  };

  const handleTestProxy = async (id) => {
    try {
      const response = await proxies.test(id);
      const results = response.data;
      
      setTestResults(results);
      setShowTestModal(true);
      
      loadData();
    } catch (error) {
      setTestResults({
        error: true,
        message: error.response?.data?.error || error.message
      });
      setShowTestModal(true);
    }
  };

  const handleSaveProxy = async (data) => {
    try {
      if (editingProxy) {
        await proxies.update(editingProxy.id, data);
      } else {
        await proxies.create(data);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения прокси');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Proxy Balancer</h1>
          <span className="header-subtitle">Marzban</span>
        </div>
        
        <div className="header-right">
          {refreshing && (
            <div className="refresh-indicator">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Обновление...</span>
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {view === 'proxies' && (
          <>
            <Statistics data={statistics} />
            
            <div className="proxy-section">
              <div className="section-header">
                <h2>Прокси серверы</h2>
                <button onClick={handleAddProxy} className="btn-add">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Добавить прокси
                </button>
              </div>
              
              <ProxyList 
                proxies={proxyList}
                onEdit={handleEditProxy}
                onDelete={handleDeleteProxy}
                onToggle={handleToggleProxy}
                onTest={handleTestProxy}
              />
            </div>

            <div className="console-section">
              <ProxyConsole proxies={proxyList} />
            </div>
          </>
        )}

        {view === 'logs' && (
          <div className="console-section" style={{ marginTop: 0 }}>
            <LiveConsole />
          </div>
        )}
      </main>

      {showModal && (
        <ProxyModal
          proxy={editingProxy}
          onSave={handleSaveProxy}
          onClose={() => setShowModal(false)}
        />
      )}

      <TestResultModal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setTestResults(null);
        }}
        results={testResults}
      />
    </div>
  );
}

export default Dashboard;
