"""
User Cabinet API Router
Личный кабинет пользователя (тестовая версия без аккаунтинга)
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/user-cabinet", tags=["UserCabinet"])


@router.get("/info")
async def get_user_info():
    """Получить информацию о пользователе (тестовые данные)"""
    return {
        "username": "test_user",
        "tariff": {
            "id": 1,
            "name": "Premium",
            "description": "Премиум тариф с высокой скоростью",
            "price": 999.0,
            "durationDays": 30,
            "trafficLimit": 100 * 1024 * 1024 * 1024,  # 100 GB
            "maxConnections": 5,
            "speedLimit": 0  # unlimited
        },
        "subscriptionExpiry": (datetime.now() + timedelta(days=30)).isoformat(),
        "trafficUsed": 45 * 1024 * 1024 * 1024,     # 45 GB
        "createdAt": (datetime.now() - timedelta(days=15)).isoformat(),
        "isActive": True
    }


@router.get("/stats/daily")
async def get_daily_stats():
    """Получить статистику за последние 7 дней (тестовые данные)"""
    stats = []
    for i in range(7, 0, -1):
        date = datetime.now() - timedelta(days=i)
        stats.append({
            "date": date.strftime("%Y-%m-%d"),
            "upload": random.randint(100, 800) * 1024 * 1024,    # MB
            "download": random.randint(500, 2000) * 1024 * 1024,  # MB
            "requests": random.randint(500, 2000)
        })
    return stats
