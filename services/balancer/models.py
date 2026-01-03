"""
Модели данных для балансировщика прокси
"""
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class ProxyConfig:
    """Конфигурация прокси сервера"""
    id: int
    name: str
    protocol: str  # socks5, http, https
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: bool = True
    priority: int = 1
    max_connections: int = 100
    
    # Статистика
    active_connections: int = 0
    total_connections: int = 0
    successful_connections: int = 0
    failed_connections: int = 0
    total_bytes_sent: int = 0
    total_bytes_received: int = 0
    last_used: Optional[datetime] = None
    avg_response_time: Optional[float] = None
    healthy: bool = True


@dataclass
class BalancerStats:
    """Статистика балансировщика"""
    total_proxies: int = 0
    active_proxies: int = 0
    total_connections: int = 0
    active_connections: int = 0
    success_rate: float = 0.0
    total_bytes_sent: int = 0
    total_bytes_received: int = 0
