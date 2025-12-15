# Project: PumpTracker Lite

## Project Overview

This project is a modern, responsive production management system for tracking pump manufacturing orders. It's a lightweight yet powerful web application designed to help manufacturing teams manage pump production orders efficiently. It provides real-time visibility into production status, KPI tracking, and intuitive drag-and-drop Kanban board management.

The application is built with React and TypeScript, using Vite as a build tool. Styling is done with Tailwind CSS, and state management is handled by Zustand. Data visualization is implemented with Recharts.

The project is structured with a clear separation of concerns, with components organized by feature (dashboard, kanban, toolbar, ui), and a `lib` directory for utilities and a `store.ts` for state management.

## Architecture

### Client Surfaces

-   **Dashboard** (`src/components/dashboard`) surfaces KPIs, value charts, and the master order table. Data comes directly from the filtered pump array.
-   **Kanban** (`src/components/kanban`) renders fixed-width stage columns. Each column receives the globally sorted pump list, and `StageColumn` applies the default ordering (priority → promise date → last update) before rendering `PumpCard`.
-   **Scheduling** (`src/components/scheduling`) stitches together three layers:
    -   `BacklogDock` reuses `PumpCard` for the unscheduled pump queue.
    -   `MainCalendarGrid` builds stage timelines from `buildStageTimeline` and trims them according to the legend filters.
    -   `DragAndDropContext` coordinates dnd-kit operations for dropping backlog pumps on the calendar grid.

### State and Data Flow

-   **Zustand Store** (`src/store.ts`)
    -   Persists pump data, filter selections, WIP limits, and UI toggles.
    -   `sortField`/`sortDirection` control the canonical ordering for both Kanban and Scheduling.
    -   `schedulingStageFilters` tracks the quick-filter state from the legend buttons; only the scheduling view reads this array.
    -   `levelNotStartedSchedules` and `clearNotStartedSchedules` return counts so the UI can show toasts.
-   **Seed Data** (`src/lib/seed.ts`)
    -   Generates deterministic pumps from `src/data/pumptracker-data.json` for the local adapter.
    -   `getModelLeadTimes` supplies fabrication/powder/assembly/testing durations to both the store and calendar timelines.
-   **Sorting Helpers** (`src/lib/sort.ts`)
    -   Exposes `sortPumps`, `SortField`, and `SortDirection` so different features reuse the same ordering rules.

### Styling & Theming

-   `src/index.css` defines shared design tokens, neon shadows, stage color variables, header animations, scrollbars, and the new weekend theme variables.
-   Reusable UI primitives live in `src/components/ui` (Button, Badge, Card, etc.).

### File Organization Cheatsheet

```
src/
├── adapters/         # Local + Supabase persistence
├── components/
│   ├── dashboard/
│   ├── kanban/
│   ├── scheduling/
│   ├── toolbar/
│   └── ui/
├── data/             # Catalog data used by seed.ts
├── lib/              # Utilities: formatters, CSV, seed, schedule helpers
├── store.ts          # Zustand store
└── types.ts          # Application types (Pump, Stage, Filters, etc.)
```

Use this map when adding a feature: extend the component surface, update the store (with selectors + actions), and wire any new styling tokens through `index.css`.

### DDD Domain Layer (New)

A clean domain layer was added following Domain-Driven Design principles:

```
src/
├── domain/                    # Pure business logic (NO external imports)
│   ├── shared/Entity.ts       # Base entity class
│   ├── production/
│   │   ├── entities/Pump.ts   # Pump aggregate root
│   │   ├── value-objects/     # Stage, Priority
│   │   ├── events/            # PumpCreated, PumpStageMoved, etc.
│   │   └── repository.ts      # IPumpRepository interface
│   └── sales/
│       ├── entities/          # PurchaseOrder, LineItem
│       └── repository.ts      # IOrderRepository interface
├── application/               # Use case orchestration
│   ├── commands/              # Command definitions
│   └── handlers/              # Command handlers
├── infrastructure/            # External concerns
│   ├── eventBus/              # Domain event pub/sub
│   └── persistence/           # Repository implementations
│       ├── adapters/          # DataAdapter interface + impls
│       └── repositories/      # PumpRepository, OrderRepository
└── presentation/
    └── hooks/usePumpCommands.ts  # React hook for domain operations
```

**Key Invariants Enforced**:
- Stage transitions must be sequential (QUEUE → FABRICATION → POWDER_COAT → ...)
- CLOSED is a terminal stage (no transitions allowed)
- Serial numbers are immutable after creation

