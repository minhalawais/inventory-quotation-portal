# Hostinger VPS CI/CD Runbook

This app is a Next.js 14 full-stack app. The frontend pages and backend API routes deploy together as one Node service behind Nginx.

## What Was Added

- `.github/workflows/deploy-production.yml` validates every push to `main`, then deploys to the VPS.
- `deploy/deploy-production.sh` pulls the exact GitHub commit, installs dependencies, builds, runs database migrations, restarts PM2, and checks the app.
- `ecosystem.config.cjs` runs the production app with PM2 on `127.0.0.1:3000`.
- `deploy/env.production.example` documents required production environment variables.
- `npm run db:migrate` runs safe MongoDB index migrations via `scripts/ensure-indexes.js`.

## One-Time VPS Setup

SSH into the server:

```bash
ssh root@187.53.139.52
```

Create a deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
```

Install runtime packages:

```bash
apt update
apt install -y nginx git curl ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Configure firewall:

```bash
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw enable
```

Clone the repo:

```bash
mkdir -p /var/www
chown deploy:deploy /var/www
sudo -u deploy git clone https://github.com/minhalawais/inventory-quotation-portal.git /var/www/inventory-quotation-portal
cd /var/www/inventory-quotation-portal
```

Create production env:

```bash
nano .env.local
```

Use real values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_portal
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-long-random-secret
```

Install, build, migrate, and start once:

```bash
npm ci
npm run build
npm run db:migrate
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/inventory-quotation-portal`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
ln -s /etc/nginx/sites-available/inventory-quotation-portal /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

After DNS points to `187.53.139.52`, install HTTPS:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## GitHub Secrets

In GitHub, open `Settings -> Secrets and variables -> Actions` and add:

- `VPS_HOST`: `187.53.139.52`
- `VPS_USER`: `deploy`
- `VPS_SSH_PORT`: `22`
- `VPS_SSH_KEY`: private key for a deploy SSH key whose public key is in `/home/deploy/.ssh/authorized_keys`

Create the SSH key on your local computer:

```bash
ssh-keygen -t ed25519 -C "github-actions-inventory-portal"
```

Add the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@187.53.139.52
```

Paste the private key into `VPS_SSH_KEY`.

## How Deployments Work

1. Push to `main`.
2. GitHub Actions installs dependencies.
3. It typechecks, builds, starts the app, and runs smoke tests.
4. If validation passes, GitHub SSHs to the VPS.
5. The VPS checks out the exact commit, runs `npm ci`, `npm run build`, `npm run db:migrate`, and restarts PM2.

## Production Notes

- Do not run `npm run setup-database` on production repeatedly. It creates sample users and is not a migration.
- Use `npm run db:migrate` for deploy-time database changes.
- Product uploads currently live under `public/uploads/products`. On a single VPS this works, but future multi-server deployments should move uploads to object storage or a persistent shared volume.
