#!/bin/bash

# Установка Xray (если не установлен)
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# Генерация ключей
UUID=$(xray uuid)
KEYS=$(xray x25519)
PRIVATE_KEY=$(echo "$KEYS" | grep "Private" | awk '{print $3}')
PUBLIC_KEY=$(echo "$KEYS" | grep "Public" | awk '{print $3}')
SHORT_ID=$(openssl rand -hex 4)
IP=$(curl -s ifconfig.me)

# Создание конфига сервера
cat > /usr/local/etc/xray/config.json <<EOF
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "$UUID",
            "flow": "xtls-rprx-vision"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "www.microsoft.com:443",
          "xver": 0,
          "serverNames": [
            "www.microsoft.com",
            "microsoft.com"
          ],
          "privateKey": "$PRIVATE_KEY",
          "shortIds": [
            "$SHORT_ID"
          ]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls",
          "quic"
        ]
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "DIRECT"
    },
    {
      "protocol": "blackhole",
      "tag": "BLOCK"
    }
  ]
}
EOF

# Перезапуск Xray
systemctl restart xray
systemctl enable xray

# Вывод конфига для клиента
echo ""
echo "=== ВСТАВЬТЕ ЭТОТ БЛОК В xray_balancer_config.json ВМЕСТО UDP_PROXY ==="
echo ""
cat <<EOF
    {
      "tag": "UDP_PROXY",
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "$IP",
            "port": 443,
            "users": [
              {
                "id": "$UUID",
                "flow": "xtls-rprx-vision",
                "encryption": "none"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "fingerprint": "chrome",
          "serverName": "www.microsoft.com",
          "publicKey": "$PUBLIC_KEY",
          "shortId": "$SHORT_ID",
          "spiderX": ""
        }
      }
    }
EOF
echo ""
echo "======================================================================="
