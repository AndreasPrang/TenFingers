FROM node:18-alpine

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Dependencies
RUN npm install

# Kopiere den Rest der Anwendung
COPY . .

# Exponiere Port
EXPOSE 4000

# Starte die Anwendung
CMD ["npm", "run", "dev"]
