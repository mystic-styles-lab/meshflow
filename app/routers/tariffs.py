"""
Tariffs API Router
Управление тарифами
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/tariffs", tags=["Tariffs"])

# Lazy initialization
_db = None
_tariffs_manager = None


def snake_to_camel(snake_dict):
    """Convert snake_case dict keys to camelCase"""
    camel_dict = {}
    for key, value in snake_dict.items():
        parts = key.split('_')
        camel_key = parts[0] + ''.join(word.capitalize() for word in parts[1:])
        camel_dict[camel_key] = value
    return camel_dict


def get_tariffs_manager():
    """Get or create tariffs manager instance"""
    global _db, _tariffs_manager
    
    if _tariffs_manager is None:
        from app.services.tariffs import TariffsManager
        from app.services.tariffs.database import TariffsDatabase
        
        _db = TariffsDatabase()
        _tariffs_manager = TariffsManager(_db)
    
    return _tariffs_manager


class TariffCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    durationDays: int
    trafficLimit: int  # in bytes
    unlimitedTraffic: bool = False
    maxConnections: int = 3
    speedLimit: int = 0  # 0 = unlimited, in Mbps


class TariffUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    durationDays: Optional[int] = None
    trafficLimit: Optional[int] = None
    unlimitedTraffic: Optional[bool] = None
    maxConnections: Optional[int] = None
    speedLimit: Optional[int] = None


class TariffToggle(BaseModel):
    enabled: bool


@router.get("/")
async def get_tariffs(enabled_only: bool = False):
    """Получить список тарифов"""
    try:
        manager = get_tariffs_manager()
        if enabled_only:
            tariffs = manager.get_enabled_tariffs()
        else:
            tariffs = manager.get_all_tariffs()
        return [snake_to_camel(tariff) for tariff in tariffs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tariffs: {str(e)}")


@router.post("/")
async def add_tariff(tariff: TariffCreate):
    """Добавить новый тариф"""
    try:
        manager = get_tariffs_manager()
        tariff_id = manager.add_tariff(
            name=tariff.name,
            description=tariff.description,
            price=tariff.price,
            duration_days=tariff.durationDays,
            traffic_limit=tariff.trafficLimit,
            unlimited_traffic=tariff.unlimitedTraffic,
            max_connections=tariff.maxConnections,
            speed_limit=tariff.speedLimit
        )
        return {"id": tariff_id, "message": "Tariff added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error adding tariff: {str(e)}")


@router.put("/{tariff_id}")
async def update_tariff(tariff_id: int, tariff: TariffUpdate):
    """Обновить тариф"""
    try:
        manager = get_tariffs_manager()
        updates = {k: v for k, v in tariff.dict(exclude_unset=True).items() if v is not None}
        
        # Convert camelCase to snake_case
        snake_updates = {}
        for key, value in updates.items():
            if key == 'durationDays':
                snake_updates['duration_days'] = value
            elif key == 'trafficLimit':
                snake_updates['traffic_limit'] = value
            elif key == 'unlimitedTraffic':
                snake_updates['unlimited_traffic'] = 1 if value else 0
            elif key == 'maxConnections':
                snake_updates['max_connections'] = value
            elif key == 'speedLimit':
                snake_updates['speed_limit'] = value
            else:
                snake_updates[key] = value
        
        success = manager.update_tariff(tariff_id, **snake_updates)
        
        if not success:
            raise HTTPException(status_code=404, detail="Tariff not found")
        
        return {"message": "Tariff updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating tariff: {str(e)}")


@router.delete("/{tariff_id}")
async def delete_tariff(tariff_id: int):
    """Удалить тариф"""
    try:
        manager = get_tariffs_manager()
        success = manager.delete_tariff(tariff_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Tariff not found")
        
        return {"message": "Tariff deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting tariff: {str(e)}")


@router.post("/{tariff_id}/toggle")
async def toggle_tariff(tariff_id: int, data: TariffToggle):
    """Включить/выключить тариф"""
    try:
        manager = get_tariffs_manager()
        success = manager.toggle_tariff(tariff_id, data.enabled)
        
        if not success:
            raise HTTPException(status_code=404, detail="Tariff not found")
        
        return {"message": f"Tariff {'enabled' if data.enabled else 'disabled'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error toggling tariff: {str(e)}")
