# TinyDash

A lightweight, self-hosted server management and monitoring dashboard. Keep your self-hosted infrastructure healthy and under control with a simple, web-based interface.

**Features:**
-  Real-time server monitoring (uptime, temperature, system info)
-  Secure authentication with JWT tokens
-  Web-based dashboard accessible from anywhere
-  Single docker-compose setup
-  SQLite database (zero external dependencies)
-  Optional Cloudflare Tunnel for external access

## Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) Cloudflare Tunnel for external access

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/marex-server-control.git
cd marex-server-control
cp .env.example .env
```

### 2. Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it in `.env` as `JWT_SECRET`.

### 3. Start the Server

```bash
docker-compose up --build -d
```
 The dashboard is now running at **http://localhost**.

Default login: `admin` / `password` 

### 4. (Optional) Add External Access with Cloudflare Tunnel

```bash
# Install Cloudflared CLI (if not already installed)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Create a tunnel
cloudflared tunnel "your-amazing-tunnel-name"

# Copy the credentials
cp ~/.cloudflared/<tunnel-id>.json ./cloudflared/

# Update cloudflared/config.yml with your tunnel ID and hostnames
# Then start with both compose files:
docker-compose -f docker-compose.yml -f docker-compose.cloudflared.yml up -d
```

---

## Project Structure

```
marex-server-control/
├── backend/                   # Express API server
│   ├── src/
│   │   ├── index.js          # API endpoints
│   │   ├── db.js             # SQLite database setup
│   │   └── auth.js           # JWT authentication
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                  # React dashboard
│   ├── src/
│   │   ├── App.jsx           # Main dashboard component
│   │   └── main.jsx          # React entry point
│   ├── Dockerfile
│   └── package.json
│
├── nginx/                     # Reverse proxy config
│   └── nginx.conf
│
├── cloudflared/               # Optional Cloudflare Tunnel (gitignored credentials)
│   └── config.yml
│
├── docker-compose.yml         # Main services
├── docker-compose.cloudflared.yml  # Optional Cloudflare Tunnel addon
├── .env.example               # Environment template
└── README.md
```

---

## Configuration

### Environment Variables

All configuration is done via `.env` file (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `production` or `development` |
| `PORT` | No | Backend port (default: 3000) |
| `JWT_SECRET` | **Yes** | Secret key for signing JWTs (generate randomly) |
| `TELEGRAM_API_KEY` | No | Telegram bot token (optional) |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID (optional) |

### Database

SQLite database is automatically created in `backend/data.db` and persisted via Docker volume.

Default user schema:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

To add initial users, edit `backend/setup-users.js` or use the API after logging in.

---

## API Endpoints

### Authentication

**POST** `/api/login`
```json
{
  "username": "admin",
  "password": "password"
}
```

Returns: `{ "token": "eyJhbGc..." }`

All other endpoints require this token in the `Authorization: Bearer <token>` header.

### Server Info

**GET** `/api/info` (requires auth)
```json
{
  "name": "marex-server",
  "host": "localhost",
  "description": "My self-hosted server",
  "node": "v20.0.0"
}
```

**GET** `/api/status` (requires auth)
```json
{
  "status": "online",
  "uptime": 12345.67,
  "timestamp": "2026-06-14T10:30:00.000Z"
}
```

**GET** `/api/temperature` (requires auth)
```json
{
  "sensors": [
    { "sensor": "coretemp", "label": "Core 0", "celsius": 45 },
    { "sensor": "coretemp", "label": "Core 1", "celsius": 48 }
  ],
  "timestamp": "2026-06-14T10:30:00.000Z"
}
```

### Health Check

**GET** `/health`
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T10:30:00.000Z"
}
```

---

## Development

### Local Development (without Docker)

#### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:3000`

#### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

Vite automatically proxies `/api/*` calls to the backend.

### Building for Production

```bash
docker-compose build
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## Customization

### Adding New Endpoints

Edit `backend/src/index.js`:

```javascript
app.get('/api/my-endpoint', authMiddleware, (req, res) => {
  res.json({ message: 'Hello!' });
});
```

Restart the backend:
```bash
docker-compose up --build -d backend
```

### Changing the Dashboard

Edit `frontend/src/App.jsx` and rebuild:
```bash
docker-compose up --build -d frontend
```

### Using a Custom Domain with HTTPS

Option 1: **Cloudflare Tunnel** (easy I use this one)
- Follow the "Add External Access" section above

Option 2: **Reverse Proxy + Let's Encrypt**
- Update `nginx/nginx.conf` to point to your domain
- Add SSL certificates to the nginx volume
- Restart nginx: `docker-compose restart nginx`

---

## Troubleshooting

### Can't access the dashboard

1. Check if containers are running:
   ```bash
   docker-compose ps
   ```

2. View logs:
   ```bash
   docker-compose logs
   ```

3. Restart everything:
   ```bash
   docker-compose restart
   ```

### Forgotten admin password

1. Stop containers:
   ```bash
   docker-compose down
   ```

2. Delete the database:
   ```bash
   rm backend/data.db
   ```

3. Restart (default user `admin`/`password` will be recreated):
   ```bash
   docker-compose up --build -d
   ```

### Temperature sensors not showing

Temperature reading requires `/sys/class/hwmon` access. This works on Linux but not on Docker Desktop (Mac/Windows).

---

## Security Notes

 **Before deploying publicly:**

1. **Change the default password** — create a new admin user and delete the default one
2. **Generate a strong JWT_SECRET** — use a cryptographically random 32-byte string
3. **Use HTTPS** — either via Cloudflare Tunnel or a reverse proxy with SSL
4. **Secure your .env file** — never commit it; use strong secrets
5. **Keep dependencies updated** — regularly run `npm install --save` for security patches
6. **Firewall rules** — only expose what you need (port 80/443 for Cloudflare, otherwise keep it on LAN)

---

## License

MIT License — see LICENSE file for details

---


