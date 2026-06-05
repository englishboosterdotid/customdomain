# Toeflynk Deployment Guide

This guide will help you deploy Toeflynk to an Ubuntu server.

## Prerequisites

1. An Ubuntu server (22.04 LTS or 24.04 LTS recommended)
2. A domain name pointing to your server's IP address
3. Root or sudo access to the server

## Quick Start (One-Click Deploy)

1. **Upload files to your server**
   - Upload the entire project to `/var/www/toeflynk` (or edit `deploy.sh` to use a different directory)
   - Or clone your git repo first

2. **Edit the deploy script**
   - Open `deploy.sh` and edit the configuration variables at the top:
     ```bash
     APP_DOMAIN="your-domain.com"  # Replace with your actual domain
     APP_DIR="/var/www/toeflynk"
     # ... other configs
     ```

3. **Make the script executable**
   ```bash
   chmod +x deploy.sh
   ```

4. **Run the script**
   ```bash
   sudo ./deploy.sh
   ```

5. **Follow the prompts**
   - The script will ask if you want to set up SSL (make sure your domain DNS is already pointing to your server first!)

## Manual Deployment (Step-by-Step)

If you prefer to deploy manually, follow these steps:

### 1. Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Dependencies
```bash
sudo apt install -y curl git nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### 3. Install Node.js and pnpm
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
sudo npm install -g pnpm@10
```

### 4. Setup PostgreSQL
```bash
# Create database user
sudo -u postgres psql -c "CREATE USER toeflynk WITH PASSWORD 'yourStrongPassword';"

# Create database
sudo -u postgres psql -c "CREATE DATABASE toeflynk OWNER toeflynk;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE toeflynk TO toeflynk;"
```

### 5. Setup App
```bash
# Create app directory
sudo mkdir -p /var/www/toeflynk
sudo chown -R $USER:$USER /var/www/toeflynk

# Upload your app files here
# Or clone from git: git clone https://github.com/englishboosterdotid/customdomain.git /var/www/toeflynk

# Install dependencies
cd /var/www/toeflynk
pnpm install

# Create .env file (copy from .env.example and edit)
cp .env.example .env
nano .env  # Edit with your credentials

# Run migrations
pnpm db:migrate

# Build app
pnpm build
```

### 6. Setup Systemd Service
Create `/etc/systemd/system/toeflynk.service`:
```ini
[Unit]
Description=Toeflynk Next.js App
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/toeflynk
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo chown -R www-data:www-data /var/www/toeflynk
sudo systemctl daemon-reload
sudo systemctl enable toeflynk
sudo systemctl start toeflynk
```

### 7. Configure Nginx
Create `/etc/nginx/sites-available/toeflynk`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

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
```

Enable the site:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/toeflynk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Setup SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Useful Commands

- Check app status: `sudo systemctl status toeflynk`
- View logs: `sudo journalctl -u toeflynk -f`
- Restart app: `sudo systemctl restart toeflynk`
- Update app after code changes:
  ```bash
  cd /var/www/toeflynk
  git pull  # if using git
  pnpm install
  pnpm build
  sudo systemctl restart toeflynk
  ```

## Custom Domain Support

For creator custom domains, you'll need to set up:
1. A wildcard SSL certificate (using Certbot with DNS challenge)
2. Or use Cloudflare for SaaS / SSL for SaaS

## Troubleshooting

### App won't start
- Check logs: `sudo journalctl -u toeflynk -n 50`
- Make sure .env file is correctly configured
- Check if PostgreSQL is running: `sudo systemctl status postgresql`

### Nginx 502 Bad Gateway
- Make sure the Next.js app is running: `sudo systemctl status toeflynk`
- Check if port 3000 is in use: `sudo netstat -tuln | grep 3000`

### Database connection issues
- Verify DATABASE_URL in .env
- Check PostgreSQL status: `sudo systemctl status postgresql`

