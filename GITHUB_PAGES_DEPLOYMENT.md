# GitHub Pages Deployment Guide

This guide explains how to deploy the Meeting Audio Studio frontend to GitHub Pages.

## No Backend Yet? No Problem!

If you haven't deployed your backend yet, the GitHub Pages deployment is configured to work in **Demo Mode**:

### What Demo Mode Does:
- ✅ **Uses Mock Data**: Shows sample audio files and transcripts
- ✅ **Simulates API Calls**: No network requests to non-existent backends
- ✅ **Shows Demo Notice**: Clear indication this is a demo version
- ✅ **Full UI Experience**: All frontend features work with sample data

### Current Configuration:
The workflow is set up for demo mode by default:
```yaml
VITE_DEMO_MODE=true
VITE_SHOW_DEMO_NOTICE=true
```

### When You Deploy Your Backend:
1. Update the GitHub Actions workflow with your real API URLs
2. Set `VITE_DEMO_MODE=false` in the environment configuration
3. The application will automatically switch to using your real backend

## Automatic Deployment (Recommended)

### Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as the source

2. **Configure Secrets and Variables**:

   **Step 1: Create GitHub Pages Environment**
   - Go to repository Settings → Environments
   - Click "New environment" and name it `github-pages`
   - (Optional) Add protection rules like requiring approval for deployments

   **Step 2: Add Environment Secrets** (for sensitive data)
   - In the `github-pages` environment, click "Add Secret"
   - Add these secrets:
     ```
     VITE_API_URL=https://your-backend-api.com/api
     VITE_PUSHER_APP_KEY=your-secret-websocket-key
     VITE_REVERB_HOST=your-api-domain.com
     ```

   **Step 3: Add Environment Variables** (for non-sensitive config)
   - In the `github-pages` environment, click "Add Variable"
   - Add these variables:
     ```
     VITE_API_VERSION=v1
     VITE_REVERB_PORT=443
     VITE_REVERB_SCHEME=https
     VITE_DEMO_MODE=true
     ```

### Secret Types Explained

| Type | Location | Security | Use For | Visibility |
|------|----------|----------|---------|------------|
| **Environment Secrets** | Settings → Environments → github-pages → Secrets | 🔒 High | API keys, passwords | Hidden in logs |
| **Environment Variables** | Settings → Environments → github-pages → Variables | ⚠️ Medium | Non-sensitive config | Visible in logs |
| **Repository Secrets** | Settings → Secrets and variables → Actions → Secrets | 🔒 High | API keys (simpler setup) | Hidden in logs |
| **Repository Variables** | Settings → Secrets and variables → Actions → Variables | ⚠️ Low | Public configuration | Visible in logs |

**Recommendation**: Use **Environment Secrets** for sensitive data and **Environment Variables** for non-sensitive configuration.

   **Alternative: Repository-level Secrets** (simpler setup)
   - Go to repository Settings → Secrets and variables → Actions
   - Add secrets/variables at repository level instead of environment level

3. **Deploy**:
   Push to the `master` or `main` branch, or trigger manually via Actions tab.

### Workflow Features

- ✅ Automatic builds on push to main/master
- ✅ Manual deployment trigger via GitHub Actions
- ✅ Full CI pipeline (linting, type-checking, testing)
- ✅ Optimized production build
- ✅ Proper base path configuration for GitHub Pages

## Manual Deployment

## Environment Configuration

### Environment Files

- `.env.example`: Template for local development
- `.env.production.example`: Template for production deployment
- `.env.production`: Your actual production config (not committed to Git)

### Local Setup for Production Testing

1. **Copy the template**:
   ```bash
   cd frontend
   cp .env.production.example .env.production
   ```

2. **Update with your values**:
   ```bash
   # Edit .env.production with your actual API endpoints
   nano .env.production
   ```

3. **Test production build**:
   ```bash
   npm run build:gh-pages
   npm run preview
   ```

### Security Note

The `.env.production` file is excluded from Git for security. The GitHub Actions workflow creates this file dynamically using repository secrets or default values.
   ```bash
   cd frontend
   npm install
   ```

2. **Add gh-pages dependency** (if not already added):
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Configure environment**:
   Create or update `frontend/.env.production`:
   ```bash
   VITE_API_URL=https://your-backend-api.com/api
   VITE_BASE_URL=/meeting-audio-studio/
   GITHUB_PAGES=true
   VITE_DEMO_MODE=true
   ```

### Deploy Commands

```bash
# Build and deploy in one command
npm run deploy:gh-pages

# Or step by step
npm run build:gh-pages
npx gh-pages -d build
```

## Configuration Options

### Environment Variables

- `VITE_API_URL`: Backend API base URL
- `VITE_BASE_URL`: GitHub Pages repository path
- `VITE_DEMO_MODE`: Enable demo mode with mock data
- `GITHUB_PAGES`: Enable GitHub Pages optimizations

### Vite Configuration

The `vite.config.ts` automatically configures:
- Base path for GitHub Pages (`/meeting-audio-studio/`)
- Asset path optimization
- Production build settings

## Demo Mode

When `VITE_DEMO_MODE=true`, the application should:
- Use mock data instead of API calls
- Display demo notices
- Provide sample functionality

**Note**: You may need to implement demo mode logic in your components.

## Troubleshooting

### Common Issues

1. **404 on page refresh**:
   - GitHub Pages doesn't support client-side routing by default
   - Add a `404.html` that redirects to `index.html`

2. **Assets not loading**:
   - Ensure `base` path is correctly set in `vite.config.ts`
   - Check that `VITE_BASE_URL` matches your repository name

3. **API calls failing**:
   - Update API URLs in environment variables
   - Enable demo mode for static-only deployment
   - Configure CORS on your backend

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check build locally
npm run build:gh-pages
npm run preview
```

## Backend Integration

### Option 1: Separate Backend Deployment
Deploy your Laravel backend to a cloud service (Heroku, DigitalOcean, etc.) and update the API URLs.

### Option 2: Demo Mode
Enable demo mode to showcase the frontend without a backend dependency.

### Option 3: Mock Service Worker
Implement MSW (Mock Service Worker) for realistic API mocking in production.

## Custom Domain (Optional)

1. Add a `CNAME` file to the `frontend/public/` directory:
   ```
   yourdomain.com
   ```

2. Configure your domain's DNS to point to GitHub Pages:
   ```
   CNAME record: your-username.github.io
   ```

3. Enable HTTPS in repository settings.

## Monitoring

- Check GitHub Actions tab for deployment status
- Monitor build logs for errors
- Test the deployed site at: `https://sekiroKenjii.github.io/meeting-audio-studio/`

## Security Considerations

- Never commit sensitive API keys to the repository
- Use GitHub repository secrets for sensitive environment variables
- Enable branch protection rules for production deployments

## Next Steps

1. Set up backend deployment (if needed)
2. Configure proper API endpoints
3. Implement demo mode features
4. Add monitoring and analytics
5. Set up custom domain (optional)
