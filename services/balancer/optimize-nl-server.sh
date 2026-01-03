#!/bin/bash

# Скрипт оптимизации сети для сервера (BBR + UDP Tuning)
# Запускать от root

echo "=== Начало оптимизации сервера ==="

# 1. Включение BBR (Google Congestion Control)
echo "[1/3] Включение BBR..."
if ! grep -q "net.core.default_qdisc=fq" /etc/sysctl.conf; then
    echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
    echo "✓ BBR добавлен в конфиг"
else
    echo "✓ BBR уже настроен"
fi

# 2. Оптимизация параметров ядра для UDP и TCP
echo "[2/3] Настройка параметров ядра..."
cat > /etc/sysctl.d/99-custom-tuning.conf <<EOF
# Увеличение лимитов открытых файлов
fs.file-max = 1000000

# Увеличение буферов TCP/UDP для высокой скорости
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.netdev_max_backlog = 250000
net.core.somaxconn = 4096

# Оптимизация TCP
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_mtu_probing = 1

# Оптимизация UDP (важно для QUIC и звонков)
net.ipv4.udp_rmem_min = 8192
net.ipv4.udp_wmem_min = 8192
EOF

# Применение настроек
sysctl -p /etc/sysctl.d/99-custom-tuning.conf
echo "✓ Параметры ядра применены"

# 3. Проверка статуса
echo "[3/3] Проверка..."
CURRENT_CC=$(sysctl net.ipv4.tcp_congestion_control | awk '{print $3}')
if [ "$CURRENT_CC" == "bbr" ]; then
    echo "✓ BBR успешно активирован!"
else
    echo "⚠ Внимание: BBR не активен (текущий: $CURRENT_CC). Возможно требуется перезагрузка."
fi

echo "=== Оптимизация завершена! ==="
echo "Рекомендуется перезагрузить сервер: reboot"
