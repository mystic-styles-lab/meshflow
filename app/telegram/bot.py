"""
Telegram Bot для Marzban VPN
Функции:
- Вход в Mini App
- Уведомления пользователям
- Привязка аккаунта к Telegram ID
"""

import logging
from typing import Optional
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from app.db import crud, get_db
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID, WEBAPP_URL

logger = logging.getLogger(__name__)


class MarzbanTelegramBot:
    def __init__(self, token: str, webapp_url: str):
        self.token = token
        self.webapp_url = webapp_url
        self.application = None

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        user = update.effective_user
        telegram_id = user.id
        
        # Проверяем, есть ли пользователь в базе
        db = next(get_db())
        try:
            db_user = crud.get_user_by_telegram_id(db, telegram_id)
            
            if db_user:
                # Пользователь найден - показываем кнопку входа в Mini App
                keyboard = [
                    [InlineKeyboardButton(
                        "🚀 Открыть личный кабинет",
                        web_app=WebAppInfo(url=f"{self.webapp_url}?telegram_id={telegram_id}")
                    )]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    f"👋 Добро пожаловать, {user.first_name}!\n\n"
                    f"🔐 Ваш аккаунт: {db_user.username}\n"
                    f"📊 Статус: {'✅ Активен' if db_user.status == 'active' else '❌ Неактивен'}\n\n"
                    f"Нажмите кнопку ниже, чтобы открыть личный кабинет:",
                    reply_markup=reply_markup
                )
            else:
                # Пользователь не найден - предлагаем связаться с администратором
                await update.message.reply_text(
                    f"👋 Привет, {user.first_name}!\n\n"
                    f"🔍 Ваш Telegram аккаунт еще не привязан к VPN.\n\n"
                    f"📝 Ваш Telegram ID: `{telegram_id}`\n\n"
                    f"Отправьте этот ID администратору для активации доступа.",
                    parse_mode="Markdown"
                )
        finally:
            db.close()

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        help_text = """
🤖 **Доступные команды:**

/start - Открыть личный кабинет
/help - Показать это сообщение
/status - Проверить статус вашего аккаунта
/myid - Получить ваш Telegram ID

💡 **Как использовать:**
1. Получите доступ от администратора
2. Используйте /start для входа в личный кабинет
3. Управляйте подпиской через Mini App
        """
        await update.message.reply_text(help_text, parse_mode="Markdown")

    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /status"""
        telegram_id = update.effective_user.id
        
        db = next(get_db())
        try:
            db_user = crud.get_user_by_telegram_id(db, telegram_id)
            
            if db_user:
                # Форматирование трафика
                used_gb = db_user.used_traffic / (1024**3)
                limit_gb = db_user.data_limit / (1024**3) if db_user.data_limit else 0
                
                # Форматирование даты истечения
                from datetime import datetime
                expire_date = datetime.fromtimestamp(db_user.expire) if db_user.expire else None
                expire_str = expire_date.strftime("%d.%m.%Y") if expire_date else "Не указана"
                
                status_text = f"""
📊 **Статус вашего аккаунта:**

👤 Логин: `{db_user.username}`
🔐 Статус: {'✅ Активен' if db_user.status == 'active' else '❌ Неактивен'}

📈 Трафик:
   Использовано: {used_gb:.2f} GB
   Лимит: {limit_gb:.2f} GB
   Осталось: {limit_gb - used_gb:.2f} GB

📅 Срок действия: {expire_str}
                """
                
                await update.message.reply_text(status_text, parse_mode="Markdown")
            else:
                await update.message.reply_text(
                    "❌ Ваш Telegram аккаунт не привязан к VPN.\n"
                    "Используйте /start для получения инструкций."
                )
        finally:
            db.close()

    async def myid_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /myid"""
        telegram_id = update.effective_user.id
        await update.message.reply_text(
            f"🆔 Ваш Telegram ID: `{telegram_id}`\n\n"
            f"Отправьте этот ID администратору для привязки аккаунта.",
            parse_mode="Markdown"
        )

    async def send_notification(self, telegram_id: int, message: str):
        """Отправка уведомления пользователю"""
        try:
            await self.application.bot.send_message(
                chat_id=telegram_id,
                text=message,
                parse_mode="Markdown"
            )
            logger.info(f"Notification sent to {telegram_id}")
        except Exception as e:
            logger.error(f"Failed to send notification to {telegram_id}: {e}")

    async def send_expiry_warning(self, telegram_id: int, username: str, days_left: int):
        """Отправка предупреждения об истечении срока"""
        message = f"""
⚠️ **Предупреждение о подписке**

Привет! Срок действия вашей подписки истекает через **{days_left} дней**.

👤 Аккаунт: `{username}`
📅 Осталось дней: {days_left}

🔄 Продлите подписку, чтобы продолжить использование VPN.
        """
        await self.send_notification(telegram_id, message)

    async def send_traffic_warning(self, telegram_id: int, username: str, percent_used: float):
        """Отправка предупреждения о трафике"""
        message = f"""
⚠️ **Предупреждение о трафике**

Вы использовали **{percent_used:.0f}%** вашего трафика.

👤 Аккаунт: `{username}`
📊 Использовано: {percent_used:.0f}%

💡 Рекомендуем следить за использованием трафика или увеличить лимит.
        """
        await self.send_notification(telegram_id, message)

    async def send_payment_success(self, telegram_id: int, tariff_name: str, amount: float):
        """Отправка подтверждения оплаты"""
        message = f"""
✅ **Оплата успешна!**

Спасибо за оплату!

💳 Тариф: {tariff_name}
💰 Сумма: {amount} ₽

Ваша подписка активирована. Используйте /start для входа в личный кабинет.
        """
        await self.send_notification(telegram_id, message)

    def setup_handlers(self):
        """Настройка обработчиков команд"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        self.application.add_handler(CommandHandler("myid", self.myid_command))

    def run(self):
        """Запуск бота"""
        self.application = Application.builder().token(self.token).build()
        self.setup_handlers()
        
        logger.info("Telegram bot started")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


# Singleton instance
_bot_instance: Optional[MarzbanTelegramBot] = None


def get_bot() -> MarzbanTelegramBot:
    """Получение экземпляра бота"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = MarzbanTelegramBot(TELEGRAM_BOT_TOKEN, WEBAPP_URL)
    return _bot_instance


async def notify_user(telegram_id: int, message: str):
    """Helper функция для отправки уведомлений"""
    bot = get_bot()
    if bot.application:
        await bot.send_notification(telegram_id, message)
