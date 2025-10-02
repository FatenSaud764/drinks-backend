# WebSocket Remote Testing Setup with Ngrok

## Overview

Okay... This is just a temporary README for those that need explanation on the new MsgPassing system with remote included.
Testing with remote TBC. This just explains how to set up **remote WebSocket notifications** for testing our bar ordering system across different networks.
Since our Django backend runs locally on someone's laptop during testing, we use **Ngrok** to expose it to the internet temporarily (to make the msgpassing visible to others - aka notifications being received accross the internet).

---

## What Problem Does ngrok This Solve?

- **Problem:** WebSocket notifications work locally but not when testing from different networks/laptops (Faten and I tested it with the remote earlier - remote is still buggy, but notifications worked for both of us locally)
- **Why:** The backend runs on `localhost`, which is only accessible on the specific computer running it
- **Solution:** Ngrok creates a secure tunnel from the internet to your local backend (supabase already took care of the normal work of things, but ngrok makes websocket connections possible over multiple networks)

---

## Architecture

```
Client Laptop (anywhere) 
    ↓
VITE_WS_URL=wss://uncherishing-easygoing-else.ngrok-free.dev/ws/notifications/ (Kirsty's link - will differ depending on device) 
    ↓
Ngrok Tunnel 
    ↓
Django Backend (on laptop of person running the server - ONE PERSON SHOULD RUN BACKEND)
    ↓
Supabase (Faten's set-up database)
```

**Important:** Ngrok only tunnels WebSockets. Supabase remains unchanged and accessible from anywhere!

---

## Prerequisites

- Django backend with Daphne running on port 8000
- Two React apps (Staff and Client) using Vite
- Ngrok account (will be explained now)
---

## Setup Instructions

### Step 1: Install Ngrok
Install Ngrok: https://ngrok.com/download (follow the given commands except the "start endpoint")

### Step 2: Start Your Django Backend

```bash
python -m daphne -b 0.0.0.0 -p 8000 barbackend.asgi:application
```

**Keep this terminal window open!**

### Step 4: Start Ngrok Tunnel

Open a **new terminal window** and run (IMPORTANT THAT IT IS 8000):

```bash
ngrok http 8000
```

You'll see output like this:
```
Session Status                online
Forwarding                    https://abc123-xyz.ngrok-free.dev -> http://localhost:8000
```

**Copy the `https://` URL** - you'll need it for the next step!

**Keep this terminal window open too!**

### Step 5: Configure React Apps

In **both** React apps (Staff and Client), a `.env` file in the project root should be present (setup for admin already):

```
myproject/
├── src/
├── public/
├── package.json
├── vite.config.js
├── .env              ← CREATE THIS FILE HERE !!!
└── ...
```

Add this to `.env` (replace with your actual ngrok URL)... Example:

```env
VITE_WS_URL=wss://abc123-xyz.ngrok-free.dev/ws/notifications/
```

**Important:** 
- Use `wss://` (secure WebSocket), not `ws://`
- Include the full path `/ws/notifications/`
- Update this URL each time you restart ngrok !!!

### Step 6: Restart React Dev Servers

Vite only reads `.env` on startup, so you **must restart**:

```bash
# Stop your dev server (Ctrl+C), then:
npm run dev
```

Do this for both Staff and Client apps!

---

## Testing

### 1. Verify Connection

Open browser console (Ctrl-Shift-i) in both apps.

```
WebSocket connected
Connected to notification service
Authenticated as: Staff/Client in group: staff_notifications
```

**Note:** You may see some initial connection errors - this is normal in React development mode. As long as you see "WebSocket connected" at the end, it's working.

### 2. Test Notifications

1. **Client app:** Create a new order
2. **Staff app:** Should receive a toast notification to say that a new order is created
3. **Check console:** Should show `Received notification: ...`

---

## Troubleshooting (just for incase something goes wrong lol)

### "WebSocket connection failed"

**Check:**
- Is Django backend running? (`python -m daphne...`)
- Is ngrok running? (`ngrok http 8000`)
- Did you restart the React dev servers after creating `.env`?
- Is the URL in `.env` correct (no typos, includes `wss://`)?

### "CORS" or "403" errors (This should not happen... but just for incase)

Update your Django `settings.py`:

```python
ALLOWED_HOSTS = ['*']  # Or add your specific ngrok domain

# If using django-cors-headers:
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite default
    'http://localhost:3000',
    'https://your-url.ngrok-free.dev',  # Add your ngrok URL
]
```

### React Strict Mode errors

The console may show connection/disconnection errors. This is React Strict Mode intentionally testing component cleanup. It's normal - ignore these as long as you see "WebSocket connected" afterward.

---

## Important Notes

### Every Testing Session:

1. **Backend person** starts Django + Ngrok
2. **Backend person** shares the new ngrok URL with testers
3. **All testers** update their `.env` files with the new URL
4. **All testers** restart their React dev servers (important!)

### Free Tier Limitations (for our project, this is okay, trust lol !):

- New URL each time you restart ngrok
- Connection may timeout after a few hours
- Limited to 40 connections/minute

---

## Security Notes

- Never commit `.env` files to git (add to `.gitignore`) -  it changes eveytime on the remote anyways
- Ngrok URLs are temporary and change on restart
- Only use this setup for testing/development
- For production, deploy backend to a proper hosting service - probably not needed for our project

---

## What Stays the Same?

**No changes needed to:**
- Django backend code
- WebSocket consumers/routing
- Supabase database or queries
- HTTP API endpoints (unless you want to route them through ngrok too) - currently handled by Supabase

**Only changes:**
- Frontend WebSocket connection URL (via `.env`)