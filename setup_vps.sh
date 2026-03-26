#!/bin/bash
# ============================================================
# PersonaAI VPS First-Time Setup Script
# Run this ONCE on your Hostinger VPS as root or your user
# Usage: bash setup_vps.sh
# ============================================================

set -e

VPS_USER=${1:-"root"}
REPO_URL=${2:-"https://github.com/YOUR_GITHUB_USERNAME/persona-ai-mvp.git"}
APP_DIR="/home/$VPS_USER/persona-ai-mvp"

echo "================================================"
echo "  PersonaAI VPS Setup"
echo "  User: $VPS_USER"
echo "  App dir: $APP_DIR"
echo "================================================"

# ── 1. System dependencies ──────────────────────────────────
echo "📦 Installing system packages..."
apt-get update -qq
apt-get install -y git python3 python3-pip python3-venv curl nginx -qq

# ── 2. Node.js 20 ───────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ── 3. PM2 ──────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "📦 Installing PM2..."
  npm install -g pm2
  pm2 startup
fi

# ── 4. Set App Directory ───────────────────────────────────────────
echo "📥 Using current directory as APP_DIR..."
APP_DIR=$(pwd)
echo "APP_DIR set to $APP_DIR"

# ── 5. Backend setup ────────────────────────────────────────
echo "🐍 Setting up Python backend..."
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

# Create .env from template (fill in manually after setup)
if [ ! -f .env ]; then
  cat > .env << 'EOF'
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
EOF
  echo "⚠️  Created backend/.env — fill in your secrets!"
fi

# Start backend with PM2 on port 9090
pm2 delete persona-backend 2>/dev/null || true
pm2 start "venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9090" \
  --name persona-backend --cwd "$APP_DIR/backend"
pm2 save

# ── 6. Frontend setup ───────────────────────────────────────
echo "⚡ Setting up Next.js frontend..."
cd "$APP_DIR/frontend"
npm ci --quiet
NEXT_PUBLIC_API_URL=https://api.redber.in npm run build

# Start frontend with PM2 on port 4000
pm2 delete persona-frontend 2>/dev/null || true
pm2 start "PORT=4000 npm run start" --name persona-frontend --cwd "$APP_DIR/frontend"
pm2 save

# ── 7. Nginx reverse proxy ──────────────────────────────────
echo "🌐 Configuring Nginx..."

# Frontend: redber.in → port 4000
cat > /etc/nginx/sites-available/persona-frontend << 'NGINX'
server {
    listen 80;
    server_name redber.in www.redber.in;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Specifically for the widget embeds:
    location /embed/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        
        # Adding ANY add_header directive in a location block prevents inheritance
        # of add_header directives from global/server config (like X-Frame-Options).
        # We explicitly inject CORS to allow cross-origin iframe embedding.
        add_header Access-Control-Allow-Origin "*";
        add_header Content-Security-Policy "frame-ancestors *;";
        add_header Strict-Transport-Security "max-age=31536000" always;
    }

    location = /widget.js {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Override headers to allow raw file fetching across origins!
        add_header Access-Control-Allow-Origin "*";
    }
}
NGINX

# Backend: api.redber.in → port 9090
cat > /etc/nginx/sites-available/persona-backend << 'NGINX'
server {
    listen 80;
    server_name api.redber.in;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:9090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/persona-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/persona-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 8. SSL (Let's Encrypt) ──────────────────────────────────
echo "🔒 Installing SSL certificates..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx -qq
fi
certbot --nginx \
  -d redber.in -d www.redber.in \
  -d api.redber.in \
  --non-interactive --agree-tos -m customercare@redber.in

echo ""
echo "================================================"
echo "  ✅ Setup complete!"
echo ""
echo "  Frontend: https://redber.in"
echo "  Backend:  https://api.redber.in"
echo ""
echo "  ⚠️  Fill in backend/.env with real secrets"
echo "  Run: pm2 list   (to check service status)"
echo "================================================"
