# Build stage
FROM node:24.12.0-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
# Pre-compress static assets
# Switch to a faster domestic mirror for apk
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add gzip && \
    find build -type f -regex ".*\.\(html\|js\|css\|json\)$" -exec gzip -9 -k {} \;


# Run stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
# Use the nginx:alpine envsubst template mechanism so BACKEND_HOST /
# NGINX_RESOLVER can be injected at runtime (Kubernetes Service name vs
# docker-compose service name). Templates in /etc/nginx/templates/ are
# rendered to /etc/nginx/conf.d/ on startup.
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
