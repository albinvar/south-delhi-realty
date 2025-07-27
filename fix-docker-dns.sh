#!/bin/bash

# Docker DNS fix script
echo "🔧 Attempting to fix Docker DNS issues..."

# Method 1: Restart Docker with systemd DNS resolution
echo "Method 1: Restarting Docker service..."
sudo systemctl restart docker.service

# Method 2: Try using Google DNS for the system
echo "Method 2: Temporarily using Google DNS..."
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf.backup
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf.backup
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf.backup

# Method 3: Configure Docker daemon with custom DNS
echo "Method 3: Configuring Docker daemon..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker to apply changes
echo "Restarting Docker to apply DNS changes..."
sudo systemctl restart docker

# Test Docker connectivity
echo "Testing Docker connectivity..."
docker pull hello-world:latest

if [ $? -eq 0 ]; then
    echo "✅ Docker DNS issue fixed!"
    echo "Now you can try: docker compose build --no-cache"
else
    echo "❌ DNS issue persists. Try running the application locally instead."
    echo "Use: ./deploy-local.sh"
fi
