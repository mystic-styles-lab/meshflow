"""
Proxy Balancer Service
Встроенный балансировщик прокси для Marzban
"""

from .proxy_balancer import ProxyBalancer
from .models import ProxyConfig, BalancerStats

__all__ = ['ProxyBalancer', 'ProxyConfig', 'BalancerStats']
