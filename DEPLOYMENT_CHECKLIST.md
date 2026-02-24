# RGA Dashboard Deployment Checklist

## ✅ Railway Backend Setup
- [ ] Add all environment variables to Railway
- [ ] Wait for Railway to redeploy successfully  
- [ ] Copy Railway backend URL
- [ ] Test: https://YOUR_RAILWAY_URL.up.railway.app/health

## ✅ Vercel Frontend Setup  
- [ ] Add VITE_API_URL to Vercel environment variables
- [ ] Redeploy Vercel frontend
- [ ] Test: https://rga-dashboard-frontend-a0np714dt-oazeet2008one-dotcoms-projects.vercel.app

## ✅ Final Testing
- [ ] Login with: admin@rga.com / password123
- [ ] Check dashboard loads correctly
- [ ] Verify API calls work (no CORS errors)

## 🚨 Troubleshooting
- **CORS Error**: Check VITE_API_URL in Vercel
- **Backend Error**: Check Railway environment variables
- **Login Failed**: Verify DATABASE_URL and JWT secrets

## 🎯 Expected URLs
- Frontend: https://rga-dashboard-frontend-a0np714dt-oazeet2008one-dotcoms-projects.vercel.app
- Backend: https://YOUR_RAILWAY_URL.up.railway.app
- API: https://YOUR_RAILWAY_URL.up.railway.app/api/v1
