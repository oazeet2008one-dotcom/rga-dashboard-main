# Backend Deployment Guide

## Option 1: Railway (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select your repository**: `oazeet2008one-dotcom/rga-dashboard-main`
4. **Configure Service**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Port: 3000

5. **Add Environment Variables** (from backend/.env.example):
   ```env
   DATABASE_URL=your_supabase_database_url
   DIRECT_URL=your_supabase_direct_url
   ENCRYPTION_KEY=your_32_byte_hex_key
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
   ```

6. **Deploy**: Click "Deploy"

## Option 2: Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → "Web Service"
3. **Connect GitHub**: Select `oazeet2008one-dotcom/rga-dashboard-main`
4. **Configure**:
   - Name: `rga-dashboard-backend`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Instance Type: `Free`

5. **Add Environment Variables** (same as Railway)

6. **Create Web Service**

## Option 3: AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI**
2. **Initialize**: `eb init`
3. **Create environment**: `eb create production`
4. **Deploy**: `eb deploy`

## Required Environment Variables

Copy these from your backend/.env file:

### Database (Supabase)
- `DATABASE_URL`
- `DIRECT_URL`

### Security
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### URLs
- `FRONTEND_URL` (your Vercel frontend URL)
- `APP_URL`

### Optional (Google/Facebook APIs)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

## Post-Deployment Steps

1. **Update Frontend**: Edit `frontend/.env`:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app/api/v1
   ```

2. **Redeploy Frontend**: 
   ```bash
   vercel --prod
   ```

3. **Test API**: Visit `https://your-backend-url.railway.app/health`

## Database Setup

If using Supabase:
1. Create new project at https://supabase.com
2. Run migrations from `backend/prisma/migrations`
3. Get connection strings from Project Settings

## Troubleshooting

- **Build fails**: Check Node.js version (requires Node 20+)
- **Database connection**: Verify DATABASE_URL format
- **CORS errors**: Update FRONTEND_URL environment variable
- **API not working**: Check health endpoint and logs
