# Railway Environment Variables Setup

## Required Environment Variables

Add these in Railway Dashboard → Settings → Variables:

### Database (Required)
```
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url
```

### Security (Required)
```
ENCRYPTION_KEY=your_32_byte_hex_key
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### URLs (Required)
```
FRONTEND_URL=https://rga-dashboard-frontend-b0wyc9g7q-oazeet2008one-dotcoms-projects.vercel.app
CORS_ORIGINS=https://rga-dashboard-frontend-b0wyc9g7q-oazeet2008one-dotcoms-projects.vercel.app,https://rga-dashboard-frontend.vercel.app
```

### Optional
```
NODE_ENV=production
PORT=3000
```

## Generate Keys

Generate encryption and JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Test URLs

Frontend: https://rga-dashboard-frontend-b0wyc9g7q-oazeet2008one-dotcoms-projects.vercel.app
Backend: https://your-railway-backend-url.up.railway.app
