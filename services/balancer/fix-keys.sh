#!/bin/bash
# Генерируем новые ключи
KEYS=$(xray x25519)
PRIV=$(echo "$KEYS" | grep "Private" | awk '{print $3}')
PUB=$(echo "$KEYS" | grep "Public" | awk '{print $3}')

# Обновляем конфиг сервера
sed -i "s/\"privateKey\": \".*\"/\"privateKey\": \"$PRIV\"/" /usr/local/etc/xray/config.json
systemctl restart xray

echo ""
echo "=== НОВЫЙ ПУБЛИЧНЫЙ КЛЮЧ (СКОПИРУЙТЕ ЕГО) ==="
echo "$PUB"
echo "============================================="
