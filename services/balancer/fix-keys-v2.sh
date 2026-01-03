#!/bin/bash
# Пытаемся найти xray
XRAY_BIN=$(which xray)
if [ -z "$XRAY_BIN" ]; then
    XRAY_BIN="/usr/local/bin/xray"
fi

if [ ! -f "$XRAY_BIN" ]; then
    echo "ОШИБКА: xray не найден!"
    exit 1
fi

# Генерируем ключи
KEYS=$($XRAY_BIN x25519)
PRIV=$(echo "$KEYS" | grep "Private" | awk '{print $3}')
PUB=$(echo "$KEYS" | grep "Public" | awk '{print $3}')

if [ -z "$PRIV" ]; then
    echo "ОШИБКА: Не удалось сгенерировать ключи. Вывод xray:"
    echo "$KEYS"
    exit 1
fi

# Обновляем конфиг
sed -i "s/\"privateKey\": \".*\"/\"privateKey\": \"$PRIV\"/" /usr/local/etc/xray/config.json
systemctl restart xray

echo ""
echo "=== УСПЕШНО! ВАШ ПУБЛИЧНЫЙ КЛЮЧ ==="
echo "$PUB"
echo "==================================="
