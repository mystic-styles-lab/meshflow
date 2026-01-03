"""
Tariffs Manager
"""
from typing import Dict, List, Optional
from .database import TariffsDatabase


class TariffsManager:
    def __init__(self, db: TariffsDatabase):
        self.db = db
    
    def add_tariff(self, name: str, price: float, duration_days: int,
                   traffic_limit: int, description: str = "",
                   max_connections: int = 3, speed_limit: int = 0) -> int:
        """Add new tariff"""
        return self.db.add_tariff(
            name, price, duration_days, traffic_limit,
            description, max_connections, speed_limit
        )
    
    def get_tariff(self, tariff_id: int) -> Optional[Dict]:
        """Get tariff by ID"""
        return self.db.get_tariff(tariff_id)
    
    def get_all_tariffs(self) -> List[Dict]:
        """Get all tariffs"""
        return self.db.get_all_tariffs()
    
    def get_enabled_tariffs(self) -> List[Dict]:
        """Get enabled tariffs only"""
        return self.db.get_enabled_tariffs()
    
    def update_tariff(self, tariff_id: int, **kwargs) -> bool:
        """Update tariff"""
        return self.db.update_tariff(tariff_id, **kwargs)
    
    def delete_tariff(self, tariff_id: int) -> bool:
        """Delete tariff"""
        return self.db.delete_tariff(tariff_id)
    
    def toggle_tariff(self, tariff_id: int, enabled: bool) -> bool:
        """Enable/disable tariff"""
        return self.db.update_tariff(tariff_id, enabled=1 if enabled else 0)
