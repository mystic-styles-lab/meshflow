#!/bin/bash
# Принудительно устанавливаем ключи, которые мы уже знаем
PRIV="aIKJaBIVl2X1J3Ya0Wg54qgt5A_FbpIy0IeIqgxhpkw"

# Обновляем конфиг
sed -i "s/\"privateKey\": \".*\"/\"privateKey\": \"$PRIV\"/" /usr/local/etc/xray/config.json
systemctl restart xray

echo "=== КЛЮЧИ УСПЕШНО ПРИМЕНЕНЫ НА СЕРВЕРЕ ==="