**Feature Flag**: Set `USE_NEW_DOMAIN=true` in `usePumpCommands.ts` to activate.

## Building and Running

### Prerequisites

*   Node.js 18+
*   pnpm (or npm/yarn)

### Development

To run the development server:

```bash
pnpm dev
```

### Build

To build the project for production:

```bash
pnpm build
```

The production-ready files will be in the `dist/` directory.

## Development Conventions

### Environment Setup

```bash
pnpm install          # install dependencies
pnpm dev              # start Vite on http://localhost:5173
PNPM_TEST_BASE_URL=http://localhost:5173 pnpm playwright test  # see testing.md for details
```

Use **pnpm** for scripts. The dev server will warn if the port is taken; adjust with `pnpm dev --port <port> --host 0.0.0.0` and pass the same URL to Playwright.

### Coding Conventions

-   **Components**: colocate feature-specific components under `src/components/<feature>`. Shared primitives belong in `src/components/ui`.
-   **State**: extend `src/store.ts` with new selectors/actions rather than adding ad-hoc React state. Persisted settings belong in the Zustand partializer.
-   **Styling**: Tailwind for layout + utilities. If a style is reused, promote it to `src/index.css` (see `.header-button`, `.stage-color-*`, `.scrollbar-themed`).
-   **Data**: `PumpCard` is the canonical representation of a pump, now reused on both Kanban and Scheduling. If you need different drag behavior, adjust the `draggableConfig` prop instead of duplicating markup.

### Feature Tips

-   **Legend Filters**: `schedulingStageFilters` should only influence the scheduling view. If you need a new quick filter, keep it scoped and let the global `filters` state continue to affect every page.
-   **Sorting**: Respect `sortField` + `sortDirection` when listing pumps. Import `sortPumps` rather than rolling custom sorts.
-   **Calendar Layout**: `MainCalendarGrid` assumes six weeks of data and uses the stage filter set to drop non-selected events. When modifying the timeline, ensure `projectSegmentsToWeek` remains pure.

### How to Add a Feature

1.  **Plan**: capture goals in `docs/README.md` (link to any new design doc).
2.  **Update Store**: add actions/selectors and persist state when needed.
3.  **Implement UI**: reuse `PumpCard`, `Button`, etc. to keep styling consistent.
4.  **Document**: update README and/or `docs/` with any new workflows, configs, or env vars.
5.  **Test**: run `pnpm test` and the relevant Playwright spec before opening a PR.

## Testing

### Unit & Integration (Vitest)

```bash
pnpm test              # run all suites
pnpm test src/store.ts # run a specific file
```

Vitest covers hooks, the Zustand store, scheduling helpers, and core components. Add new specs under `src/` or `tests/components` as appropriate.

### End-to-End (Playwright)

Playwright tests live in `tests/e2e`. The config expects a running dev server; set the base URL with an environment variable:

```bash
pnpm dev --port 5173 &           # start Vite
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173 pnpm playwright test
```

Useful scripts:

-   `pnpm playwright test tests/e2e/scheduling-enhanced.spec.ts --project=chromium`
-   `pnpm playwright test --headed --project=chromium` (interactive)
-   `pnpm playwright test --ui` (Playwright Test UI)

### Verifying the Stage Legend Filters

1.  Seed a few events by dragging jobs from the backlog to the calendar.
2.  Click one of the legend buttons (`data-stage-filter="FABRICATION"`).
3.  Ensure only events whose `data-stage` matches remain.
4.  Click the same button again to clear the quick filter.

The `stage legend filters calendar events` test inside `tests/e2e/scheduling-enhanced.spec.ts` automates this workflow. If it fails, confirm:

-   `schedulingStageFilters` is wired through `SchedulingView` to `MainCalendarGrid`.
-   Legend buttons have the `data-stage-filter` attribute and call `toggleSchedulingStageFilter`.
-   Playwright is pointed at the correct dev server port.

### Linting & Type Checking

-   `pnpm lint`
-   `pnpm tsc --noEmit`

Run these before publishing a PR.

## Deployment

### Prerequisites

-   Node.js 18+ installed locally
-   pnpm package manager
-   Git repository access
-   Hosting platform account

