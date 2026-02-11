# Deploying to Vercel (Frontend) + Render (Backend)

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier available)
- Render account (free tier available)

---

## 🚀 Backend Deployment (Render)

### Step 1: Prepare Backend

Your backend is already configured with:
- ✅ `render.yaml` - Deployment configuration
- ✅ Health check endpoint at `/health`
- ✅ Environment variables support

### Step 2: Deploy to Render

#### Option A: Using Render Dashboard (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect GitHub Repository**
   - Authorize Render to access your GitHub
   - Select your repository

4. **Configure Service**
   - **Name**: `kanban-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid for better performance)

5. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render auto-assigns, but this is default) |
   | `CORS_ORIGIN` | `https://your-vercel-domain.vercel.app` |

   **Important**: You'll update `CORS_ORIGIN` after deploying frontend!

6. **Enable Health Check**
   - Health Check Path: `/health`
   - This is automatically configured in `render.yaml`

7. **Click "Create Web Service"**

8. **Wait for deployment** (2-5 minutes)
   - Render will install dependencies and start your server
   - Watch the logs for any errors

9. **Copy your backend URL**
   - It will be something like: `https://kanban-backend-xxxx.onrender.com`
   - **Save this URL** - you'll need it for frontend deployment!

#### Option B: Using render.yaml (Infrastructure as Code)

1. Push `backend/render.yaml` to your repository

2. In Render Dashboard:
   - Click "New +" → "Blueprint"
   - Connect repository
   - Select the repository with `render.yaml`
   - Render will auto-detect the configuration

3. Set environment variable `CORS_ORIGIN` manually after frontend is deployed

### Step 3: Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2024-02-11T..."
}
```

### Step 4: Important Render Notes

⚠️ **Free Tier Limitations**:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month of uptime

💡 **Upgrade to Paid Plan** ($7/month) for:
- Always-on service (no cold starts)
- Better performance
- More resources

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

Your frontend is already configured with:
- ✅ `vercel.json` - Deployment configuration
- ✅ Environment variable support
- ✅ SPA routing configured

### Step 2: Deploy to Vercel

#### Using Vercel CLI (Recommended for First Deploy)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy from Frontend Directory**
```bash
cd frontend
vercel
```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `kanban-frontend` (or your choice)
   - In which directory is your code? `./` (current directory)
   - Want to override settings? **N**

5. **Set Environment Variables**
```bash
vercel env add VITE_API_URL production
```
When prompted, paste your Render backend URL:
```
https://your-backend-url.onrender.com
```

6. **Deploy to Production**
```bash
vercel --prod
```

#### Using Vercel Dashboard

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New..." → "Project"**

3. **Import Git Repository**
   - Connect your GitHub account
   - Select your repository
   - Click "Import"

4. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**
   Click "Environment Variables":
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_API_URL` | `https://your-backend-url.onrender.com` | Production |

6. **Click "Deploy"**

7. **Wait for deployment** (1-3 minutes)

8. **Copy your frontend URL**
   - It will be something like: `https://kanban-frontend-xxxx.vercel.app`

### Step 3: Update Backend CORS

Now that you have your Vercel URL, update the backend:

1. **Go back to Render Dashboard**
2. **Select your backend service**
3. **Click "Environment"**
4. **Update `CORS_ORIGIN`**:
   ```
   https://your-frontend-url.vercel.app
   ```
5. **Save** (this will trigger a redeploy)

### Step 4: Verify Frontend Deployment

1. Open your Vercel URL in a browser
2. You should see the Kanban board loading
3. Try creating a task to test backend connection

---

## 🔄 Automatic Deployments

Once connected, both platforms will auto-deploy on git push:

### Vercel (Frontend)
- **Push to `main`** → Auto-deploys to production
- **Push to other branches** → Creates preview deployments
- View all deployments in Vercel Dashboard

### Render (Backend)
- **Push to `main`** → Auto-deploys to production
- Monitor deployments in Render Dashboard
- View logs for debugging

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms**: "Failed to connect to server" error

**Solutions**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Ensure it's the correct Render backend URL
3. Verify backend is running (check Render dashboard)
4. Check CORS_ORIGIN in backend matches Vercel URL
5. Redeploy frontend after changing env vars

### Backend Not Starting on Render

**Symptoms**: Service fails to start

**Solutions**:
1. Check Render logs for errors
2. Verify `package.json` has all dependencies
3. Ensure `node server.js` works locally
4. Check PORT is not hardcoded (use `process.env.PORT`)

### WebSocket Connection Failing

**Symptoms**: Real-time updates not working

**Solutions**:
1. Render free tier may have WebSocket limitations
2. Ensure backend URL uses `https://` (not `http://`)
3. Check browser console for WebSocket errors
4. Verify Socket.IO CORS settings include Vercel URL

### Cold Start Issues (Render Free Tier)

**Symptoms**: First request takes 30+ seconds

**Solutions**:
1. This is expected on Render free tier
2. Upgrade to paid plan for always-on service
3. Implement loading state in frontend
4. Consider using Render's ping service to keep alive

---

## 📊 Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard → Project → Analytics
- Free tier includes basic metrics

### Render Monitoring
- View logs: Render Dashboard → Service → Logs
- Check metrics: CPU, Memory, Request count
- Set up alerts for downtime

---

## 🔐 Production Checklist

### Backend (Render)
- [ ] Environment variables set correctly
- [ ] `CORS_ORIGIN` matches Vercel frontend URL
- [ ] Health check responding at `/health`
- [ ] Logs show no errors
- [ ] Test all WebSocket events work

### Frontend (Vercel)
- [ ] `VITE_API_URL` points to Render backend
- [ ] All pages load correctly
- [ ] Drag-and-drop works
- [ ] Task CRUD operations work
- [ ] Real-time sync between multiple tabs works
- [ ] Check mobile responsiveness

---

## 💰 Cost Breakdown

### Vercel (Frontend)
- **Free Tier**: 
  - 100 GB bandwidth/month
  - Unlimited personal projects
  - Automatic HTTPS
  - Preview deployments
  
- **Pro Tier** ($20/month):
  - Enhanced analytics
  - Team collaboration
  - Password protection

### Render (Backend)
- **Free Tier**:
  - 750 hours/month
  - Spins down after inactivity
  - 512 MB RAM
  - Shared CPU
  
- **Starter Plan** ($7/month):
  - Always on (no spin-down)
  - Better performance
  - 512 MB RAM
  - Shared CPU

**Total for Production**: $7-27/month (or $0 for free tier with limitations)

---

## 📝 Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🚀 Quick Deploy Commands

```bash
# Frontend (Vercel CLI)
cd frontend
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

For backend, use Render Dashboard (no CLI needed for basic deployments).

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Socket.IO on Render](https://render.com/docs/deploy-node-express-app)

---

Need help? Check the main [DOCUMENTATION.md](./DOCUMENTATION.md) or [DEPLOYMENT.md](./DEPLOYMENT.md) for more details.
