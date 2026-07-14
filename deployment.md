# BeyondBound Deployment Guide

To wire up your domains (`simcolt3.xyz` and `beyondbound.xyz`) and offload tasks to your server cluster, follow these steps:

## 1. DNS Configuration
Point your domains to your server IP addresses via your DNS provider (e.g., Namecheap, Cloudflare, or Google Domains).

| Domain | Record Type | Value (IP) | Server Name |
|--------|-------------|------------|-------------|
| `beyondbound.xyz` | A | `103.6.171.150` | beyondboundserver2-2 |
| `simcolt3.xyz` | A | `79.108.224.27` | simcolt3server1 |
| `api.beyondbound.xyz` | A | `45.151.154.196` | beyondboundserver1-1 |

## 2. Server Setup (Node.js)
On each server, you need to install Node.js and run the backend code.

```bash
# Install dependencies
npm install express vite @vitejs/plugin-react

# Copy server.ts and package.json to the server
# Run the server
npm run dev
```

## 3. Nginx Reverse Proxy
To handle traffic on port 80/443 and route it to the Node.js app (port 3000), use Nginx:

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

## 4. Offloading Strategy
The application is already configured to use `/api/blockchain/offload`. 
In a production environment, you would replace the simulated logic in `server.ts` with actual distributed task processing (e.g., using Redis or RabbitMQ).

## 5. Optimal Signal Parameters
Based on your server locations (Australia/Sydney cluster):
- **Wavelength**: 1550 nm (C-band) is optimal for long-haul sync between these nodes.
- **Modulation**: 
  - Use **FM (Frequency Modulation)** for high-noise environments (throttled connections).
  - Use **QAM (Quadrature Amplitude Modulation)** for high-throughput when nodes are stable.
  - Use **AM (Amplitude Modulation)** for low-power, simple 1-bit sync.
