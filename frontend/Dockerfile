# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere alle Dependencies (benötigt für Build)
RUN npm install

# Kopiere den Rest der Anwendung
COPY . .

# Build-Argumente für API URL und Version
ARG REACT_APP_API_URL=/api
ARG REACT_APP_GIT_COMMIT=unknown
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GIT_COMMIT=$REACT_APP_GIT_COMMIT

# Lese Version aus package.json
RUN PACKAGE_VERSION=$(node -p "require('./package.json').version") && \
    echo "REACT_APP_VERSION=$PACKAGE_VERSION" >> .env.production.local

# Build für Production
RUN npm run build

# Production Stage
FROM nginx:alpine

# Kopiere Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiere gebaute Files von Build Stage
COPY --from=build /app/build /usr/share/nginx/html

# Exponiere Port
EXPOSE 80

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Starte nginx
CMD ["nginx", "-g", "daemon off;"]
