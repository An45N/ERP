# ERP System Deployment Guide

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Git
- SSL certificates (for HTTPS)

### Required Accounts
- Cloud hosting provider (AWS/Azure/DigitalOcean)
- Sentry account (error tracking)
- Google Analytics or Plausible (analytics)
- UptimeRobot or similar (uptime monitoring)

## Environment Configuration

### 1. Create Production Environment File

Copy `.env.example` to `.env.production` and configure:

```bash
# API Configuration
VITE_API_URL=https://api.yourerp.com
VITE_API_TIMEOUT=30000

# Sentry
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=yourerp.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## Build Process

### Local Build
```bash
# Install dependencies
npm ci

# Run production build
npm run build

# Preview production build
npm run preview
```

### Docker Build
```bash
# Build Docker image
docker build -t erp-frontend:latest .

# Run container
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Deployment Options

### Option 1: Traditional Server Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Upload to server**
   ```bash
   scp -r dist/* user@yourserver:/var/www/erp/
   ```

3. **Configure Nginx** (see nginx.conf)

4. **Restart Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

### Option 2: Docker Deployment

1. **Build and push image**
   ```bash
   docker build -t your-registry/erp-frontend:latest .
   docker push your-registry/erp-frontend:latest
   ```

2. **Deploy on server**
   ```bash
   docker pull your-registry/erp-frontend:latest
   docker-compose up -d
   ```

### Option 3: CI/CD with GitHub Actions

1. **Configure secrets** in GitHub repository:
   - `VITE_API_URL`
   - `VITE_SENTRY_DSN`
   - `VITE_GA_MEASUREMENT_ID`
   - `SSH_PRIVATE_KEY`
   - `REMOTE_HOST`
   - `REMOTE_USER`

2. **Push to main branch** - automatic deployment triggers

3. **Monitor deployment** in GitHub Actions tab

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] API endpoints use HTTPS
- [ ] Sensitive data not exposed in source maps
- [ ] Rate limiting configured on API

### Performance
- [ ] Gzip/Brotli compression enabled
- [ ] Static assets cached properly
- [ ] CDN configured (optional)
- [ ] Bundle size optimized (< 500KB initial)
- [ ] Lazy loading implemented

### Monitoring
- [ ] Sentry error tracking active
- [ ] Analytics tracking verified
- [ ] Web Vitals monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up

### Functionality
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] API calls successful
- [ ] Reports generate properly
- [ ] File uploads work
- [ ] Email sending functional

## Monitoring Setup

### Sentry Configuration
1. Create project in Sentry
2. Copy DSN to environment variables
3. Verify errors are being tracked
4. Set up alert rules

### Analytics Setup
1. Create GA4 property or Plausible site
2. Add tracking ID to environment
3. Verify page views are tracked
4. Set up conversion goals

### Uptime Monitoring
1. Create monitor in UptimeRobot
2. Set check interval (5 minutes)
3. Configure alert contacts
4. Test notifications

## Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci
npm run build
```

### Docker Issues
```bash
# Check container logs
docker-compose logs frontend

# Restart container
docker-compose restart frontend

# Rebuild image
docker-compose build --no-cache frontend
```

### Performance Issues
- Check bundle size: `npm run build -- --report`
- Analyze with Lighthouse
- Review Web Vitals metrics
- Check network waterfall

## Rollback Procedure

### Quick Rollback
```bash
# Revert to previous Git commit
git revert HEAD
git push origin main

# Or restore previous build
cp -r /backups/dist-YYYYMMDD/* /var/www/erp/
```

### Docker Rollback
```bash
# Use previous image tag
docker pull your-registry/erp-frontend:previous-tag
docker-compose up -d
```

## Maintenance

### Regular Tasks
- **Weekly:** Review error logs in Sentry
- **Monthly:** Check analytics and performance metrics
- **Quarterly:** Update dependencies and security patches
- **Annually:** Review and update SSL certificates

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Support Contacts

- **DevOps:** devops@yourerp.com
- **Emergency:** +230-XXXX-XXXX
- **Documentation:** https://docs.yourerp.com

---

**Last Updated:** January 26, 2026
