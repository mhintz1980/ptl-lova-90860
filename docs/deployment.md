# PumpTracker Lite - Deployment Guide

This guide covers deploying PumpTracker Lite to various hosting platforms.

## Prerequisites

- Node.js 18+ installed locally
- pnpm package manager
- Git repository access
- Hosting platform account

## Building for Production

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# The dist/ directory contains production-ready files
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment with automatic builds and deployments.

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Vercel auto-detects Vite configuration
   - Click "Deploy"

3. **Environment Variables** (if using Supabase)
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Redeploy

### Option 2: Netlify

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select your GitHub repository
   - Build command: `pnpm build`
   - Publish directory: `dist`
   - Click "Deploy site"

3. **Environment Variables**
   - Go to Site settings > Build & deploy > Environment
   - Add required variables
   - Trigger redeploy

### Option 3: AWS S3 + CloudFront

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Create S3 bucket**
   - Go to AWS S3 console
   - Create new bucket (e.g., `pumptracker-lite`)
   - Enable static website hosting
   - Upload contents of `dist/` folder

3. **Set up CloudFront**
   - Create CloudFront distribution
   - Point origin to S3 bucket
   - Set default root object to `index.html`
   - Configure error handling for SPA

4. **Deploy**
   ```bash
   aws s3 sync dist/ s3://pumptracker-lite/
   ```

### Option 4: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install
   COPY . .
   RUN pnpm build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   server {
     listen 80;
     location / {
       root /usr/share/nginx/html;
       index index.html index.htm;
       try_files $uri $uri/ /index.html;
     }
   }
   ```

3. **Build and push**
   ```bash
   docker build -t pumptracker-lite .
   docker tag pumptracker-lite your-registry/pumptracker-lite:latest
   docker push your-registry/pumptracker-lite:latest
   ```

### Option 5: Traditional Web Server (Apache/Nginx)

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Copy dist folder to server**
   ```bash
   scp -r dist/ user@server:/var/www/pumptracker-lite/
   ```

3. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name pumptracker.example.com;

     root /var/www/pumptracker-lite;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     # Cache busting for assets
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }

     # Security headers
     add_header X-Frame-Options "SAMEORIGIN" always;
     add_header X-Content-Type-Options "nosniff" always;
     add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

4. **Configure Apache**
   ```apache
   <VirtualHost *:80>
     ServerName pumptracker.example.com
     DocumentRoot /var/www/pumptracker-lite

     <Directory /var/www/pumptracker-lite>
       Options -MultiViews
       RewriteEngine On
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteRule ^ index.html [QSA,L]
     </Directory>

     # Cache busting
     <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
       Header set Cache-Control "max-age=31536000, public"
     </FilesMatch>
   </VirtualHost>
   ```

## Post-Deployment Checklist

- [ ] Test application in production environment
- [ ] Verify all routes work correctly
- [ ] Check console for errors
- [ ] Test filters and search functionality
- [ ] Test Kanban drag-and-drop
- [ ] Verify data persistence in local storage
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Set up monitoring/error tracking
- [ ] Configure backups if using cloud storage
- [ ] Set up SSL/TLS certificate
- [ ] Configure domain DNS records

## Performance Optimization

### Enable Gzip Compression

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

**Apache:**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Enable Browser Caching

Set appropriate cache headers for static assets (already configured in examples above).

### Monitor Performance

- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Set up error tracking (e.g., Sentry)
- Monitor uptime with services like Pingdom

## Troubleshooting

### Blank Page on Load

**Cause**: Incorrect routing configuration  
**Solution**: Ensure all routes fall back to `index.html`

### 404 on Refresh

**Cause**: Server not configured for SPA  
**Solution**: Configure server to serve `index.html` for all routes

### Styles Not Loading

**Cause**: Incorrect asset paths  
**Solution**: Verify `base` in `vite.config.ts` matches deployment path

### Data Not Persisting

**Cause**: Local storage disabled or cleared  
**Solution**: Check browser local storage settings, consider cloud backend

## Rollback Procedure

### Vercel/Netlify
- Go to deployments history
- Click "Redeploy" on previous version

### Manual Deployment
```bash
# Keep previous version backup
mv /var/www/pumptracker-lite /var/www/pumptracker-lite.backup

# Restore previous version
cp -r /var/www/pumptracker-lite.backup /var/www/pumptracker-lite
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CSP Headers**: Implement Content Security Policy
3. **CORS**: Configure CORS if accessing external APIs
4. **Input Validation**: All user inputs are validated client-side
5. **XSS Protection**: React automatically escapes content
6. **Regular Updates**: Keep dependencies updated with `pnpm update`

## Monitoring & Maintenance

### Regular Tasks
- Monitor error logs
- Check performance metrics
- Update dependencies monthly
- Review security advisories
- Backup data regularly

### Recommended Tools
- **Error Tracking**: Sentry, Rollbar
- **Performance**: New Relic, Datadog
- **Monitoring**: Uptime Robot, Pingdom
- **Analytics**: Google Analytics, Plausible

---

For questions or issues, contact the development team.

