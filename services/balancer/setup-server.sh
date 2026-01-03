# Quick setup script for server
# Run: ssh root@89.23.113.155 "bash -s" < setup-server.sh

echo "Installing dependencies..."

# Update package list
apt-get update

# Install required packages
apt-get install -y unzip curl wget git

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install Docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose (if not installed)
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo ""
echo "Setup completed!"
echo "Installed:"
node --version
npm --version
docker --version
docker-compose --version
