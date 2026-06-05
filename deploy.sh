#!/bin/bash

# ============================================
# Toeflynk One-Click Deploy Script for Ubuntu
# ============================================
# Tested on Ubuntu 22.04 LTS and 24.04 LTS
# Run as root or with sudo privileges
# ============================================

set -e  # Exit on error
set -o pipefail  # Exit if any command in a pipeline fails

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Edit these variables before running!
APP_DOMAIN="toeflynk.com"          # Your main domain
APP_DIR="/var/www/toeflynk"        # App directory
DB_NAME="toeflynk"                 # Database name
DB_USER="toeflynk"                 # Database user
DB_PASS=$(openssl rand -hex 16)    # Auto-generated strong password
NODE_VERSION="24"                  # Node.js version (LTS recommended)
SYSTEMD_SERVICE="toeflynk"         # Systemd service name

# ============================================
# Function to print status messages
# ============================================
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[!]${NC} $1"
}

# ============================================
# Check if running as root
# ============================================
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script as root or with sudo"
    exit 1
fi

# ============================================
# Step 1: Update system packages
# ============================================
print_status "Updating system packages..."
apt update && apt upgrade -y

# ============================================
# Step 2: Install required dependencies
# ============================================
print_status "Installing dependencies..."
apt install -y curl git nginx certbot python3-certbot-nginx postgresql postgresql-contrib

# ============================================
# Step 3: Install Node.js and pnpm
# ============================================
print_status "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

print_status "Installing pnpm..."
npm install -g pnpm@10

# ============================================
# Step 4: Setup PostgreSQL database
# ============================================
print_status "Setting up PostgreSQL database..."

# Create database user
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || true

# Create database
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# ============================================
# Step 5: Clone or setup app (assume app is already in $APP_DIR or we'll create a placeholder)
# ============================================
print_status "Setting up app directory..."
mkdir -p $APP_DIR

# If you have a git repo, uncomment below and replace with your repo URL
# print_status "Cloning app repository..."
# git clone https://github.com/yourusername/toeflynk.git $APP_DIR

# Otherwise, we'll assume you upload the app files manually to $APP_DIR

# ============================================
# Step 6: Create .env file
# ============================================
print_status "Creating .env file..."

BETTER_AUTH_SECRET=$(openssl rand -hex 32)

cat > $APP_DIR/.env <<EOL
# Database
DATABASE_URL="$DATABASE_URL"

# Auth
BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET"
BETTER_AUTH_URL="https://$APP_DOMAIN"

# Midtrans
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="toeflynk-assets"
R2_PUBLIC_URL=""

# Inngest
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# App
NEXT_PUBLIC_APP_URL="https://$APP_DOMAIN"
NEXT_PUBLIC_APP_DOMAIN="$APP_DOMAIN"
EOL

# ============================================
# Step 7: Install dependencies and build app
# ============================================
print_status "Installing app dependencies..."
cd $APP_DIR
pnpm install

print_status "Running database migrations..."
pnpm db:migrate

print_status "Building Next.js app..."
pnpm build

# ============================================
# Step 8: Create systemd service
# ============================================
print_status "Creating systemd service..."

cat > /etc/systemd/system/$SYSTEMD_SERVICE.service <<EOL
[Unit]
Description=Toeflynk Next.js App
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

[Install]
WantedBy=multi-user.target
EOL

# Set correct permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Reload systemd and start service
systemctl daemon-reload
systemctl enable $SYSTEMD_SERVICE
systemctl start $SYSTEMD_SERVICE

# ============================================
# Step 9: Configure Nginx
# ============================================
print_status "Configuring Nginx..."

# Remove default Nginx config
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Create new Nginx config
cat > /etc/nginx/sites-available/$SYSTEMD_SERVICE <<EOL
server {
    listen 80;
    server_name $APP_DOMAIN www.$APP_DOMAIN;

    # For Let's Encrypt challenge
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    # Reverse proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
    }
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/$SYSTEMD_SERVICE /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# ============================================
# Step 10: Setup SSL with Let's Encrypt (optional, interactive)
# ============================================
print_warning "Next step: Setup SSL certificate with Let's Encrypt"
print_warning "Make sure your domain DNS is pointing to this server first!"
read -p "Do you want to setup SSL now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running certbot..."
    certbot --nginx -d $APP_DOMAIN -d www.$APP_DOMAIN
    
    # Update .env with HTTPS URLs (we already did that)
fi

# ============================================
# Deployment complete!
# ============================================
print_status "======================================"
print_status "Deployment complete!"
print_status "======================================"
print_status "App directory: $APP_DIR"
print_status "Database: $DB_NAME"
print_status "Database user: $DB_USER"
print_status "Systemd service: $SYSTEMD_SERVICE"
echo ""
print_status "Next steps:"
echo "1. Upload your app files to $APP_DIR (if not already done)"
echo "2. Fill in missing credentials in $APP_DIR/.env"
echo "3. Restart the service: systemctl restart $SYSTEMD_SERVICE"
echo "4. Check service status: systemctl status $SYSTEMD_SERVICE"
echo "5. View logs: journalctl -u $SYSTEMD_SERVICE -f"
echo ""
print_warning "SAVE THESE CREDENTIALS SOMEWHERE SAFE!"
echo "Database password: $DB_PASS"
echo "Better Auth secret: $BETTER_AUTH_SECRET"
print_status "======================================"

