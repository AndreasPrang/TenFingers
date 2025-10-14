FROM node:18-alpine

# Build argument für Git Commit Hash
ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=${GIT_COMMIT}

# Installiere curl für healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere nur Production Dependencies
RUN npm install --only=production

# Kopiere den Rest der Anwendung
COPY . .

# Exponiere Port
EXPOSE 4000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Starte die Anwendung in Production Mode
CMD ["npm", "start"]
