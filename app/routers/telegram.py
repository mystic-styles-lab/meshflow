"""
API endpoints для Telegram Mini App
"""

import hashlib
import hmac
import time
from typing import Optional
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import crud, get_db
from config import TELEGRAM_BOT_TOKEN

router = APIRouter(tags=["Telegram Mini App"], prefix="/telegram")


class TelegramAuthData(BaseModel):
    """Данные авторизации из Telegram Mini App"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class UserLinkRequest(BaseModel):
    """Запрос на привязку пользователя к Telegram"""
    username: str
    telegram_id: int


class TelegramUserInfo(BaseModel):
    """Информация о пользователе для Mini App"""
    telegram_id: int
    username: Optional[str]
    is_linked: bool
    vpn_username: Optional[str] = None
    status: Optional[str] = None
    used_traffic: Optional[int] = None
    data_limit: Optional[int] = None
    expire: Optional[int] = None


def verify_telegram_auth(auth_data: dict, bot_token: str) -> bool:
    """
    Проверка подлинности данных от Telegram Mini App
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    received_hash = auth_data.pop('hash', None)
    if not received_hash:
        return False
    
    # Создаём строку проверки
    data_check_arr = [f"{k}={v}" for k, v in sorted(auth_data.items())]
    data_check_string = '\n'.join(data_check_arr)
    
    # Вычисляем secret_key
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=bot_token.encode(),
        digestmod=hashlib.sha256
    ).digest()
    
    # Вычисляем hash
    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    return calculated_hash == received_hash


@router.post("/auth", response_model=TelegramUserInfo)
async def telegram_auth(
    auth_data: TelegramAuthData,
    db: Session = Depends(get_db)
):
    """
    Авторизация пользователя через Telegram Mini App
    """
    # Проверяем подлинность данных
    auth_dict = auth_data.dict()
    if not verify_telegram_auth(auth_dict.copy(), TELEGRAM_BOT_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid Telegram authentication data")
    
    # Проверяем, не устарели ли данные (не старше 1 часа)
    current_time = int(time.time())
    if current_time - auth_data.auth_date > 3600:
        raise HTTPException(status_code=401, detail="Authentication data is too old")
    
    # Ищем пользователя по telegram_id
    user = crud.get_user_by_telegram_id(db, auth_data.id)
    
    if user:
        # Пользователь найден - возвращаем его данные
        return TelegramUserInfo(
            telegram_id=auth_data.id,
            username=auth_data.username,
            is_linked=True,
            vpn_username=user.username,
            status=user.status.value,
            used_traffic=user.used_traffic,
            data_limit=user.data_limit,
            expire=user.expire
        )
    else:
        # Пользователь не найден - возвращаем базовую информацию
        return TelegramUserInfo(
            telegram_id=auth_data.id,
            username=auth_data.username,
            is_linked=False
        )


@router.post("/link-user")
async def link_user_to_telegram(
    link_request: UserLinkRequest,
    db: Session = Depends(get_db)
):
    """
    Привязка существующего пользователя Marzban к Telegram ID
    (только для администраторов)
    """
    # Находим пользователя по username
    user = crud.get_user(db, link_request.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверяем, не привязан ли уже этот telegram_id
    existing_user = crud.get_user_by_telegram_id(db, link_request.telegram_id)
    if existing_user and existing_user.id != user.id:
        raise HTTPException(
            status_code=400,
            detail=f"This Telegram ID is already linked to user: {existing_user.username}"
        )
    
    # Привязываем telegram_id к пользователю
    user.telegram_id = link_request.telegram_id
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": f"User {user.username} successfully linked to Telegram ID {link_request.telegram_id}",
        "username": user.username,
        "telegram_id": user.telegram_id
    }


@router.get("/user-info/{telegram_id}", response_model=TelegramUserInfo)
async def get_telegram_user_info(
    telegram_id: int,
    db: Session = Depends(get_db)
):
    """
    Получение информации о пользователе по Telegram ID
    """
    user = crud.get_user_by_telegram_id(db, telegram_id)
    
    if user:
        return TelegramUserInfo(
            telegram_id=telegram_id,
            username=None,  # Telegram username не сохраняем в БД
            is_linked=True,
            vpn_username=user.username,
            status=user.status.value,
            used_traffic=user.used_traffic,
            data_limit=user.data_limit,
            expire=user.expire
        )
    else:
        return TelegramUserInfo(
            telegram_id=telegram_id,
            username=None,
            is_linked=False
        )


@router.post("/unlink-user/{username}")
async def unlink_user_from_telegram(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Отвязать пользователя от Telegram ID
    (только для администраторов)
    """
    user = crud.get_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.telegram_id:
        raise HTTPException(status_code=400, detail="User is not linked to Telegram")
    
    old_telegram_id = user.telegram_id
    user.telegram_id = None
    db.commit()
    
    return {
        "success": True,
        "message": f"User {username} unlinked from Telegram ID {old_telegram_id}",
        "username": username
    }
