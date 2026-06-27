# Multistage build for React Vite App
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Install dependencies
RUN npm ci

# Build shared and web
RUN npm run build --workspace=packages/shared
WORKDIR /usr/src/app/apps/web
RUN npm run build

# Nginx production stage to serve static files
FROM nginx:alpine

# Copy custom nginx configuration to listen on port 5173 and support SPA routing
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 5173;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
