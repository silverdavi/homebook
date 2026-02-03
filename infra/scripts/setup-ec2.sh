#!/bin/bash
# Run on fresh Ubuntu 22.04 EC2 instance
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-ec2.sh | bash

set -e

echo "🖥️  Setting up Homebook EC2 Instance"
echo "====================================="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install AWS CLI
echo "📦 Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /opt/homebook
sudo chown ubuntu:ubuntu /opt/homebook

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone repository: git clone <repo> /opt/homebook"
echo "  2. Copy .env file"
echo "  3. Run: cd /opt/homebook && ./infra/scripts/deploy-generator.sh"
echo "  4. Configure nginx: sudo cp /opt/homebook/infra/nginx/api.conf /etc/nginx/sites-available/"
echo "  5. Get SSL cert: sudo certbot --nginx -d api.teacher.ninja"
