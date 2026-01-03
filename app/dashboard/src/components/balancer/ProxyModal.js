import React, { useState, useEffect } from 'react';
import './ProxyModal.css';

function ProxyModal({ proxy, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    protocol: 'socks5',
    username: '',
    password: '',
    enabled: true,
    priority: 0,
    max_connections: 100
  });

  useEffect(() => {
    if (proxy) {
      setFormData({
        name: proxy.name || '',
        host: proxy.host || '',
        port: proxy.port || '',
        protocol: proxy.protocol || 'socks5',
        username: proxy.username || '',
        password: proxy.password || '',
        enabled: proxy.enabled !== 0,
        priority: proxy.priority || 0,
        max_connections: proxy.max_connections || 100
      });
    }
  }, [proxy]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name || !formData.host || !formData.port) {
      alert('Заполните обязательные поля');
      return;
    }

    const data = {
      ...formData,
      port: parseInt(formData.port),
      priority: parseInt(formData.priority),
      max_connections: parseInt(formData.max_connections)
    };

    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{proxy ? 'Редактировать прокси' : 'Добавить прокси'}</h2>
          <button onClick={onClose} className="btn-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Название *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="PROXY1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="enabled">
                <input
                  id="enabled"
                  name="enabled"
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={handleChange}
                />
                Включен
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="host">Хост *</label>
              <input
                id="host"
                name="host"
                type="text"
                value={formData.host}
                onChange={handleChange}
                placeholder="127.0.0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="port">Порт *</label>
              <input
                id="port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                placeholder="1080"
                required
                min="1"
                max="65535"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Оставьте пустым если не требуется"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Оставьте пустым если не требуется"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Приоритет</label>
              <input
                id="priority"
                name="priority"
                type="number"
                value={formData.priority}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
              />
              <small>Чем выше значение, тем выше приоритет</small>
            </div>

            <div className="form-group">
              <label htmlFor="max_connections">Макс. соединений</label>
              <input
                id="max_connections"
                name="max_connections"
                type="number"
                value={formData.max_connections}
                onChange={handleChange}
                placeholder="100"
                min="1"
                max="10000"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Отмена
            </button>
            <button type="submit" className="btn-save">
              {proxy ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProxyModal;