### Building for Production

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# The dist/ directory contains production-ready files
```

### Deployment Options

#### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment with automatic builds and deployments.

1.  **Push to GitHub**
    ```bash
    git push origin main
    ```

2.  **Connect to Vercel**
    -   Go to https://vercel.com
    -   Click "New Project"
    -   Select your GitHub repository
    -   Vercel auto-detects Vite configuration
    -   Click "Deploy"

3.  **Environment Variables** (if using Supabase)
    -   In Vercel dashboard, go to Settings > Environment Variables
    -   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
    -   Redeploy

#### Option 2: Netlify

1.  **Push to GitHub**
    ```bash
    git push origin main
    ```

2.  **Connect to Netlify**
    -   Go to https://app.netlify.com
    -   Click "New site from Git"
    -   Select your GitHub repository
    -   Build command: `pnpm build`
    -   Publish directory: `dist`
    -   Click "Deploy site"

3.  **Environment Variables**
    -   Go to Site settings > Build & deploy > Environment
    -   Add required variables
    -   Trigger redeploy

#### Option 3: AWS S3 + CloudFront

1.  **Build the application**
    ```bash
    pnpm build
    ```

2.  **Create S3 bucket**
    -   Go to AWS S3 console
    -   Create new bucket (e.g., `pumptracker-lite`)
    -   Enable static website hosting
    -   Upload contents of `dist/` folder

3.  **Set up CloudFront**
    -   Create CloudFront distribution
    -   Point origin to S3 bucket
    -   Set default root object to `index.html`
    -   Configure error handling for SPA

4.  **Deploy**
    ```bash
    aws s3 sync dist/ s3://pumptracker-lite/
    ```

#### Option 4: Docker

1.  **Create Dockerfile**
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

2.  **Create nginx.conf**
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

3.  **Build and push**
    ```bash
    docker build -t pumptracker-lite .
    docker tag pumptracker-lite your-registry/pumptracker-lite:latest
    docker push your-registry/pumptracker-lite:latest
    ```

#### Option 5: Traditional Web Server (Apache/Nginx)

1.  **Build the application**
    ```bash
    pnpm build
    ```

2.  **Copy dist folder to server**
    ```bash
    scp -r dist/ user@server:/var/www/pumptracker-lite/
    ```

3.  **Configure Nginx**
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

4.  **Configure Apache**
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

### Post-Deployment Checklist

-   [ ] Test application in production environment
-   [ ] Verify all routes work correctly
-   [ ] Check console for errors
-   [ ] Test filters and search functionality
-   [ ] Test Kanban drag-and-drop
-   [ ] Verify data persistence in local storage
-   [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
-   [ ] Test on mobile devices
-   [ ] Set up monitoring/error tracking
-   [ ] Configure backups if using cloud storage
-   [ ] Set up SSL/TLS certificate
-   [ ] Configure domain DNS records

### Performance Optimization

#### Enable Gzip Compression

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

#### Enable Browser Caching

Set appropriate cache headers for static assets (already configured in examples above).

#### Monitor Performance

-   Use Lighthouse for performance audits
-   Monitor Core Web Vitals
-   Set up error tracking (e.g., Sentry)
-   Monitor uptime with services like Pingdom

### Troubleshooting

#### Blank Page on Load

**Cause**: Incorrect routing configuration
**Solution**: Ensure all routes fall back to `index.html`

#### 404 on Refresh

**Cause**: Server not configured for SPA
**Solution**: Configure server to serve `index.html` for all routes

#### Styles Not Loading

**Cause**: Incorrect asset paths
**Solution**: Verify `base` in `vite.config.ts` matches deployment path

#### Data Not Persisting

**Cause**: Local storage disabled or cleared
**Solution**: Check browser local storage settings, consider cloud backend

### Rollback Procedure

#### Vercel/Netlify
-   Go to deployments history
-   Click "Redeploy" on previous version

#### Manual Deployment
```bash
# Keep previous version backup
mv /var/www/pumptracker-lite /var/www/pumptracker-lite.backup

# Restore previous version
cp -r /var/www/pumptracker-lite.backup /var/www/pumptracker-lite
```

### Security Considerations

1.  **HTTPS**: Always use HTTPS in production
2.  **CSP Headers**: Implement Content Security Policy
3.  **CORS**: Configure CORS if accessing external APIs
4.  **Input Validation**: All user inputs are validated client-side
5.  **XSS Protection**: React automatically escapes content
6.  **Regular Updates**: Keep dependencies updated with `pnpm update`

### Monitoring & Maintenance

#### Regular Tasks
-   Monitor error logs
-   Check performance metrics
-   Update dependencies monthly
-   Review security advisories
-   Backup data regularly

#### Recommended Tools
-   **Error Tracking**: Sentry, Rollbar
-   **Performance**: New Relic, Datadog
-   **Monitoring**: Uptime Robot, Pingdom
-   **Analytics**: Google Analytics, Plausible