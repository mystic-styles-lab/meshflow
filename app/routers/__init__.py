from fastapi import APIRouter
from . import (
    admin, 
    balancer,
    core, 
    node, 
    subscription, 
    system, 
    tariffs,
    telegram,
    user_template, 
    user,
    user_cabinet,
    home,
)

api_router = APIRouter()

routers = [
    admin.router,
    balancer.router,
    core.router,
    node.router,
    subscription.router,
    system.router,
    tariffs.router,
    telegram.router,
    user_template.router,
    user.router,
    user_cabinet.router,
    home.router,
]

for router in routers:
    api_router.include_router(router)

__all__ = ["api_router"]