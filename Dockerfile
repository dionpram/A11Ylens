# Dedicated scanner-worker image. The frontend should be deployed separately.
# IMPORTANT: this container is NOT a network sandbox by itself. Deploy with
# private/metadata IP egress blocked at the host/VPC/firewall level.
FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    SCAN_WORKER_ENABLED=true \
    ALLOW_LOCAL_SCANS=false

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
RUN npx playwright install --with-deps chromium
COPY . .
RUN npm run build
RUN mkdir -p /app/.next /state && chown -R node:node /app /ms-playwright /state
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
