# BeyondBound Deployment Guide (WinSCP + Custom Server)

Follow these steps to deploy your application to `beyondbound.xyz`.

## 1. Server Preparation
Ensure your server has Node.js (v22.6.0+) and Nginx installed.

## 2. Uploading via WinSCP
1. Open **WinSCP** and connect to your server.
2. Navigate to the directory where you want to host the app (e.g., `/var/www/beyondbound`).
3. Upload all files from your local project folder **EXCEPT** the `node_modules` folder.

## 3. Installation and Build
Open your server's terminal (SSH) and run the following commands:

```bash
# Navigate to your project folder
cd /var/www/beyondbound

# Install all dependencies
npm install

# Build the production frontend
npm run build
```

## 4. Running the Application
To run the app in production mode:

```bash
# Set environment to production and start
export NODE_ENV=production
npm start
```

### Recommended: Use PM2 for Background Execution
To keep the app running even after you close the terminal:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app with PM2
pm2 start "NODE_ENV=production npm start" --name beyondbound
```

## 5. Nginx Reverse Proxy
Configure Nginx to route traffic from `beyondbound.xyz` to your app on port 3000.

Create a file at `/etc/nginx/sites-available/beyondbound`:

```nginx
server {
    listen 80;
    server_name beyondbound.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/beyondbound /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL (HTTPS)
Use Certbot to secure your site:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d beyondbound.xyz
```
