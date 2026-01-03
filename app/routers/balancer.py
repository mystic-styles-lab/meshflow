"""
Proxy Balancer API Router
Прокси-роутер для интеграции балансера с Marzban API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/balancer", tags=["Balancer"])

# Lazy initialization
_db = None
_proxy_manager = None


def snake_to_camel(snake_dict):
    """Convert snake_case dict keys to camelCase"""
    camel_dict = {}
    for key, value in snake_dict.items():
        parts = key.split('_')
        camel_key = parts[0] + ''.join(word.capitalize() for word in parts[1:])
        camel_dict[camel_key] = value
    return camel_dict


def get_proxy_manager():
    """Get or create proxy manager instance"""
    global _db, _proxy_manager
    
    if _proxy_manager is None:
        from app.services.balancer import ProxyManager
        from app.services.balancer.database import BalancerDatabase
        
        _db = BalancerDatabase()
        _proxy_manager = ProxyManager(_db)
    
    return _proxy_manager


class ProxyCreate(BaseModel):
    name: str
    host: str
    port: int
    protocol: str = 'socks5'
    username: Optional[str] = None
    password: Optional[str] = None
    priority: int = 0
    maxConnections: int = 100


class ProxyUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    protocol: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    priority: Optional[int] = None
    maxConnections: Optional[int] = None


class ProxyToggle(BaseModel):
    enabled: bool


@router.get("/proxies")
async def get_proxies():
    """Получить список прокси"""
    try:
        proxy_manager = get_proxy_manager()
        proxies = proxy_manager.get_all_proxies()
        # Convert to camelCase
        return [snake_to_camel(proxy) for proxy in proxies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching proxies: {str(e)}")


@router.post("/proxies")
async def add_proxy(proxy: ProxyCreate):
    """Добавить новый прокси"""
    try:
        proxy_manager = get_proxy_manager()
        proxy_id = proxy_manager.add_proxy(
            name=proxy.name,
            host=proxy.host,
            port=proxy.port,
            protocol=proxy.protocol,
            username=proxy.username,
            password=proxy.password,
            priority=proxy.priority,
            max_connections=proxy.maxConnections
        )
        return {"id": proxy_id, "message": "Proxy added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error adding proxy: {str(e)}")


@router.put("/proxies/{proxy_id}")
async def update_proxy(proxy_id: int, proxy: ProxyUpdate):
    """Обновить прокси"""
    try:
        proxy_manager = get_proxy_manager()
        updates = {k: v for k, v in proxy.dict(exclude_unset=True).items() if v is not None}
        
        # Convert camelCase to snake_case
        if 'maxConnections' in updates:
            updates['max_connections'] = updates.pop('maxConnections')
        
        success = proxy_manager.update_proxy(proxy_id, **updates)
        
        if not success:
            raise HTTPException(status_code=404, detail="Proxy not found")
        
        return {"message": "Proxy updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating proxy: {str(e)}")


@router.delete("/proxies/{proxy_id}")
async def delete_proxy(proxy_id: int):
    """Удалить прокси"""
    try:
        proxy_manager = get_proxy_manager()
        success = proxy_manager.delete_proxy(proxy_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Proxy not found")
        
        return {"message": "Proxy deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting proxy: {str(e)}")


@router.post("/proxies/{proxy_id}/toggle")
async def toggle_proxy(proxy_id: int, data: ProxyToggle):
    """Включить/выключить прокси"""
    try:
        proxy_manager = get_proxy_manager()
        success = proxy_manager.toggle_proxy(proxy_id, data.enabled)
        
        if not success:
            raise HTTPException(status_code=404, detail="Proxy not found")
        
        return {"message": f"Proxy {'enabled' if data.enabled else 'disabled'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error toggling proxy: {str(e)}")


@router.post("/proxies/{proxy_id}/test")
async def test_proxy(proxy_id: int):
    """Тестировать прокси"""
    try:
        proxy_manager = get_proxy_manager()
        result = await proxy_manager.test_proxy(proxy_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error testing proxy: {str(e)}")


@router.post("/proxies/test-all")
async def test_all_proxies():
    """Тестировать все прокси"""
    try:
        proxy_manager = get_proxy_manager()
        results = await proxy_manager.test_all_proxies()
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error testing proxies: {str(e)}")


@router.get("/stats")
async def get_stats():
    """Получить статистику"""
    try:
        proxy_manager = get_proxy_manager()
        stats = proxy_manager.get_statistics()
        return snake_to_camel(stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

