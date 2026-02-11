# Quick Start - Vercel + Render Deployment

## Prerequisites
- GitHub repository with this code
- Vercel account (free): https://vercel.com
- Render account (free): https://render.com

---

## 🚀 Step-by-Step Deployment

### 1️⃣ Deploy Backend to Render

1. **Push code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**: https://dashboard.render.com

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo

4. **Configure**:
   - **Name**: `kanban-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

5. **Add Environment Variables**:
   ```
   NODE_ENV = production
   PORT = 10000
   CORS_ORIGIN = https://your-app.vercel.app
   ```
   (You'll update CORS_ORIGIN after deploying frontend)

6. **Deploy** → Wait 2-3 minutes

7. **Copy Backend URL**: `https://kanban-backend-xxxx.onrender.com`

### 2️⃣ Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

4. **Answer prompts**:
   - Setup and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No**
   - Project name? `kanban-frontend`
   - In which directory? `./`
   - Override settings? **No**

5. **Add Environment Variable**:
   ```bash
   vercel env add VITE_API_URL production
   ```
   Paste your Render backend URL: `https://kanban-backend-xxxx.onrender.com`

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

7. **Copy Frontend URL**: `https://kanban-frontend-xxxx.vercel.app`

### 3️⃣ Update Backend CORS

1. Go back to **Render Dashboard**
2. Select your backend service
3. Navigate to **Environment** tab
4. Update `CORS_ORIGIN` to your Vercel URL:
   ```
   https://kanban-frontend-xxxx.vercel.app
   ```
5. **Save** (triggers auto-redeploy)

### 4️⃣ Test Your Deployment

1. Open your Vercel URL in browser
2. Create a task
3. Drag and drop between columns
4. Open in another tab to test real-time sync

---

## ✅ Files Already Configured

- ✅ `backend/render.yaml` - Render configuration
- ✅ `frontend/vercel.json` - Vercel configuration
- ✅ `backend/.env.example` - Environment template
- ✅ `frontend/.env.example` - Environment template
- ✅ Health check at `/health`
- ✅ CORS properly configured
- ✅ Environment variables ready

---

## 🔧 Alternative: Deploy via Dashboard

### Vercel Dashboard Method
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set **Root Directory**: `frontend`
4. Framework: **Vite**
5. Add environment variable: `VITE_API_URL` = `https://your-backend.onrender.com`
6. Deploy

### Render Blueprint Method
1. In Render, click "New +" → "Blueprint"
2. Connect repo with `backend/render.yaml`
3. Render auto-detects configuration
4. Add `CORS_ORIGIN` env var manually
5. Deploy

---

## 🐛 Common Issues

### "Failed to connect to server"
- ✅ Check `VITE_API_URL` in Vercel env vars
- ✅ Verify backend is running on Render
- ✅ Ensure `CORS_ORIGIN` matches Vercel URL exactly

### Backend takes 30s to respond
- ℹ️ Normal for Render free tier (cold start)
- ℹ️ Service sleeps after 15 min inactivity
- 💡 Upgrade to $7/month for always-on

### Tasks don't persist
- ℹ️ Expected - in-memory storage
- 💡 Add MongoDB/PostgreSQL for persistence

---

## 💰 Costs

**Free Tier** (Both Platforms):
- Vercel: Unlimited hobby projects
- Render: 750 hours/month

**Paid** (Optional):
- Render Starter: $7/month (no cold starts)
- Vercel Pro: $20/month (teams, analytics)

---

## 📚 Full Documentation

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Monitoring setup
- Production checklist
- Cost breakdown

---

## 🎉 You're Done!

Your Kanban board is now live and accessible from anywhere!

**Frontend**: https://your-app.vercel.app  
**Backend**: https://your-backend.onrender.com  
**Health**: https://your-backend.onrender.com/health
